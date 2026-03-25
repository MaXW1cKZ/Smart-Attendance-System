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

# โหลด InsightFace model ครั้งเดียวตอน startup
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


# ==========================================
# 🛡️ ด่านดักจับรูปปลอม (Anti-Spoofing)
# ==========================================
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
        all_embeddings = []

        for img_base64 in req.images:
            img_bgr = base64_to_image(img_base64)

            # --- 🛡️ ตรวจสอบว่าเป็นคนจริงหรือไม่ ก่อนส่งให้ InsightFace ---
            liveness_result = check_liveness_minifasnet(img_bgr)
            if not liveness_result["is_real"]:
                raise HTTPException(
                    status_code=400,
                    detail="ตรวจพบการใช้รูปภาพหรือหน้าจอ (Spoofing)! กรุณาใช้ใบหน้าจริงในการลงทะเบียน",
                )
            # --------------------------------------------------------

            faces = face_app.get(img_bgr)

            if faces:
                all_embeddings.append(faces[0].normed_embedding)

        if not all_embeddings:
            raise HTTPException(status_code=400, detail="ไม่พบใบหน้าในรูปภาพที่ส่งมา")

        # หาค่าเฉลี่ยของ embedding จากหลายๆ มุม เพื่อความแม่นยำที่มากขึ้น (Multi-View)
        mean_vector = np.mean(all_embeddings, axis=0)
        final_vector = (mean_vector / np.linalg.norm(mean_vector)).tolist()

        # ลบข้อมูลเก่าออก (ถ้ามี) แล้วแทนที่ด้วยข้อมูลใหม่
        await db.execute(
            delete(FaceEmbedding).where(FaceEmbedding.user_id == current_user.id)
        )

        new_face = FaceEmbedding(
            user_id=current_user.id,
            embedding_vector=final_vector,
            model_name="ArcFace-InsightFace-MultiView",
        )
        db.add(new_face)
        await db.commit()

        return {
            "status": "success",
            "message": f"ลงทะเบียนสำเร็จด้วยการประมวลผลจาก {len(all_embeddings)} รูปภาพ",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการประมวลผล AI")
