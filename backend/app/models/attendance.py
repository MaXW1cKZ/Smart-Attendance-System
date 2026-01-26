from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

# สร้าง Enum สำหรับสถานะ
class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    LATE = "late"
    ABSENT = "absent"

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # ข้อมูลคาบเรียน
    start_time = Column(DateTime(timezone=True), nullable=False) # เวลาเริ่มคาบ
    end_time = Column(DateTime(timezone=True), nullable=False)   # เวลาจบคาบ
    
    is_active = Column(Boolean, default=False) # อาจารย์กดเปิดคาบหรือยัง?
    session_code = Column(String, nullable=True) # (เผื่อใช้) รหัสเข้าห้อง 4 ตัว
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ความสัมพันธ์
    course = relationship("app.models.course.Course", back_populates="sessions")
    attendance_records = relationship("Attendance", back_populates="session")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(String, default=AttendanceStatus.ABSENT) # present, late, absent
    check_in_time = Column(DateTime(timezone=True), nullable=True) # เวลาที่สแกนหน้าได้
    confidence_score = Column(Integer, nullable=True) # ความมั่นใจ AI (เช่น 98%)
    
    # ความสัมพันธ์
    session = relationship("ClassSession", back_populates="attendance_records")
    student = relationship("app.models.user.User", backref="attendance_history")