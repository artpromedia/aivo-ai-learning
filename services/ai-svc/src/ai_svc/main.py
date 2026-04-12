from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes.generate import router as generate_router
from .routes.homework import router as homework_router

app = FastAPI(
    title="AIVO AI Service",
    description="LLM Gateway + Content Generation + Tutor Chat + Homework Helper",
    version="1.1.0",
)

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
