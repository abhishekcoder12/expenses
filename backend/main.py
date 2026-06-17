"""Smart Expense Tracker Level 2 API + frontend server."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from routes_auth import router as auth_router
from routes_expenses import router as expenses_router
from routes_income import router as income_router
from routes_reports import router as reports_router

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = FastAPI(
    title="Smart Expense Tracker - Level 2",
    description="FastAPI + Supabase backend with JWT auth, income tracking, savings reports, charts, and a combined frontend.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(income_router)
app.include_router(reports_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Expense Tracker API is running"}


@app.get("/docs-home", include_in_schema=False)
def docs_home():
    return RedirectResponse(url="/docs")


# Keep this mount last so API routes are matched first.
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
