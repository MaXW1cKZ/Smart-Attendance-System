# backend/app/api/courses.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.users import User
from app.models.course import Course, Enrollment
from app.models.attendance import ClassSession, Attendance
from app.core.security import get_current_user
from pydantic import BaseModel

router = APIRouter()


# --- Schemas (ใช้เฉพาะในไฟล์นี้ หรือจะแยกไป folder schemas ก็ได้) ---
class CourseCreate(BaseModel):
    course_code: str
    name: str
    description: str = None
    semester: str
    academic_year: str


class CourseResponse(CourseCreate):
    id: int
    teacher_id: int

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    course_id: int
    start_time: datetime
    end_time: datetime
    session_code: str = None  # เผื่อใช้รหัสเข้าห้อง


# ---------------------------------------------------------


# 1. อาจารย์สร้างวิชาใหม่
@router.post("/courses/", response_model=CourseResponse)
async def create_course(
    course: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # เช็คว่าเป็น Teacher หรือ Admin เท่านั้น
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can create courses")

    # สร้าง Course
    new_course = Course(
        **course.dict(),
        teacher_id=current_user.id,  # ผูกกับอาจารย์คนปัจจุบัน
    )
    db.add(new_course)
    try:
        await db.commit()
        await db.refresh(new_course)
        return new_course
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating course: {str(e)}")


# 2. อาจารย์ดูวิชาที่ตัวเองสอน
@router.get("/courses/my-courses", response_model=List[CourseResponse])
async def get_my_courses(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(
        select(Course).where(Course.teacher_id == current_user.id)
    )
    return result.scalars().all()


# 3. เปิดคาบเรียน (Start Session) - จุดเริ่มต้นของการเช็คชื่อ!
@router.post("/sessions/start")
async def start_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # เช็คก่อนว่าเป็นเจ้าของวิชานี้ไหม
    result = await db.execute(select(Course).where(Course.id == session_data.course_id))
    course = result.scalars().first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You are not the teacher of this course"
        )

    # สร้าง Session
    new_session = ClassSession(
        course_id=session_data.course_id,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        session_code=session_data.session_code,
        is_active=True,  # ✅ เปิด Active ทันที แปลว่าระบบพร้อมรับสแกนหน้า
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    return {
        "status": "success",
        "session_id": new_session.id,
        "message": "Class started! Ready for attendance.",
    }


# 4. ดู Session ที่กำลัง Active อยู่ (สำหรับหน้า Dashboard)
@router.get("/sessions/active")
async def get_active_sessions(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # หา Session ที่ Active และเป็นวิชาของอาจารย์คนนี้
    stmt = (
        select(ClassSession)
        .join(Course)
        .where(ClassSession.is_active == True)
        .where(Course.teacher_id == current_user.id)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return sessions


# 5. ปิดคาบเรียน (End Session)
@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(ClassSession).where(ClassSession.id == session_id))
    session = result.scalars().first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False  # ปิดรับสแกน
    await db.commit()
    return {"status": "success", "message": "Class ended."}
