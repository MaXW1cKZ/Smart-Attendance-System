from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.users import User
from app.models.face import FaceEmbedding
from app.models.course import Course, Enrollment
from app.models.attendance import Attendance, ClassSession, AttendanceStatus
import numpy as np
import base64
import io
import json
from PIL import Image
from datetime import datetime
from app.api.face_register import get_face_app, check_liveness_minifasnet

router = APIRouter()

COSINE_THRESHOLD = 0.65

def base64_to_image(base64_string: str) -> np.ndarray:
    if "base64," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    img_array = np.array(image)
    return img_array[:, :, ::-1]


def determine_status(session: ClassSession, course: Course, now: datetime):
    if not session.actual_start_time:
        return AttendanceStatus.PRESENT

    elapsed = (now - session.actual_start_time).total_seconds() / 60
    absent_after = course.absent_after_minutes if course.absent_after_minutes else 60
    late_after = course.late_after_minutes if course.late_after_minutes else 15

    if elapsed >= absent_after:
        return None
    elif elapsed >= late_after:
        return AttendanceStatus.LATE
    else:
        return AttendanceStatus.PRESENT


def match_face(
    input_vector: np.ndarray,
    candidates: list[dict],
    threshold: float = COSINE_THRESHOLD,
) -> tuple[dict | None, float]:
    if not candidates:
        return None, -1.0

    matrix = np.stack([c["vector"] for c in candidates])  # (N, 512)
    sims = matrix @ input_vector  # (N,)
    best_idx = int(np.argmax(sims))
    best_sim = float(sims[best_idx])

    if best_sim < threshold:
        return None, best_sim
    return candidates[best_idx], best_sim


@router.websocket("/attendance/ws/{session_id}")
async def websocket_attendance(
    websocket: WebSocket,
    session_id: int,
    token: str = None,
    db: AsyncSession = Depends(get_db),
):
    await websocket.accept()
    face_app = get_face_app()

    try:
        sess_result = await db.execute(
            select(ClassSession)
            .options(selectinload(ClassSession.course))
            .where(ClassSession.id == session_id)
        )
        session = sess_result.scalars().first()

        if not session or not session.is_active:
            await websocket.send_json(
                {"status": "error", "message": "Session is not active or not found"}
            )
            await websocket.close()
            return

        course = session.course

        stmt = (
            select(User, FaceEmbedding)
            .join(FaceEmbedding, User.id == FaceEmbedding.user_id)
            .join(Enrollment, User.id == Enrollment.student_id)
            .where(Enrollment.course_id == session.course_id)
        )
        result = await db.execute(stmt)
        raw_candidates = result.all()

        if not raw_candidates:
            await websocket.send_json(
                {
                    "status": "error",
                    "message": "No students registered for this course have face data",
                }
            )

        candidates_cache: list[dict] = [
            {
                "user": user_obj,
                "vector": np.array(face_obj.embedding_vector, dtype=np.float32),
            }
            for user_obj, face_obj in raw_candidates
        ]

        existing_result = await db.execute(
            select(Attendance.student_id).where(Attendance.session_id == session_id)
        )
        checked_ids: set[int] = set(existing_result.scalars().all())

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            now = datetime.now()

            computed_status = determine_status(session, course, now)
            if computed_status is None:
                absent_after = course.absent_after_minutes or 60
                await websocket.send_json(
                    {
                        "status": "locked",
                        "message": f"Check-in closed — more than {absent_after} minutes have passed",
                    }
                )
                continue

            try:
                img_bgr = base64_to_image(payload["image"])
            except Exception as e:
                print(f"Image decode error: {e}")
                continue

            try:
                faces = face_app.get(img_bgr)
            except Exception as e:
                print(f"Face detection failed: {e}")
                continue

            if not faces:
                continue

            # 🚨 1. ตรวจสอบ Liveness (MiniFASNet)
            liveness_result = check_liveness_minifasnet(img_bgr, faces[0].bbox)
            liveness_score = liveness_result["score"]

            # ปรับเกณฑ์ความเข้มงวด:
            # ถ้า AI บอกว่าเป็น Fake (is_real=False)
            # หรือถึงบอกว่าเป็น Real แต่คะแนนความมั่นใจน้อยกว่า 95% ให้ตีเป็น Fake ทันที
            is_fake = (not liveness_result["is_real"]) or (liveness_score < 0.95)

            if is_fake:
                await websocket.send_json(
                    {
                        "status": "fake_face",
                        "message": f"ตรวจพบความผิดปกติ (Confidence: {liveness_score * 100:.1f}%)",
                    }
                )
                continue

            # 🚨 2. ถ้าผ่านด่าน Liveness มาได้ (แปลว่าเป็นหน้าคนจริง) ค่อยทำ Recognition
            input_vector = faces[0].normed_embedding
            matched_candidate, best_sim = match_face(input_vector, candidates_cache)

            matched_candidate, best_sim = match_face(input_vector, candidates_cache)

            if matched_candidate is None:
                continue

            best_user: User = matched_candidate["user"]
            already_checked = best_user.id in checked_ids

            if not already_checked:
                new_attendance = Attendance(
                    student_id=best_user.id,
                    session_id=session_id,
                    status=computed_status,
                    timestamp=now,
                    confidence_score=int(best_sim * 100),
                )
                db.add(new_attendance)
                checked_ids.add(best_user.id)
                await db.commit()

            await websocket.send_json(
                {
                    "status": "detected",
                    "already_recorded": already_checked,
                    "student": {
                        "id": best_user.id,
                        "name": best_user.full_name,
                        "student_id": getattr(
                            best_user, "student_id", str(best_user.id)
                        ),
                        "email": getattr(best_user, "email", ""),
                        "confidence": round(best_sim * 100, 2),
                        "status": computed_status.value
                        if hasattr(computed_status, "value")
                        else computed_status,
                    },
                }
            )

    except WebSocketDisconnect:
        print(f"อาจารย์ปิดกล้อง (Session ID: {session_id})")
    except Exception as e:
        print(f"WebSocket Error: {e}")
