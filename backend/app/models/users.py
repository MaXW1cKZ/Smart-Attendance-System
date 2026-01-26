from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    
    # แก้ตรงนี้: nullable=True (เพราะ Google login ไม่มี password)
    hashed_password = Column(String, nullable=True) 
    
    full_name = Column(String, nullable=True)
    role = Column(String, default="student")
    
    # เพิ่มบรรทัดนี้: เก็บ Google ID กันคนชื่อซ้ำ หรือเอาไว้เช็ค
    google_id = Column(String, unique=True, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
