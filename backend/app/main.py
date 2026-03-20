from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base

# Import Routers
from app.api import users, auth, courses, face_register, attendance_check, admin

# Import Models
from app.models.users import User
from app.models.face import FaceEmbedding
from app.models.attendance import ClassSession, Attendance
from app.models import logs

from sqlalchemy import text

app = FastAPI(title="Smart Attendance API", version="1.0.0")

origins = [
    "http://10.72.0.167",       # Production server
    "http://localhost:5173",    # Dev (Vite)
    "http://127.0.0.1:5173",
    "http://10.72.0.167.nip.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, tags=["Users"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(courses.router, tags=["Courses"])
app.include_router(face_register.router, tags=["student"])
app.include_router(attendance_check.router, tags=["Attendance"])
app.include_router(admin.router, tags=["Admin"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Enable pgvector extension ก่อนสร้างตาราง
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "Smart Attendance API is running!"}
