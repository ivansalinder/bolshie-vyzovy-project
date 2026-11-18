import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base


class RoleEnum(str, enum.Enum):
    parent = "parent"
    specialist = "specialist"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    full_name = Column(String, nullable=False)

    # Дополнительные поля для специалиста (у родителя остаются NULL)
    organization = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    children = relationship("Child", back_populates="guardian", cascade="all, delete-orphan")


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    birth_date = Column(String, nullable=False)
    grade = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    guardian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    guardian = relationship("User", back_populates="children")
    screenings = relationship("ScreeningResult", back_populates="child", cascade="all, delete-orphan")


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)

    # Сырые данные от фронтенда (тайминги слов, клики, ответы) для научных статей
    raw_data = Column(JSON, nullable=False)

    # Вычисленные метрики
    words_per_minute = Column(Float, nullable=False)
    comprehension_score = Column(Float, nullable=False)
    error_count = Column(Integer, nullable=False)

    # Отчёты под две роли
    parent_summary = Column(String, nullable=False)
    specialist_metrics = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    child = relationship("Child", back_populates="screenings")