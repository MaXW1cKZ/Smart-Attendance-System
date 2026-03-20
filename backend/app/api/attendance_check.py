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
from deepface import DeepFace
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime

router = APIRouter()

COSINE_THRESHOLD = 0.35



def base64_to_image(base64_string: str):
    if "base64," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(image_data)).convert("RGB")


def cosine_similarity(v1, v2) -> float:
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (n1 * n2))


def determine_status(
    session: ClassSession, course: Course, now: datetime
) -> AttendanceStatus:
    """
    Determine attendance status based on minutes elapsed since actual_start_time.

    Timeline:
      0 ─────── late_after_minutes ─────── absent_after_minutes ───▶
      PRESENT          LATE                    ABSENT (locked out)

    If actual_start_time is not set, default to PRESENT.
    """
    if not session.actual_start_time:
        return AttendanceStatus.PRESENT

    elapsed = (now - session.actual_start_time).total_seconds() / 60  # minutes

    absent_after = course.absent_after_minutes if course.absent_after_minutes else 60
    late_after = course.late_after_minutes if course.late_after_minutes else 15

    if elapsed >= absent_after:
        return None  # Locked out — too late to check in
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
        # 1. Validate session is active — load with course for threshold values
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

        # 2. Check if check-in window is still open
        now = datetime.now()
        computed_status = determine_status(session, course, now)

        if computed_status is None:
            # Past absent_after_minutes — no longer accepting check-ins
            absent_after = course.absent_after_minutes or 60
            return {
                "status": "locked",
                "message": f"Check-in closed — more than {absent_after} minutes have passed",
            }

        # 3. Convert image to ArcFace embedding vector
        input_image_np = np.array(base64_to_image(req.image))

        try:
            embedding_objs = DeepFace.represent(
                img_path=input_image_np,
                model_name="ArcFace",
                detector_backend="opencv",
                enforce_detection=False,
                align=True,
            )
            if not embedding_objs:
                return {"status": "unknown", "message": "No face detected"}
            input_vector = np.array(embedding_objs[0]["embedding"])
        except Exception as e:
            return {"status": "unknown", "message": f"Face detection failed: {str(e)}"}

        # 4. Find best matching face in DB
        result = await db.execute(select(FaceEmbedding))
        all_faces = result.scalars().all()

        if not all_faces:
            return {"status": "error", "message": "No registered faces in database"}

        best_user_id = None
        best_similarity = -1.0

        for face in all_faces:
            sim = cosine_similarity(input_vector, np.array(face.embedding_vector))
            if sim > best_similarity:
                best_similarity = sim
                best_user_id = face.user_id

        if best_user_id is None or best_similarity < COSINE_THRESHOLD:
            return {"status": "unknown", "message": "Face not recognized"}

        # 5. Verify student exists
        student = await db.get(User, best_user_id)
        if not student:
            return {"status": "error", "message": "User not found in database"}
        enrollment_check = await db.execute(
            select(Enrollment).where(
                Enrollment.course_id == session.course_id,
                Enrollment.student_id == student.id,
            )
        )
        is_enrolled = enrollment_check.scalars().first()

        if not is_enrolled:
            return {
                "status": "error",
                "message": f"Student {student.full_name} is not enrolled in this course.",
            }

        # 6. Check for duplicate
        existing = await db.execute(
            select(Attendance).where(
                Attendance.session_id == req.session_id,
                Attendance.student_id == student.id,
            )
        )
        already_checked = existing.scalars().first()

        if not already_checked:
            # Save attendance with computed status (present or late)
            db.add(
                Attendance(
                    student_id=student.id,
                    session_id=req.session_id,
                    status=computed_status,
                    timestamp=now,
                    confidence_score=int(best_similarity * 100),
                )
            )
            await db.commit()

        return {
            "status": "detected",
            "already_recorded": already_checked is not None,
            "student": {
                "id": student.id,
                "name": student.full_name,
                "student_id": getattr(student, "student_id", str(student.id)),
                "confidence": round(best_similarity * 100, 2),
                "status": computed_status.value if computed_status else "present",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[recognize_student] Error: {e}")
        return {"status": "error", "message": str(e)}
