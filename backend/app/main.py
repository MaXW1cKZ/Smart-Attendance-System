from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base

# Import Routers
from app.api import users, auth, face, courses

# Import Models (เพื่อให้ create_all เห็นตารางและสร้างใน DB)
from app.models.users import User
from app.models.face import FaceEmbedding
from app.models.attendance import ClassSession, Attendance

app = FastAPI(title="Smart Attendance API", version="1.0.0")

# --- ตั้งค่า CORS ---
origins = [
    "http://localhost:5173",  # React
    "http://127.0.0.1:5173",  # React IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------

# ลงทะเบียน Router
app.include_router(users.router, tags=["Users"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(face.router, tags=["Face Recognition"])
app.include_router(courses.router, tags=["Courses"])


@app.on_event("startup")
async def startup():
    # สร้างตารางทั้งหมด ลง Database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "Smart Attendance API is running!"}
