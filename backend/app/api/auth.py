from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.database import get_db
from app.models.users import User
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas import UserCreate, UserResponse, GoogleLoginRequest

router = APIRouter()

# ⚠️ เอา Client ID ของคุณมาใส่ตรงนี้ (หรือดึงจาก .env ก็ได้)
GOOGLE_CLIENT_ID = "291635293570-f2ng0herj90g22t9oh05njonaas4l8dj.apps.googleusercontent.com"

@router.post("/google-login")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    token = request.token
    
    try:
        # 1. ตรวจสอบ Token กับ Google
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        name = id_info.get("name")
        google_id = id_info.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token")

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google Token")

    # 2. เช็คว่ามี User นี้ในระบบหรือยัง
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    # 3. ถ้ายังไม่มี -> สมัครสมาชิกให้อัตโนมัติ
    if not user:
        user = User(
            email=email,
            full_name=name,
            role="student",  # ค่าเริ่มต้น
            google_id=google_id,
            hashed_password=None # ไม่มีรหัสผ่าน
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # 4. สร้าง Access Token (JWT) ของระบบเรา
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )

    return {"access_token": access_token, "token_type": "bearer"}

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
