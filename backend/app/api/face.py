# backend/app/api/face.py
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    status,
    BackgroundTasks,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from typing import List
import shutil
import os
from deepface import DeepFace

from app.core.database import get_db
from app.models.users import User
from app.models.face import (
    FaceEmbedding,
)  # ตรวจสอบใน models ว่ามี field image_path ไหม ถ้าไม่มีให้เพิ่ม
from app.core.security import get_current_user

router = APIRouter()

# สร้างโฟลเดอร์เก็บรูป
UPLOAD_DIR = "uploads/faces"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/faces/register", status_code=status.HTTP_201_CREATED)
async def register_face(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    รับรูปภาพ 5-10 รูป -> ลบข้อมูลเก่า -> แปลง Vector ใหม่ -> บันทึก
    """

    # 1. ลบข้อมูล Face Embedding เก่าของ User คนนี้ทิ้งก่อน (Re-register)
    # เพื่อป้องกันข้อมูลซ้ำซ้อนและทำให้แม่นยำขึ้น
    stmt = delete(FaceEmbedding).where(FaceEmbedding.user_id == current_user.id)
    await db.execute(stmt)

    # เคลียร์รูปเก่าในโฟลเดอร์ทิ้งด้วย (Optional)
    user_folder = os.path.join(UPLOAD_DIR, str(current_user.id))
    if os.path.exists(user_folder):
        shutil.rmtree(user_folder)
    os.makedirs(user_folder, exist_ok=True)

    success_count = 0
    errors = []

    for idx, file in enumerate(files):
        try:
            # ตั้งชื่อไฟล์ใหม่รันเลข 01, 02, ...
            file_extension = file.filename.split(".")[-1]
            new_filename = f"face_{idx + 1}.{file_extension}"
            file_path = os.path.join(user_folder, new_filename)

            # Save ลง Disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # ใช้ DeepFace หา Embedding
            embeddings = DeepFace.represent(
                img_path=file_path,
                model_name="Facenet512",
                enforce_detection=True,  # บังคับว่าต้องเจอหน้า (ถ้าไม่เจอให้ Error ไปเลย รูปนั้นจะได้ไม่ถูกบันทึก)
                detector_backend="opencv",  # ใช้ opencv จะเร็วกว่าสำหรับ Realtime
            )

            if not embeddings:
                continue

            vector_data = embeddings[0]["embedding"]

            # บันทึกลง DB
            new_face = FaceEmbedding(
                user_id=current_user.id,
                embedding_vector=vector_data,
                image_path=file_path,  # ⚠️ อย่าลืมเพิ่ม Column นี้ใน Table face_embeddings หรือสร้าง Table face_images แยกตาม ERD
                model_name="Facenet512",
            )
            db.add(new_face)
            success_count += 1

        except Exception as e:
            # ถ้ารูปไหน Error (เช่น ไม่เห็นหน้า) ข้ามรูปนั้นไป
            print(f"Skipping image {file.filename}: {e}")
            continue

    if success_count == 0:
        raise HTTPException(
            status_code=400, detail="No valid faces detected. Please try again."
        )

    current_user.has_face_registered = True
    db.add(current_user)
    await db.commit()

    return {
        "status": "success",
        "message": f"Registered {success_count} faces successfully",
        "user_id": current_user.id,
    }
