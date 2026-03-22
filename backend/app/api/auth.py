import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.database import get_db
from app.models.users import User
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.users import GoogleLoginRequest, UserCreate, UserResponse

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

_TEACHER_DOMAINS = set(
    d.strip()
    for d in os.getenv("TEACHER_DOMAINS", "it.kmitl.ac.th,kmitl.ac.th").split(",")
    if d.strip()
)
_ADMIN_EMAILS = set(
    e.strip().lower()
    for e in os.getenv("ADMIN_EMAILS", "admin@kmitl.ac.th").split(",")
    if e.strip()
)


_ALLOWED_DOMAINS = set(
    d.strip()
    for d in os.getenv("ALLOWED_DOMAINS", "kmitl.ac.th,it.kmitl.ac.th").split(",")
    if d.strip()
)


def is_allowed_email(email: str) -> bool:
    """Block any email not from an institution domain."""
    parts = email.lower().strip().split("@")
    if len(parts) != 2:
        return False
    domain = parts[1]
    # Accept exact match or any subdomain of an allowed domain
    return any(
        domain == allowed or domain.endswith("." + allowed)
        for allowed in _ALLOWED_DOMAINS
    )


def detect_role(email: str) -> str:
    """
    Priority order:
      1. admin   — email in ADMIN_EMAILS list
      2. teacher — non-numeric local + domain in TEACHER_DOMAINS
      3. student — numeric local (student ID number)
      4. student — default fallback
    """
    email = email.lower().strip()

    if email in _ADMIN_EMAILS:
        return "admin"

    parts = email.split("@")
    if len(parts) != 2:
        return "student"

    local, domain = parts[0], parts[1]

    if domain in _TEACHER_DOMAINS and not local.isdigit():
        return "teacher"

    return "student"


@router.post("/google-login")
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(
            request.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = id_info.get("email")
        name = id_info.get("name")
        google_id = id_info.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google Token")

    if not is_allowed_email(email):
        raise HTTPException(
            status_code=403,
            detail="กรุณาใช้อีเมลของสถาบัน (@kmitl.ac.th หรือ @it.kmitl.ac.th) เท่านั้น",
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        # ✅ Auto-detect role on first sign-up
        user = User(
            email=email,
            full_name=name,
            role=detect_role(email),
            google_id=google_id,
            hashed_password=None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_name": user.full_name,
        "user_id": user.id,
    }


# ── Password login ────────────────────────────────────────────────────────────
@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if not is_allowed_email(form_data.username):
        raise HTTPException(
            status_code=403,
            detail="กรุณาใช้อีเมลของสถาบัน (@kmitl.ac.th หรือ @it.kmitl.ac.th) เท่านั้น",
        )

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_name": user.full_name,
        "user_id": user.id,
    }
