from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.users import User
from app.models.face import FaceEmbedding
from app.models.course import Course, Enrollment
from app.models.attendance import Attendance, ClassSession, AttendanceStatus
from app.schemas.attendance import CheckInRequest
from pydantic import BaseModel
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime
from app.api.face_register import get_face_app

router = APIRouter()
COSINE_THRESHOLD = 0.7


def base64_to_image(base64_string: str) -> np.ndarray:
    if "base64," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    img_array = np.array(image)
    return img_array[:, :, ::-1]


def cosine_similarity(v1, v2) -> float:
    v1 = np.array(v1)
    v2 = np.array(v2)
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (n1 * n2))


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


@router.post("/attendance/recognize")
async def recognize_student(
    req: CheckInRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        sess_result = await db.execute(
            select(ClassSession)
            .options(selectinload(ClassSession.course))
            .where(ClassSession.id == req.session_id)
        )
        session = sess_result.scalars().first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if not session.is_active:
            return {"status": "error", "message": "Session is not active"}

        course = session.course
        now = datetime.now()
        computed_status = determine_status(session, course, now)

        if computed_status is None:
            absent_after = course.absent_after_minutes or 60
            return {
                "status": "locked",
                "message": f"Check-in closed — more than {absent_after} minutes have passed",
            }

        # สร้าง embedding ด้วย InsightFace
        img_bgr = base64_to_image(req.image)
        face_app = get_face_app()

        try:
            faces = face_app.get(img_bgr)
            if not faces:
                return {"status": "unknown", "message": "No face detected"}
            input_vector = faces[0].normed_embedding
        except Exception as e:
            return {"status": "unknown", "message": f"Face detection failed: {str(e)}"}

        # ดึงข้อมูลเฉพาะใบหน้าของนักศึกษาที่ลงทะเบียนในคลาสนี้
        stmt = (
            select(User, FaceEmbedding)
            .join(FaceEmbedding, User.id == FaceEmbedding.user_id)
            .join(Enrollment, User.id == Enrollment.student_id)
            .where(Enrollment.course_id == session.course_id)
        )
        result = await db.execute(stmt)
        candidates = result.all()

        if not candidates:
            return {
                "status": "error",
                "message": "No students registered for this course have face data",
            }

        best_user = None
        best_similarity = -1.0

        for user_obj, face_obj in candidates:
            sim = cosine_similarity(input_vector, face_obj.embedding_vector)
            if sim > best_similarity:
                best_similarity = sim
                best_user = user_obj

        if best_user is None or best_similarity < COSINE_THRESHOLD:
            return {"status": "unknown", "message": "Face not recognized"}

        existing = await db.execute(
            select(Attendance).where(
                Attendance.session_id == req.session_id,
                Attendance.student_id == best_user.id,
            )
        )
        already_checked = existing.scalars().first()

        if not already_checked:
            new_attendance = Attendance(
                student_id=best_user.id,
                session_id=req.session_id,
                status=computed_status,
                timestamp=now,
                confidence_score=int(best_similarity * 100),
            )
            db.add(new_attendance)
            await db.commit()

        return {
            "status": "detected",
            "already_recorded": already_checked is not None,
            "student": {
                "id": best_user.id,
                "name": best_user.full_name,
                "student_id": getattr(best_user, "student_id", str(best_user.id)),
                "confidence": round(best_similarity * 100, 2),
                "status": computed_status.value if computed_status else "present",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[recognize_student] Error: {e}")
        return {"status": "error", "message": str(e)}
