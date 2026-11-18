from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from models import RoleEnum


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum
    full_name: str
    organization: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    full_name: str
    organization: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ChildCreate(BaseModel):
    full_name: str
    birth_date: str
    grade: Optional[str] = None
    notes: Optional[str] = None


class ChildOut(ChildCreate):
    id: int
    guardian_id: int

    class Config:
        from_attributes = True


class ScreeningSubmit(BaseModel):
    child_id: int
    word_Count: int
    reading_time_seconds: float
    correct_answers: int
    total_questions: int
    errors_made: int
    raw_events: Dict[str, Any]


class ScreeningParentOut(BaseModel):
    id: int
    child_id: int
    words_per_minute: float
    comprehension_score: float
    parent_summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class ScreeningSpecialistOut(ScreeningParentOut):
    error_count: int
    specialist_metrics: Dict[str, Any]
    raw_data: Dict[str, Any]