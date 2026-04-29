from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes.generate import router as generate_router
from .routes.homework import router as homework_router
from .routes.transcribe import router as transcribe_router
from .routes.curriculum import router as curriculum_router
from .routes.speech_buddy import router as speech_buddy_router
from ._observability import add_observability

app = FastAPI(
    title="AIVO AI Service",
    description="LLM Gateway + Content Generation + Tutor Chat + Homework Helper",
    version="1.1.0",
)

# Structured request logging + /metrics for Prometheus scrape (Supp A).
add_observability(app, "ai-svc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(generate_router)
app.include_router(homework_router)
app.include_router(transcribe_router)
app.include_router(curriculum_router)
app.include_router(speech_buddy_router)
