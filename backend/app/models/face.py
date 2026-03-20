from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from pgvector.sqlalchemy import Vector


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    embedding_vector = Column(Vector(512), nullable=False)
    image_path = Column(String, nullable=True)
    model_name = Column(String, default="ArcFace")

    # Relationship
    user = relationship("User", back_populates="face_embeddings")
