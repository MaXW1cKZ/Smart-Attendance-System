from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, time


from app.core.database import get_db
from app.models.users import User
from app.models.course import Course, Enrollment
from app.models.attendance import ClassSession, Attendance, AttendanceStatus
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()


class CourseCreate(BaseModel):
    course_code: str
    section: str
    name: str
    semester: str
    academic_year: str
    day_of_week: str
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    use_scoring: bool = True
    score_present: float = 1.0
    score_late: float = 0.5
    attendance_threshold: int = 80
    late_after_minutes: int = 15
    absent_after_minutes: int = 60


class CourseResponse(BaseModel):
    id: int
    course_code: str
    section: str
    name: str
    semester: str
    academic_year: str
    day_of_week: str
    start_time: time
    end_time: time
    teacher_id: int
    use_scoring: bool
    score_present: float
    score_late: float
    attendance_threshold: int
    late_after_minutes: int
    absent_after_minutes: int

    class Config:
        from_attributes = True


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    use_scoring: Optional[bool] = None
    score_present: Optional[float] = None
    score_late: Optional[float] = None
    attendance_threshold: Optional[int] = None
    late_after_minutes: Optional[int] = None
    absent_after_minutes: Optional[int] = None


class StartSessionRequest(BaseModel):
    course_id: int
    topic: Optional[str] = None
    room: Optional[str] = None


@router.post("/courses/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s_time = datetime.strptime(course_data.start_time, "%H:%M").time()
    e_time = datetime.strptime(course_data.end_time, "%H:%M").time()

    new_course = Course(
        course_code=course_data.course_code,
        section=course_data.section,
        name=course_data.name,
        semester=course_data.semester,
        academic_year=course_data.academic_year,
        day_of_week=course_data.day_of_week,
        start_time=s_time,
        end_time=e_time,
        teacher_id=current_user.id,
        use_scoring=course_data.use_scoring,
        score_present=course_data.score_present,
        score_late=course_data.score_late,
        attendance_threshold=course_data.attendance_threshold,
        late_after_minutes=course_data.late_after_minutes,
        absent_after_minutes=course_data.absent_after_minutes,
    )
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)
    return new_course


@router.get("/courses/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Course).where(Course.teacher_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/student/my-courses", response_model=List[CourseResponse])
async def get_student_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Course)
        .join(Enrollment, Course.id == Enrollment.course_id)
        .where(Enrollment.student_id == current_user.id)
    )
    return result.scalars().all()


@router.patch("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_fields = {
        "name",
        "section",
        "day_of_week",
        "use_scoring",
        "score_present",
        "score_late",
        "attendance_threshold",
        "late_after_minutes",
        "absent_after_minutes",
    }
    for field in update_fields:
        val = getattr(data, field)
        if val is not None:
            setattr(course, field, val)

    if data.start_time is not None:
        course.start_time = datetime.strptime(data.start_time, "%H:%M").time()
    if data.end_time is not None:
        course.end_time = datetime.strptime(data.end_time, "%H:%M").time()

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(course)
    await db.commit()
    return {"message": f"Course '{course.name}' deleted"}


@router.get("/courses/search/{course_code}")
async def search_course(course_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course, User.full_name)
        .join(User, Course.teacher_id == User.id)
        .where(Course.course_code == course_code)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    course, teacher_name = row
    return {
        "id": course.id,
        "course_code": course.course_code,
        "name": course.name,
        "section": course.section,
        "day_of_week": course.day_of_week,
        "teacher_name": teacher_name,
    }


@router.post("/courses/enroll")
async def enroll_course(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course_code = data.get("course_code")
    result = await db.execute(select(Course).where(Course.course_code == course_code))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    check = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course.id,
            Enrollment.student_id == current_user.id,
        )
    )
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Already enrolled")

    db.add(Enrollment(course_id=course.id, student_id=current_user.id))
    await db.commit()
    return {"message": "Enrolled successfully"}


