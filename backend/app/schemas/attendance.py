from pydantic import BaseModel


class CheckInRequest(BaseModel):
    session_id: int
    image: str


class FaceRegisterRequest(BaseModel):
    image: str


class UpdateAttendanceRequest(BaseModel):
    status: str


class CreateAttendanceRequest(BaseModel):
    session_id: int
    student_id: int
    status: str
