from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_password_hash

from app.core.database import get_db
from app.models.users import User
from app.schemas import UserCreate, UserResponse

router = APIRouter()

@router.post("/users/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # ตรวจสอบว่าอีเมลนี้มีอยู่แล้วหรือไม่
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # เข้ารหัสรหัสผ่าน
    hashed_password = get_password_hash(user.password)

    # สร้างผู้ใช้ใหม่
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    #บันทึกลง Database
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user