@router.post("/sessions/start")
async def start_new_session(
    req: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == req.course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check no other session is already live
    active_check = await db.execute(
        select(ClassSession)
        .join(Course)
        .where(
            Course.teacher_id == current_user.id,
            ClassSession.is_active == True,
        )
    )
    existing = active_check.scalars().first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Session #{existing.id} is still live. Please end it first.",
        )

    # Auto-increment week number
    sessions_result = await db.execute(
        select(ClassSession).where(ClassSession.course_id == req.course_id)
    )
    existing_sessions = sessions_result.scalars().all()
    next_week_number = len(existing_sessions) + 1

    now = datetime.now()
    new_session = ClassSession(
        course_id=req.course_id,
        week_number=next_week_number,
        date=now.date(),
        start_time=course.start_time,
        end_time=course.end_time,
        is_active=True,
        actual_start_time=now,
        actual_end_time=None,
        topic=req.topic,
        room=req.room,
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    return {
        "status": "started",
        "session_id": new_session.id,
        "week_number": new_session.week_number,
        "started_at": now,
        "course_name": course.name,
        "course_code": course.course_code,
        "late_after_minutes": course.late_after_minutes,
        "absent_after_minutes": course.absent_after_minutes,
    }


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ClassSession)
        .options(selectinload(ClassSession.course))
        .where(ClassSession.id == session_id)
    )
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")

    now = datetime.now()
    session.is_active = False
    session.actual_end_time = now

    enrollments_result = await db.execute(
        select(Enrollment).where(Enrollment.course_id == session.course_id)
    )
    all_enrolled = enrollments_result.scalars().all()

    attended_result = await db.execute(
        select(Attendance.student_id).where(Attendance.session_id == session_id)
    )
    attended_ids = {row[0] for row in attended_result.fetchall()}

    for enrollment in all_enrolled:
        if enrollment.student_id not in attended_ids:
            db.add(
                Attendance(
                    session_id=session_id,
                    student_id=enrollment.student_id,
                    status=AttendanceStatus.ABSENT,
                    timestamp=now,
                    confidence_score=0,
                )
            )

    await db.commit()
    return {
        "status": "finished",
        "session_id": session_id,
        "ended_at": now,
        "duration_minutes": int((now - session.actual_start_time).total_seconds() / 60)
        if session.actual_start_time
        else 0,
    }


@router.get("/courses/all", response_model=List[CourseResponse])
async def get_all_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin only — returns every course in the system."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(Course).order_by(Course.name))
    return result.scalars().all()


@router.get("/courses/{course_id}/sessions")
async def get_course_sessions(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    is_teacher = course.teacher_id == current_user.id
    if not is_teacher:
        enroll_check = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == current_user.id,
            )
        )
        is_student = enroll_check.scalars().first() is not None
        if not is_student:
            raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(ClassSession)
        .where(ClassSession.course_id == course_id)
        .order_by(ClassSession.week_number)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "week_number": s.week_number,
            "date": s.date,
            "topic": s.topic,
            "room": s.room,
            "is_active": s.is_active,
            "actual_start_time": s.actual_start_time,
            "actual_end_time": s.actual_end_time,
        }
        for s in sessions
    ]


@router.get("/sessions/active")
async def get_active_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(ClassSession)
        .join(Course)
        .where(ClassSession.is_active == True, Course.teacher_id == current_user.id)
    )
    result = await db.execute(stmt)
    session = result.scalars().first()
    return session


