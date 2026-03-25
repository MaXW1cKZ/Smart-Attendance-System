from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.models.face import FaceEmbedding
from pydantic import BaseModel
import numpy as np
import base64
import io
from PIL import Image
from insightface.app import FaceAnalysis

router = APIRouter()

# โหลด InsightFace model
_face_app = None


def get_face_app():
    global _face_app
    if _face_app is None:
        # ใช้ buffalo_sc: model เบา รองรับ CPU ไม่ต้องการ AVX
        _face_app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
    return _face_app


class FaceRegisterRequest(BaseModel):
    images: list[str]


def base64_to_image(base64_string: str) -> np.ndarray:
    if "base64," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    # InsightFace ต้องการ BGR
    return np.array(image)[:, :, ::-1]


def check_liveness_minifasnet(img_bgr: np.ndarray) -> dict:
    """
    TODO: อนาคตนำโมเดล MiniFASNet (.pth) มาโหลดและ inference ตรงนี้
    ตอนนี้จะจำลองว่าให้ผ่าน (True)
    💡 ถ้าอยากทดสอบว่าระบบบล็อคคนเอารูปมาสแกนได้ไหม ให้ลองแก้ "is_real": False ดูครับ
    """
    return {"is_real": True, "score": 0.98, "message": "Real face detected"}


@router.post("/student/register-face")
async def register_face(
    req: FaceRegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        face_app = get_face_app()
        new_face_records = []

        for img_base64 in req.images:
            img_bgr = base64_to_image(img_base64)
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
