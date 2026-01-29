"""
Models package initialization
Import all models here to ensure SQLAlchemy can find them
"""

from app.models.users import User
from app.models.face import FaceEmbedding
from app.models.course import Course, Enrollment
from app.models.attendance import ClassSession, Attendance, AttendanceStatus

__all__ = [
    "User",
    "FaceEmbedding",
    "Course",
    "Enrollment",
    "ClassSession",
    "Attendance",
    "AttendanceStatus",
]
