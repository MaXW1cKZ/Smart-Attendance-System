from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # ปิด SQL logging — echo=True ทำให้ช้ามากใน dev
    pool_size=10,  # เพิ่มจาก default 5 → รองรับ concurrent WS ได้มากขึ้น
    max_overflow=20,  # connection เพิ่มเติมช่วง peak
    pool_pre_ping=True,  # ตรวจ connection ก่อนใช้ (ป้องกัน stale connection)
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with SessionLocal() as session:
        yield session