@router.get("/sessions/{session_id}/attendance")
async def get_session_attendance(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess_result = await db.execute(
        select(ClassSession)
        .options(selectinload(ClassSession.course))
        .where(ClassSession.id == session_id)
    )
    session = sess_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    is_teacher = session.course.teacher_id == current_user.id
    enroll_check = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == session.course_id,
            Enrollment.student_id == current_user.id,
        )
    )
    is_student = enroll_check.scalars().first() is not None

    if not is_teacher and not is_student:
        raise HTTPException(status_code=403, detail="Not authorized")

    att_result = await db.execute(
        select(Attendance, User.full_name, User.email)
        .join(User, Attendance.student_id == User.id)
        .where(Attendance.session_id == session_id)
        .order_by(User.full_name)
    )
    rows = att_result.fetchall()

    course = session.course
    records = []
    for att, full_name, email in rows:
        if course.use_scoring:
            score = (
                course.score_present
                if att.status == AttendanceStatus.PRESENT
                else course.score_late
                if att.status == AttendanceStatus.LATE
                else 0.0
            )
        else:
            score = None

        records.append(
            {
                "attendance_id": att.id,
                "student_id": att.student_id,
                "name": full_name or "Unknown",
                "email": email or "",
                "status": att.status,
                "timestamp": att.timestamp,
                "confidence_score": att.confidence_score,
                "score": score,
            }
        )

    return {
        "session": {
            "id": session.id,
            "week_number": session.week_number,
            "date": session.date,
            "topic": session.topic,
            "room": session.room,
            "actual_start_time": session.actual_start_time,
            "actual_end_time": session.actual_end_time,
        },
        "course": {
            "id": course.id,
            "name": course.name,
            "course_code": course.course_code,
            "use_scoring": course.use_scoring,
            "score_present": course.score_present,
            "score_late": course.score_late,
            "attendance_threshold": course.attendance_threshold,
            "late_after_minutes": course.late_after_minutes,
            "absent_after_minutes": course.absent_after_minutes,
        },
        "records": records,
        "summary": {
            "total": len(records),
            "present": sum(
                1 for r in records if r["status"] == AttendanceStatus.PRESENT
            ),
            "late": sum(1 for r in records if r["status"] == AttendanceStatus.LATE),
            "absent": sum(1 for r in records if r["status"] == AttendanceStatus.ABSENT),
        },
    }


@router.patch("/attendance/{attendance_id}")
async def update_attendance_status(
    attendance_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Attendance)
        .options(selectinload(Attendance.session).selectinload(ClassSession.course))
        .where(Attendance.id == attendance_id)
    )
    att = result.scalars().first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    is_admin = current_user.role == "admin"
    is_owner = att.session.course.teacher_id == current_user.id
    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_status = data.get("status")
    if new_status not in [s.value for s in AttendanceStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")

    att.status = new_status
    await db.commit()
    return {"message": "Updated", "status": new_status}


@router.get("/courses/{course_id}/report")
async def get_course_report(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    is_teacher = course.teacher_id == current_user.id
    enroll_check = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id, Enrollment.student_id == current_user.id
        )
    )
    is_student = enroll_check.scalars().first() is not None

    if not is_teacher and not is_student:
        raise HTTPException(status_code=403, detail="Not authorized")

    enroll_result = await db.execute(
        select(Enrollment, User.full_name, User.email)
        .join(User, Enrollment.student_id == User.id)
        .where(Enrollment.course_id == course_id)
    )
    enrolled = enroll_result.fetchall()

    sess_result = await db.execute(
        select(ClassSession)
        .where(
            ClassSession.course_id == course_id,
            ClassSession.actual_end_time != None,
        )
        .order_by(ClassSession.week_number)
    )
    sessions = sess_result.scalars().all()
    total_sessions = len(sessions)

    att_result = await db.execute(
        select(Attendance).join(ClassSession).where(ClassSession.course_id == course_id)
    )
    all_att = att_result.scalars().all()

    att_map: dict = {}
    for att in all_att:
        att_map.setdefault(att.student_id, {})[att.session_id] = att

    students_report = []
    for enrollment, full_name, email in enrolled:
        sid = enrollment.student_id
        student_att = att_map.get(sid, {})

        present = sum(
            1 for a in student_att.values() if a.status == AttendanceStatus.PRESENT
        )
        late = sum(1 for a in student_att.values() if a.status == AttendanceStatus.LATE)
        absent = sum(
            1 for a in student_att.values() if a.status == AttendanceStatus.ABSENT
        )

        if course.use_scoring:
            total_score = (present * course.score_present) + (late * course.score_late)
            max_score = total_sessions * course.score_present
        else:
            total_score = None
            max_score = None

        attendance_pct = (
            round((present + late) / total_sessions * 100, 1)
            if total_sessions > 0
            else 0
        )
        passed = attendance_pct >= course.attendance_threshold

        students_report.append(
            {
                "student_id": sid,
                "name": full_name or "Unknown",
                "email": email or "",
                "present": present,
                "late": late,
                "absent": absent,
                "total_score": round(total_score, 2)
                if total_score is not None
                else None,
                "max_score": round(max_score, 2) if max_score is not None else None,
                "attendance_pct": attendance_pct,
                "passed": passed,
            }
        )

    students_report.sort(key=lambda x: x["name"])

    return {
        "course": {
            "id": course.id,
            "name": course.name,
            "course_code": course.course_code,
            "use_scoring": course.use_scoring,
            "score_present": course.score_present,
            "score_late": course.score_late,
            "attendance_threshold": course.attendance_threshold,
            "late_after_minutes": course.late_after_minutes,
            "absent_after_minutes": course.absent_after_minutes,
        },
        "total_sessions": total_sessions,
        "students": students_report,
    }


