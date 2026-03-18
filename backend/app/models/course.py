from sqlalchemy import Column, Integer, String, ForeignKey, Time, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, index=True)
    section = Column(String)
    name = Column(String)
    semester = Column(String)
    academic_year = Column(String)
    day_of_week = Column(String)
    start_time = Column(Time)
    end_time = Column(Time)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    use_scoring = Column(Boolean, default=True)
    score_present = Column(Float, default=1.0)
    score_late = Column(Float, default=0.5)
    attendance_threshold = Column(Integer, default=80)
    late_after_minutes = Column(Integer, default=15)
    absent_after_minutes = Column(Integer, default=60)

    teacher = relationship("User", back_populates="courses")
    sessions = relationship(
        "ClassSession", back_populates="course", cascade="all, delete-orphan"
    )
    enrollments = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    student_id = Column(Integer, ForeignKey("users.id"))

    course = relationship("Course", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")
