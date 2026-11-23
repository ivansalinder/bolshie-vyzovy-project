import csv
import io
import os
from pathlib import Path
from typing import Any, Dict, List, Union

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReadCheck API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ANALYTICS_SECRET = os.getenv("ANALYTICS_SECRET", "readcheck2026")

MODE_TITLES = {
    "full-75": "Полная методика (75 заданий)",
    "short-15": "Сокращённый скрининг (15 заданий)",
    "standard-15": "Базовый скрининг (15 заданий)",
    "full-15": "Полный скрининг предложений",
    "express-5": "Экспресс-демо (5 заданий)",
}

COMPONENT_ADVICE = {
    "Орфография": "Полезны короткие игры на поиск одинаковых слогов и буквосочетаний в словах.",
    "Фонология": "Обратите внимание на различение похожих по звучанию слов (например, плот/плоть, угол/уголь).",
    "Семантика": "Почаще просите ребёнка своими словами пересказывать прочитанное и подбирать синонимы.",
    "Морфология": "Разбирайте вместе состав сложных слов (лесоруб, книголюб, листопад) — это расширяет словарь.",
    "Синтаксис": "Тренируйте согласование слов в длинных предложениях, читая вслух с интонацией.",
}


def build_parent_summary(comp_score: float) -> str:
    if comp_score >= 85:
        return (
            "Ребёнок уверенно справился с большинством заданий теста. Текущие показатели "
            "по компонентам чтения высокие — достаточно поддерживать привычку к регулярному чтению."
        )
    if comp_score >= 60:
        return (
            "Ребёнок справился с основной частью заданий, однако в отдельных компонентах "
            "встретились ошибки. Обратите внимание на блоки с более низким процентом — "
            "их полезно потренировать в спокойном темпе."
        )
    return (
        "При выполнении заданий возникли затруднения в нескольких блоках. Подробный протокол "
        "поможет увидеть, какие именно типы заданий дались сложнее; при желании результаты "
        "можно обсудить с педагогом или профильным специалистом."
    )


def format_screening_for_frontend(
    screening: models.ScreeningResult, is_specialist: bool
) -> Dict[str, Any]:
    raw = screening.raw_data or {}
    items = raw.get("items") or []
    comp_stats = raw.get("component_stats") or []

    total_questions = (
        len(items)
        if items
        else max(len(raw.get("answers") or {}), screening.error_count, 1)
    )
    correct_answers = (
        sum(1 for row in items if row.get("isCorrect"))
        if items
        else max(0, total_questions - screening.error_count)
    )

    comp_pct = (
        round(screening.comprehension_score * 100)
        if screening.comprehension_score <= 1
        else round(screening.comprehension_score)
    )

    duration_sec = int(
        round(
            raw.get("total_time_seconds")
            or (screening.specialist_metrics or {}).get("reading_time_sec", 1)
        )
    )
    avg_time_sec = raw.get("avg_time_per_item_sec") or round(
        duration_sec / max(total_questions, 1), 1
    )

    strong_comps = [c["component"] for c in comp_stats if c.get("pct", 0) >= 80]
    recommendations = [
        f'{c["component"]} ({c["correct"]}/{c["total"]}): {COMPONENT_ADVICE[c["component"]]}'
        for c in comp_stats
        if c.get("pct", 0) < 80 and c.get("component") in COMPONENT_ADVICE
    ]

    mode_title = MODE_TITLES.get(
        raw.get("mode_id"), raw.get("module_title") or "Скрининг чтения"
    )

    payload: Dict[str, Any] = {
        "id": screening.id,
        "modeTitle": mode_title,
        "completedAt": screening.created_at.isoformat() if screening.created_at else "",
        "savedToApi": True,
        "durationSec": duration_sec,
        "readingDurationSec": raw.get("reading_time_seconds"),
        "answeringDurationSec": raw.get("answer_time_seconds"),
        "avgTimeSec": avg_time_sec,
        "errorsCount": screening.error_count,
        "netWpm": round(screening.words_per_minute),
        "errorRate": round((screening.error_count / max(total_questions, 1)) * 100, 1),
        "correctAnswers": correct_answers,
        "totalQuestions": total_questions,
        "comprehensionPct": comp_pct,
        "detailedSummary": screening.parent_summary or build_parent_summary(comp_pct),
        "strongComps": strong_comps,
        "recommendations": recommendations,
        "componentStats": comp_stats,
    }

    if is_specialist:
        payload["itemLog"] = items
        payload["rawData"] = raw
    else:
        payload["itemLog"] = []
        payload["rawData"] = None

    return payload