@router.get("/student/face-status")
async def get_face_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """คืน { registered: bool } บอกว่า student ลง face แล้วหรือยัง"""
    from app.models.face import FaceEmbedding

    result = await db.execute(
        select(FaceEmbedding).where(FaceEmbedding.user_id == current_user.id)
    )
    registered = result.scalars().first() is not None
    return {"registered": registered}


@router.get("/courses/browse")
async def browse_courses(
    search: Optional[str] = None,
    day: Optional[str] = None,
    semester: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    นักศึกษาดูรายวิชาทั้งหมดในระบบ พร้อม filter/search
    คืน enrolled: true ถ้า student ลงทะเบียนวิชานั้นแล้ว
    """
    q = (
        select(Course, User.full_name)
        .join(User, Course.teacher_id == User.id)
        .order_by(Course.course_code)
    )
    if search:
        term = f"%{search}%"
        q = q.where(Course.name.ilike(term) | Course.course_code.ilike(term))
    if day:
        q = q.where(Course.day_of_week == day)
    if semester:
        q = q.where(Course.semester == semester)

    total = (
        await db.execute(select(func.count()).select_from(q.subquery()))
    ).scalar() or 0

    rows = (await db.execute(q.offset(skip).limit(limit))).fetchall()

    my_enrollments = (
        (
            await db.execute(
                select(Enrollment.course_id).where(
                    Enrollment.student_id == current_user.id
                )
            )
        )
        .scalars()
        .all()
    )
    enrolled_ids = set(my_enrollments)

    return {
        "total": total,
        "courses": [
            {
                "id": c.id,
                "course_code": c.course_code,
                "section": c.section,
                "name": c.name,
                "semester": c.semester,
                "academic_year": c.academic_year,
                "day_of_week": c.day_of_week,
                "start_time": str(c.start_time)[:5],
                "end_time": str(c.end_time)[:5],
                "teacher_name": teacher_name,
                "enrolled": c.id in enrolled_ids,
            }
            for c, teacher_name in rows
        ],
    }


@router.get("/courses/search/{course_code}")
async def search_course(course_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course, User.full_name)
        .join(User, Course.teacher_id == User.id)
        .where(Course.course_code.ilike(course_code.strip()))
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    course, teacher_name = row
    return {
        "id": course.id,
        "course_code": course.course_code,
        "name": course.name,
        "section": course.section,
        "day_of_week": course.day_of_week,
        "teacher_name": teacher_name,
    }


@router.get("/courses/{course_id}/students")
async def get_course_students(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt = (
        select(User)
        .join(Enrollment, User.id == Enrollment.student_id)
        .where(Enrollment.course_id == course_id)
        .order_by(User.full_name)
    )
    result = await db.execute(stmt)
    students = result.scalars().all()

    return [
        {"id": s.id, "student_id": str(s.id), "name": s.full_name, "email": s.email}
        for s in students
    ]


@router.delete("/courses/{course_id}/students/{student_id}")
async def remove_student_from_course(
    course_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Teacher removes a student from their course."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    enroll_result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
        )
    )
    enrollment = enroll_result.scalars().first()
    if not enrollment:
        raise HTTPException(
            status_code=404, detail="Student not enrolled in this course"
        )

    await db.delete(enrollment)
    await db.commit()
    return {"message": "Student removed from course"}


@router.post("/courses/{course_id}/students/enroll")
async def teacher_enroll_student(
    course_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Teacher enrolls a student by email into their course."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    student_email = data.get("student_email", "").strip()
    if not student_email:
        raise HTTPException(status_code=400, detail="student_email is required")

    student_result = await db.execute(
        select(User).where(User.email == student_email, User.role == "student")
    )
    student = student_result.scalars().first()
    if not student:
        raise HTTPException(
            status_code=404, detail=f"Student '{student_email}' not found"
        )

    check = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student.id,
        )
    )
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Student is already enrolled")

    db.add(Enrollment(course_id=course_id, student_id=student.id))
    await db.commit()
    return {
        "message": f"{student.full_name} enrolled successfully",
        "student_id": student.id,
    }


@router.put("/{course_id}")
async def update_course(
    course_id: int, data: CourseUpdate, db: AsyncSession = Depends(get_db)
):
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalars().first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = data.dict()
    for key, value in update_data.items():
        if hasattr(course, key):
            setattr(course, key, value)

    await db.commit()
    await db.refresh(course)
    return {"message": "Settings saved successfully!"}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(ClassSession).where(ClassSession.id == session_id)
    result = await db.execute(stmt)
    session_obj = result.scalars().first()

    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session_obj)
    await db.commit()
    return {"message": "Session deleted permanently"}


@router.patch("/sessions/{session_id}")
async def update_session(
    session_id: int, update_data: dict, db: AsyncSession = Depends(get_db)
):
    stmt = select(ClassSession).where(ClassSession.id == session_id)
    result = await db.execute(stmt)
    session_obj = result.scalars().first()

    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    for key, value in update_data.items():
        if hasattr(session_obj, key):
            setattr(session_obj, key, value)

    await db.commit()
    await db.refresh(session_obj)
    return {"message": "Session updated"}


@router.get("/courses/{course_id}/overall-report")
async def get_course_overall_report(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    stmt_students = (
        select(User)
        .join(Enrollment, User.id == Enrollment.student_id)
        .where(Enrollment.course_id == course_id)
    )
    students = (await db.execute(stmt_students)).scalars().all()

    stmt_sessions = select(ClassSession.id).where(ClassSession.course_id == course_id)
    session_ids = (await db.execute(stmt_sessions)).scalars().all()

    records = []
    if session_ids:
        stmt_att = select(Attendance).where(Attendance.session_id.in_(session_ids))
        records = (await db.execute(stmt_att)).scalars().all()

    def _status_key(st) -> str:
        """DB column is String; may load as str or AttendanceStatus."""
        if st is None:
            return ""
        raw = getattr(st, "value", st)
        return str(raw).lower()

    report = []
    for student in students:
        student_atts = [r for r in records if r.student_id == student.id]

        present = sum(1 for r in student_atts if _status_key(r.status) == "present")
        late = sum(1 for r in student_atts if _status_key(r.status) == "late")
        absent = sum(1 for r in student_atts if _status_key(r.status) == "absent")
        # Attendance rows have no score column; derive from course scoring rules
        if course.use_scoring:
            total_score = present * float(course.score_present) + late * float(
                course.score_late
            )
        else:
            total_score = None

        report.append(
            {
                "student_id": str(student.id),
                "name": student.full_name,
                "email": student.email,
                "present": present,
                "late": late,
                "absent": absent,
                "total_score": total_score,
            }
        )

    return {
        "summary": {
            "total_students": len(students),
            "total_sessions": len(session_ids),
            "use_scoring": course.use_scoring,
        },
        "records": report,
    }
