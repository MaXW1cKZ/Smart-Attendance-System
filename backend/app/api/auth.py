from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.users import User
from app.core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # 1. ค้นหา User จาก Email (form_data.username จะเก็บ email)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # 2. ถ้าไม่เจอ User หรือ Password ไม่ถูก
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. สร้าง Token
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})

    # 4. ส่ง Token กลับไป
    return {"access_token": access_token, "token_type": "bearer"}
