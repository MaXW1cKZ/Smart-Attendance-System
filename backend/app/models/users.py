from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student")  # student, teacher, admin
    google_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Relationships (ใช้ชื่อ String ทั้งหมด เพื่อตัดปัญหา Import) ---
    # 1. ข้อมูลใบหน้า
    face_embeddings = relationship(
        "FaceEmbedding",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # 2. วิชาที่สอน (สำหรับ Teacher)
    courses_taught = relationship("Course", back_populates="teacher")

    # 3. การลงทะเบียนเรียน (สำหรับ Student)
    enrollments = relationship("Enrollment", back_populates="student")

    # 4. ประวัติการเข้าเรียน (Attendance)
    attendance_records = relationship("Attendance", back_populates="student")
