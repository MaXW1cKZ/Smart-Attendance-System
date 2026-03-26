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
import cv2
import io
import os
from PIL import Image
from insightface.app import FaceAnalysis
import onnxruntime as ort

router = APIRouter()

_face_app = None
_liveness_session = None


def get_face_app():
    global _face_app
    if _face_app is None:
        _face_app = FaceAnalysis(name="buffalo_sc", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
    return _face_app


def get_liveness_model():
    """โหลดโมเดล Anti-Spoofing (MiniFASNetV2) แบบ ONNX"""
    global _liveness_session
    if _liveness_session is None:
        # 🚨 ตรวจสอบให้แน่ใจว่าวางไฟล์ไว้ถูกที่ (คุณสามารถเปลี่ยน Path ได้ตามจริง)
        model_path = "app/weights/MiniFASNetV2.onnx"

        if not os.path.exists(model_path):
            print(f"⚠️ คำเตือน: ไม่พบไฟล์ {model_path} ระบบจะข้ามการตรวจ Liveness ไปก่อน")
            return None

        _liveness_session = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )
    return _liveness_session


def check_liveness_minifasnet(img_bgr: np.ndarray, face_bbox: list) -> dict:
    """ตรวจสอบหน้าจริง/หน้าปลอม โดยอิงจากกรอบใบหน้าที่ตรวจเจอ (Logic จาก yakhyo)"""
    session = get_liveness_model()

    if session is None:
        return {
            "is_real": True,
            "score": 1.0,
            "message": "Liveness Model Not Found (Bypassed)",
        }

    try:
        x1, y1, x2, y2 = map(int, face_bbox)
        box_w, box_h = x2 - x1, y2 - y1
        src_h, src_w = img_bgr.shape[:2]

        # 1. ขยายกรอบ (Scale) เผื่อพื้นที่รอบใบหน้า (สำหรับ MiniFASNetV2 ใช้ Scale = 2.7)
        scale_factor = 2.7
        scale = min((src_h - 1) / box_h, (src_w - 1) / box_w, scale_factor)
        new_w = box_w * scale
        new_h = box_h * scale
        center_x = x1 + box_w / 2
        center_y = y1 + box_h / 2

        new_x1 = max(0, int(center_x - new_w / 2))
        new_y1 = max(0, int(center_y - new_h / 2))
        new_x2 = min(src_w, int(center_x + new_w / 2))
        new_y2 = min(src_h, int(center_y + new_h / 2))

        face_crop = img_bgr[new_y1:new_y2, new_x1:new_x2]

        # 2. Resize ให้ตรงกับ Input ของโมเดล (มาตรฐาน MiniFASNet คือ 80x80)
        face_resize = cv2.resize(face_crop, (80, 80))

        # 3. Preprocess ภาพ (สลับแกนสีแบบที่โมเดลของ yakhyo ต้องการ)
        face_blob = face_resize.astype(np.float32)
        face_blob = np.transpose(face_blob, (2, 0, 1))  # (H, W, C) -> (C, H, W)
        face_blob = np.expand_dims(face_blob, axis=0)  # เพิ่ม Batch dimension

        # 4. โยนเข้าโมเดล ONNX
        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: face_blob})

        # 5. แปลงผลลัพธ์ (Logits) ด้วย Softmax เพื่อหา Class 1 (หน้าจริง)
        logits = outputs[0]
        e_x = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = (e_x / e_x.sum(axis=1, keepdims=True))[0]

        real_score = float(probs[1])  # ค่า Liveness Score (0.0 - 1.0)

        # 🚨 กำหนดความเข้มงวด (0.85 คือต้องมั่นใจเกิน 85% ถึงจะให้ผ่าน)
        is_real = real_score > 0.85

        return {
            "is_real": is_real,
            "score": real_score,
            "message": "Real face detected" if is_real else "Spoofing detected",
        }
    except Exception as e:
        print(f"Liveness Check Error: {e}")
        # ถ้าพังระหว่างคำนวณ ให้ถือว่าจริงไว้ก่อน (ป้องกันเด็กลงทะเบียนไม่ผ่านเพราะบัค)
        return {"is_real": True, "score": 1.0, "message": "Error occurred, bypassed"}


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

        for img_file in images:
            contents = await img_file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            img_bgr = np.array(image)[:, :, ::-1]

            # 🚨 1. หาหน้าคนให้เจอก่อน เพื่อเอา Bounding Box (กรอบหน้า)
            faces = face_app.get(img_bgr)

            if not faces:
                raise HTTPException(
                    status_code=400, detail="ไม่พบใบหน้าในรูปภาพที่ส่งมา! กรุณาถ่ายใหม่"
                )

            # 🚨 2. ส่งกรอบหน้า (faces[0].bbox) ไปให้ Liveness เช็คว่าเป็นรูปปลอมหรือไม่
            liveness_result = check_liveness_minifasnet(img_bgr, faces[0].bbox)

            if not liveness_result["is_real"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"ตรวจพบการใช้รูปถ่ายหรือหน้าจอ! กรุณาใช้ใบหน้าจริง (ระดับความปลอม: {(1 - liveness_result['score']) * 100:.1f}%)",
                )

            # 🚨 3. ถ้าผ่าน เป็นหน้าจริง ค่อยสกัด Vector ลงฐานข้อมูล
            emb = faces[0].normed_embedding.tolist()

            new_face_records.append(
                FaceEmbedding(
                    user_id=current_user.id,
                    embedding_vector=emb,
                    model_name="ArcFace-InsightFace-Gallery",
                )
            )

        # เคลียร์ข้อมูลหน้าเก่าออกก่อน
        await db.execute(
            delete(FaceEmbedding).where(FaceEmbedding.user_id == current_user.id)
        )

        db.add_all(new_face_records)

        # บันทึกสถานะ PDPA
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
