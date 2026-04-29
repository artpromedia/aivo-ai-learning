"""
curriculum-svc — read-only curriculum lookup over the bundled
skill-graphs / content-pack snapshot. See README.md for scope.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from curriculum_svc.routes import health, lookup

app = FastAPI(
    title="AIVO Curriculum Service",
    version="0.1.0",
    description="Read-only curriculum lookup over the AIVO skill-graphs and content-pack catalogue.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/curriculum", tags=["health"])
app.include_router(lookup.router, prefix="/api/curriculum", tags=["curriculum"])
