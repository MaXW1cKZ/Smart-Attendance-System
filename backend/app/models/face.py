from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    embedding_vector = Column(JSON, nullable=False)  # เก็บ Vector หน้า
    image_path = Column(String, nullable=True)  # เก็บ Path รูป
    model_name = Column(String, default="Facenet512")

    user = relationship("User", back_populates="face_embeddings")
