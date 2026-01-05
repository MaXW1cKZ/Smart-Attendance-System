from fastapi import FastAPI
from app.core.database import engine, Base
from app.models import users
from app.api import users
from app.api import users, auth

app = FastAPI(title="Smart Attendance API", version="1.0.0")

app.include_router(users.router, tags=["Users"])
app.include_router(auth.router, tags=["Authentication"])

@app.on_event("startup")
async def startup():
    # สร้างตารางใน Database อัตโนมัติ (สำหรับ Dev mode)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Smart Attendance API is running!"}