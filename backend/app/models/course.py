from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, unique=True, index=True, nullable=False) # รหัสวิชา เช่น 010123
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    semester = Column(String, nullable=False)      # เช่น 1/2023
    academic_year = Column(String, nullable=False) 
    
    # อาจารย์ผู้สอน (Owner)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # ความสัมพันธ์
    teacher = relationship("app.models.user.User", backref="courses_taught")
    enrollments = relationship("Enrollment", back_populates="course")
    sessions = relationship("app.models.attendance.ClassSession", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    # ความสัมพันธ์
    student = relationship("app.models.user.User", backref="enrollments")
    course = relationship("Course", back_populates="enrollments")