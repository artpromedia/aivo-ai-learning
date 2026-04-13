import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from brain_svc.routes import health, brain, snapshots, recommendations, analysis
from brain_svc.models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AIVO Brain Service",
    version="1.0.0",
    description="Brain clone pipeline, state management, and versioned snapshots",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(health.router, prefix="/api/brain", tags=["Health"])
app.include_router(brain.router, prefix="/api/brain", tags=["Brain"])
app.include_router(snapshots.router, prefix="/api/brain/snapshots", tags=["Snapshots"])
app.include_router(recommendations.router, prefix="/api/brain/recommendations", tags=["Recommendations"])
app.include_router(analysis.router, prefix="/api/brain/analysis", tags=["AI Analysis"])