@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    if user_in.role == models.RoleEnum.specialist and not user_in.specialization:
        raise HTTPException(
            status_code=400, detail="Для специалиста обязательно указание специализации"
        )

    new_user = models.User(
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
        role=user_in.role,
        full_name=user_in.full_name,
        organization=user_in.organization,
        specialization=user_in.specialization,
        region=user_in.region,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = auth.create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )
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
    return schemas.ChildOut(
        id=child.id,
        guardian_id=child.guardian_id,
        full_name=child.full_name,
        birth_date=child.birth_date,
        grade=child.grade,
        notes=child.notes,
        last_screening=None,
    )


@app.get("/api/children", response_model=List[schemas.ChildOut])
def list_children(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    children = (
        db.query(models.Child)
        .filter(models.Child.guardian_id == current_user.id)
        .order_by(models.Child.id.desc())
        .all()
    )
    is_specialist = current_user.role == models.RoleEnum.specialist

    result_list: List[schemas.ChildOut] = []
    for child in children:
        latest = (
            db.query(models.ScreeningResult)
            .filter(models.ScreeningResult.child_id == child.id)
            .order_by(
                models.ScreeningResult.created_at.desc(),
                models.ScreeningResult.id.desc(),
            )
            .first()
        )
        result_list.append(
            schemas.ChildOut(
                id=child.id,
                guardian_id=child.guardian_id,
                full_name=child.full_name,
                birth_date=child.birth_date,
                grade=child.grade,
                notes=child.notes,
                last_screening=(
                    format_screening_for_frontend(latest, is_specialist)
                    if latest
                    else None
                ),
            )
        )
    return result_list


@app.delete("/api/children/{child_id}", status_code=204)
def delete_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    child = (
        db.query(models.Child)
        .filter(
            models.Child.id == child_id,
            models.Child.guardian_id == current_user.id,
        )
        .first()
    )
    if not child:
        raise HTTPException(status_code=404, detail="Профиль ребёнка не найден")

    # Связанные результаты скрининга удаляются через cascade в модели Child
    db.delete(child)
    db.commit()


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
        .filter(
            models.Child.id == data.child_id,
            models.Child.guardian_id == current_user.id,
        )
        .first()
    )
    if not child:
        raise HTTPException(status_code=404, detail="Профиль ребёнка не найден")

    existing = (
        db.query(models.ScreeningResult)
        .filter(models.ScreeningResult.child_id == child.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Скрининг для этого профиля уже пройден. Повторное прохождение отключено.",
        )

    wpm = round((data.word_Count / max(data.reading_time_seconds, 1.0)) * 60, 2)
    comp_score = round((data.correct_answers / max(data.total_questions, 1)) * 100, 1)
    summary = build_parent_summary(comp_score)

    specialist_metrics = {
        "net_reading_speed_wpm": round(
            (
                max(data.word_Count - data.errors_made, 0)
                / max(data.reading_time_seconds, 1.0)
            )
            * 60,
            2,
        ),
        "error_density_percent": round(
            (data.errors_made / max(data.total_questions, 1)) * 100, 2
        ),
        "reading_time_sec": data.reading_time_seconds,
        "avg_time_per_item_sec": round(
            data.reading_time_seconds / max(data.total_questions, 1), 2
        ),
        "component_stats": (data.raw_events or {}).get("component_stats", []),
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


# ==================== ВЫГРУЗКА АНАЛИТИКИ ДЛЯ ЗАЩИТЫ (EXCEL / CSV) ====================


@app.get("/api/analytics/export")
def export_analytics_csv(secret: str, db: Session = Depends(get_db)):
    if secret != ANALYTICS_SECRET:
        raise HTTPException(status_code=403, detail="Неверный ключ доступа")

    screenings = (
        db.query(models.ScreeningResult)
        .order_by(models.ScreeningResult.created_at.asc())
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(
        [
            "ID сессии",
            "Дата",
            "Код ученика",
            "Класс",
            "Дата рождения",
            "Примечание",
            "Регион",
            "Роль аккаунта",
            "Режим теста",
            "Точность (%)",
            "Ошибки",
            "Время (сек)",
            "Ср. время/задание (сек)",
            "Темп (сл/мин)",
            "Орфография (%)",
            "Фонология (%)",
            "Семантика (%)",
            "Морфология (%)",
            "Синтаксис (%)",
        ]
    )

    for s in screenings:
        child = db.query(models.Child).filter(models.Child.id == s.child_id).first()
        guardian = (
            db.query(models.User).filter(models.User.id == child.guardian_id).first()
            if child
            else None
        )
        raw = s.raw_data or {}
        comps = {c["component"]: c["pct"] for c in raw.get("component_stats", [])}
        comp_score = (
            round(s.comprehension_score * 100)
            if s.comprehension_score <= 1
            else round(s.comprehension_score)
        )
        duration_sec = (s.specialist_metrics or {}).get("reading_time_sec", "")

        writer.writerow(
            [
                s.id,
                s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "",
                f"RC-{str(s.child_id)[-4:].zfill(4)}",
                child.grade if child else "",
                child.birth_date if child else "",
                child.notes if child else "",
                guardian.region if guardian else "",
                guardian.role.value if guardian else "",
                raw.get("mode_id", raw.get("module_id", "")),
                comp_score,
                s.error_count,
                duration_sec,
                raw.get("avg_time_per_item_sec", ""),
                round(s.words_per_minute),
                comps.get("Орфография", ""),
                comps.get("Фонология", ""),
                comps.get("Семантика", ""),
                comps.get("Морфология", ""),
                comps.get("Синтаксис", ""),
            ]
        )

    csv_bytes = output.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=readcheck_summary.csv"},
    )


@app.get("/api/analytics/items")
@app.get("/api/analytics/export-items")
def export_analytics_items_csv(secret: str, db: Session = Depends(get_db)):
    """Позадачная выгрузка для психометрического анализа стимулов (1 строка = 1 ответ)."""
    if secret != ANALYTICS_SECRET:
        raise HTTPException(status_code=403, detail="Неверный ключ доступа")

    screenings = (
        db.query(models.ScreeningResult)
        .order_by(models.ScreeningResult.created_at.asc())
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(
        [
            "ID сессии",
            "Дата",
            "Код ученика",
            "Класс",
            "Регион",
            "Режим теста",
            "ID стимула",
            "Компонент",
            "Предложение",
            "Выбранный ответ",
            "Правильный вариант",
            "Верно (1/0)",
            "Время ответа (сек)",
        ]
    )

    for s in screenings:
        raw = s.raw_data or {}
        items = raw.get("items") or []
        if not items:
            continue

        child = db.query(models.Child).filter(models.Child.id == s.child_id).first()
        guardian = (
            db.query(models.User).filter(models.User.id == child.guardian_id).first()
            if child
            else None
        )

        for item in items:
            writer.writerow(
                [
                    s.id,
                    s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else "",
                    f"RC-{str(s.child_id)[-4:].zfill(4)}",
                    child.grade if child else "",
                    guardian.region if guardian else "",
                    raw.get("mode_id", ""),
                    item.get("id", ""),
                    item.get("component", ""),
                    item.get("sentence", ""),
                    item.get("chosenText", ""),
                    item.get("correctText", ""),
                    1 if item.get("isCorrect") else 0,
                    item.get("timeSec", ""),
                ]
            )

    csv_bytes = output.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=readcheck_items.csv"},
    )


# ==================== РАЗДАЧА СОБРАННОГО ФРОНТЕНДА ====================

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        if full_path:
            candidate = (FRONTEND_DIST / full_path).resolve()
            if (
                candidate.is_file()
                and FRONTEND_DIST.resolve() in candidate.parents
            ):
                return FileResponse(candidate)

        return FileResponse(FRONTEND_DIST / "index.html")