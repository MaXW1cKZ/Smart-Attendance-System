from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.course import Course, Enrollment
from app.models.attendance import ClassSession, Attendance, AttendanceStatus
from app.models.logs import AdminLog
from app.schemas.courses import CourseCreate
from app.schemas.attendance import CreateAttendanceRequest, UpdateAttendanceRequest

router = APIRouter(prefix="/admin", tags=["admin"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def _log(
    db: AsyncSession,
    admin: User,
    action: str,
    target_type: str,
    target_id: Optional[int],
    detail: str,
) -> None:
    try:
        db.add(
            AdminLog(
                admin_id=admin.id,
                admin_email=admin.email,
                action=action,
                target_type=target_type,
                target_id=target_id,
                detail=detail,
                timestamp=datetime.now(),
            )
        )
        await db.commit()
    except Exception as e:
        print(f"[admin_log] {e}")


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_students = (
        await db.execute(select(func.count(User.id)).where(User.role == "student"))
    ).scalar() or 0
    total_teachers = (
        await db.execute(select(func.count(User.id)).where(User.role == "teacher"))
    ).scalar() or 0
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar() or 0
    total_sessions = (
        await db.execute(select(func.count(ClassSession.id)))
    ).scalar() or 0
    total_att = (await db.execute(select(func.count(Attendance.id)))).scalar() or 0

    present_count = (
        await db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE])
            )
        )
    ).scalar() or 0
    att_rate = round(present_count / total_att * 100, 1) if total_att > 0 else 0

    active_result = await db.execute(
        select(ClassSession)
        .options(selectinload(ClassSession.course))
        .where(ClassSession.is_active == True)
        .order_by(ClassSession.actual_start_time.desc())
    )
    active_sessions = active_result.scalars().all()
    log_result = await db.execute(
        select(AdminLog).order_by(desc(AdminLog.timestamp)).limit(5)
    )
    recent_logs = log_result.scalars().all()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "total_sessions": total_sessions,
        "total_attendance_records": total_att,
        "system_attendance_rate": att_rate,
        "active_sessions": [
            {
                "id": s.id,
                "course_name": s.course.name if s.course else "—",
                "course_code": s.course.course_code if s.course else "—",
                "week_number": s.week_number,
                "room": s.room,
                "started_at": s.actual_start_time,
            }
            for s in active_sessions
        ],
        "recent_logs": [
            {
                "id": l.id,
                "action": l.action,
                "detail": l.detail,
                "admin_email": l.admin_email,
                "timestamp": l.timestamp,
            }
            for l in recent_logs
        ],
    }


@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = select(User).order_by(desc(User.created_at))
    if role:
        q = q.where(User.role == role)
    if search:
        q = q.where(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )

    total = (
        await db.execute(select(func.count()).select_from(q.subquery()))
    ).scalar() or 0

    users = (await db.execute(q.offset(skip).limit(limit))).scalars().all()

    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in users
        ],
    }


