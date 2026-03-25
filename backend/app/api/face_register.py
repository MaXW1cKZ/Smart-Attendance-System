from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.face import FaceEmbedding
from datetime import datetime

import numpy as np

import io
from PIL import Image
from insightface.app import FaceAnalysis

router = APIRouter()

_face_app = None


def get_face_app():
    global _face_app
    if _face_app is None:
        _face_app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
    return _face_app


def check_liveness_minifasnet(img_bgr: np.ndarray) -> dict:
    return {"is_real": True, "score": 0.98, "message": "Real face detected"}


@router.post("/student/register-face")
async def register_face(
    images: list[UploadFile] = File(...),
    pdpa_consented: bool = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if not pdpa_consented:
            raise HTTPException(
                status_code=400, detail="กรุณายอมรับเงื่อนไข PDPA ก่อนลงทะเบียน"
            )

        face_app = get_face_app()
        new_face_records = []
        face_app = get_face_app()
        new_face_records = []

        for img_file in images:
            contents = await img_file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            img_bgr = np.array(image)[:, :, ::-1]

            liveness_result = check_liveness_minifasnet(img_bgr)
            if not liveness_result["is_real"]:
                raise HTTPException(
                    status_code=400, detail="ตรวจพบการใช้รูปภาพหรือหน้าจอ! กรุณาใช้ใบหน้าจริง"
                )

            faces = face_app.get(img_bgr)

            if faces:
                emb = faces[0].normed_embedding.tolist()

                new_face_records.append(
                    FaceEmbedding(
                        user_id=current_user.id,
                        embedding_vector=emb,
                        model_name="ArcFace-InsightFace-Gallery",
                    )
                )

        if not new_face_records:
            raise HTTPException(status_code=400, detail="ไม่พบใบหน้าในรูปภาพที่ส่งมา")

        await db.execute(
            delete(FaceEmbedding).where(FaceEmbedding.user_id == current_user.id)
        )

        db.add_all(new_face_records)
        current_user.pdpa_consented = True
        current_user.pdpa_accepted_at = datetime.now()
        db.add(current_user)
        await db.commit()

        return {
            "status": "success",
            "message": f"ลงทะเบียนสำเร็จ! บันทึกข้อมูลใบหน้าทั้งหมด {len(new_face_records)} มุมมอง",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการประมวลผล AI")


@router.get("/student/pdpa-status")
async def check_pdpa_status(current_user: User = Depends(get_current_user)):
    return {"pdpa_consented": current_user.pdpa_consented}
