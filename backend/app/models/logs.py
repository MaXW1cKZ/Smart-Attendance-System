from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AdminLog(Base):
    """Records every action taken by an admin — role changes, deletions, enrollments."""

    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    admin_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.now, nullable=False)

    admin = relationship("User", foreign_keys=[admin_id])