@router.patch("/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    new_role = data.get("role")
    if new_role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    old_role = user.role
    user.role = new_role
    await db.commit()

    await _log(
        db,
        admin,
        "change_role",
        "user",
        user_id,
        f"{user.email}: {old_role} → {new_role}",
    )

    return {"message": f"Role updated to {new_role}", "user_id": user_id}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    email = user.email
    await db.delete(user)
    await db.commit()

    await _log(db, admin, "delete_user", "user", user_id, f"Deleted user: {email}")
    return {"message": f"User {email} deleted"}


@router.get("/courses")
async def list_all_courses(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    q = (
        select(Course, User.full_name, User.email)
        .join(User, Course.teacher_id == User.id)
        .order_by(desc(Course.id))
    )
    if search:
        q = q.where(
            Course.name.ilike(f"%{search}%") | Course.course_code.ilike(f"%{search}%")
        )

    total_q = select(func.count()).select_from(
        select(Course)
        .join(User, Course.teacher_id == User.id)
        .where(
            Course.name.ilike(f"%{search}%") | Course.course_code.ilike(f"%{search}%")
        )
        .subquery()
        if search
        else Course
    )
    total = (await db.execute(total_q)).scalar() or 0

    rows = (await db.execute(q.offset(skip).limit(limit))).fetchall()

    courses = []
    for course, teacher_name, teacher_email in rows:
        enroll_count = (
            await db.execute(
                select(func.count(Enrollment.id)).where(
                    Enrollment.course_id == course.id
                )
            )
        ).scalar() or 0
        session_count = (
            await db.execute(
                select(func.count(ClassSession.id)).where(
                    ClassSession.course_id == course.id
                )
            )
        ).scalar() or 0
        courses.append(
            {
                "id": course.id,
                "course_code": course.course_code,
                "section": course.section,
                "name": course.name,
                "semester": course.semester,
                "academic_year": course.academic_year,
                "day_of_week": course.day_of_week,
                "teacher_name": teacher_name,
                "teacher_email": teacher_email,
                "enrollment_count": enroll_count,
                "session_count": session_count,
            }
        )

    return {"courses": courses, "total": total}


@router.post("/courses")
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if course_data.teacher_id:
        teacher = await db.get(User, course_data.teacher_id)
        if not teacher or teacher.role != "teacher":
            raise HTTPException(status_code=400, detail="Invalid teacher assigned")

    new_course = Course(**course_data.dict())

    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    await _log(
        db,
        admin,
        "create_course",
        "course",
        new_course.id,
        f"Created course: {new_course.course_code}: {new_course.name}",
    )

    return {"message": "Course created successfully", "course_id": new_course.id}


@router.delete("/courses/{course_id}")
async def admin_delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    name = f"{course.course_code}: {course.name}"
    await db.delete(course)
    await db.commit()

    await _log(
        db, admin, "delete_course", "course", course_id, f"Deleted course: {name}"
    )
    return {"message": f"Course '{name}' deleted"}


@router.post("/courses/{course_id}/enroll")
async def admin_enroll_student(
    course_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    student_email = data.get("student_email", "").strip()
    if not student_email:
        raise HTTPException(status_code=400, detail="student_email is required")

    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    result = await db.execute(
        select(User).where(User.email == student_email, User.role == "student")
    )
    student = result.scalars().first()
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

    await _log(
        db,
        admin,
        "enroll_student",
        "enrollment",
        course_id,
        f"Enrolled {student_email} → {course.course_code}: {course.name}",
    )
    return {
        "message": f"{student.full_name} enrolled into {course.course_code}",
        "student_id": student.id,
        "course_id": course_id,
    }


@router.delete("/courses/{course_id}/enroll/{student_id}")
async def admin_remove_enrollment(
    course_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
        )
    )
    enrollment = result.scalars().first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    student = await db.get(User, student_id)
    course = await db.get(Course, course_id)
    await db.delete(enrollment)
    await db.commit()

    await _log(
        db,
        admin,
        "remove_enrollment",
        "enrollment",
        course_id,
        f"Removed {student.email if student else student_id} from "
        f"{course.course_code if course else course_id}",
    )
    return {"message": "Enrollment removed"}


@router.get("/logs")
async def get_admin_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(AdminLog).order_by(desc(AdminLog.timestamp)).offset(skip).limit(limit)
    )
    logs = result.scalars().all()
    total = (await db.execute(select(func.count(AdminLog.id)))).scalar() or 0

    return {
        "total": total,
        "logs": [
            {
                "id": l.id,
                "admin_email": l.admin_email,
                "action": l.action,
                "target_type": l.target_type,
                "target_id": l.target_id,
                "detail": l.detail,
                "timestamp": l.timestamp,
            }
            for l in logs
        ],
    }


@router.get("/users/{user_id}/courses")
async def get_student_courses(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get all courses a student is enrolled in — for admin StudentAttendanceHistory page."""
    result = await db.execute(
        select(Course)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .where(Enrollment.student_id == user_id)
        .order_by(Course.name)
    )
    courses = result.scalars().all()
    return [
        {
            "id": c.id,
            "course_code": c.course_code,
            "name": c.name,
            "section": c.section,
            "semester": c.semester,
            "academic_year": c.academic_year,
        }
        for c in courses
    ]


@router.put("/attendance/{attendance_id}")
async def update_attendance(
    attendance_id: int,
    req: UpdateAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    old_status = (
        record.status.value if hasattr(record.status, "value") else str(record.status)
    )
    record.status = req.status
    await db.commit()
    await _log(
        db,
        admin,
        "update_attendance",
        "attendance",
        record.id,
        f"Changed status from {old_status} to {req.status}",
    )

    return {"message": "Attendance updated successfully"}


@router.get("/sessions/{session_id}/attendance")
async def get_session_attendance_admin(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(ClassSession).where(ClassSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(select(Course).where(Course.id == session.course_id))
    course = result.scalars().first()

    result = await db.execute(
        select(Attendance).where(Attendance.session_id == session_id)
    )
    records = result.scalars().all()

    # 👇 แปลง Course Object เป็น Dict ป้องกันปัญหา FastAPI Serialize (Error 500)
    course_data = (
        {"id": course.id, "course_code": course.course_code, "name": course.name}
        if course
        else None
    )

    return {
        "course": course_data,
        "records": [
            {
                "id": r.id,
                "student_id": r.student_id,
                "status": r.status.value
                if hasattr(r.status, "value")
                else str(r.status).split(".")[-1]
                if r.status
                else "absent",
                "score": getattr(r, "score", None),
                "timestamp": r.timestamp,
            }
            for r in records
        ],
    }


@router.post("/attendance")
async def create_attendance(
    req: CreateAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # เช็คว่ามีข้อมูลอยู่แล้วหรือยัง
    result = await db.execute(
        select(Attendance).where(
            Attendance.session_id == req.session_id,
            Attendance.student_id == req.student_id,
        )
    )
    record = result.scalars().first()

    if record:
        record.status = AttendanceStatus(req.status)
    else:
        # สร้างใหม่
        record = Attendance(
            session_id=req.session_id,
            student_id=req.student_id,
            status=AttendanceStatus(req.status),
            timestamp=datetime.now(),
            confidence_score=100,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    return {"message": "Attendance created", "attendance_id": record.id}
