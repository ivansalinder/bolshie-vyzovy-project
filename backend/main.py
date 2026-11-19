from typing import List, Union
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReadCheck API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    if user_in.role == models.RoleEnum.specialist and not user_in.specialization:
        raise HTTPException(status_code=400, detail="Для специалиста обязательно указание специализации")

    new_user = models.User(
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
        role=user_in.role,
        full_name=user_in.full_name,
        organization=user_in.organization,
        specialization=user_in.specialization,
        experience_years=user_in.experience_years,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = auth.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/api/children", response_model=schemas.ChildOut)
def add_child(
    child_in: schemas.ChildCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    child = models.Child(**child_in.model_dump(), guardian_id=current_user.id)
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


@app.get("/api/children", response_model=List[schemas.ChildOut])
def list_children(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Child).filter(models.Child.guardian_id == current_user.id).all()


@app.post(
    "/api/screenings",
    response_model=Union[schemas.ScreeningSpecialistOut, schemas.ScreeningParentOut],
)
def submit_screening(
    data: schemas.ScreeningSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    child = (
        db.query(models.Child)
        .filter(models.Child.id == data.child_id, models.Child.guardian_id == current_user.id)
        .first()
    )
    if not child:
        raise HTTPException(status_code=404, detail="Профиль ребёнка не найден")

    wpm = round((data.word_Count / max(data.reading_time_seconds, 1.0)) * 60, 2)
    comp_score = round((data.correct_answers / max(data.total_questions, 1)) * 100, 1)

    if wpm >= 80 and comp_score >= 70:
        summary = "Навыки чтения в пределах возрастной нормы. Хорошее понимание текста."
    else:
        summary = "Рекомендуется обратить внимание на темп чтения и обсуждение прочитанного со специалистом."

    specialist_metrics = {
        "net_reading_speed_wpm": round(((data.word_Count - data.errors_made) / max(data.reading_time_seconds, 1.0)) * 60, 2),
        "error_density_percent": round((data.errors_made / max(data.word_Count, 1)) * 100, 2),
        "reading_time_sec": data.reading_time_seconds,
    }

    result = models.ScreeningResult(
        child_id=child.id,
        raw_data=data.raw_events,
        words_per_minute=wpm,
        comprehension_score=comp_score,
        error_count=data.errors_made,
        parent_summary=summary,
        specialist_metrics=specialist_metrics,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    if current_user.role == models.RoleEnum.specialist:
        return schemas.ScreeningSpecialistOut.model_validate(result)
    return schemas.ScreeningParentOut.model_validate(result)