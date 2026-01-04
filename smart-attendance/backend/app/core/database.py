from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# สร้าง Engine
engine = create_async_engine(DATABASE_URL, echo=True)

# สร้าง SessionLocal
SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Dependency สำหรับใช้ใน API
async def get_db():
    async with SessionLocal() as session:
        yield session