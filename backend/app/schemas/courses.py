from pydantic import BaseModel
from typing import Optional
from datetime import time


class CourseCreate(BaseModel):
    course_code: str
    section: str
    name: str
    semester: str
    academic_year: str
    day_of_week: str
    start_time: time  # "HH:MM"
    end_time: time  # "HH:MM"
    use_scoring: bool = True
    score_present: float = 1.0
    score_late: float = 0.5
    attendance_threshold: int = 80
    late_after_minutes: int = 15
    absent_after_minutes: int = 60
    teacher_id: Optional[int] = None


class CourseResponse(BaseModel):
    id: int
    course_code: str
    section: str
    name: str
    semester: str
    academic_year: str
    day_of_week: str
    start_time: time
    end_time: time
    teacher_id: int
    use_scoring: bool
    score_present: float
    score_late: float
    attendance_threshold: int
    late_after_minutes: int
    absent_after_minutes: int

    class Config:
        from_attributes = True
