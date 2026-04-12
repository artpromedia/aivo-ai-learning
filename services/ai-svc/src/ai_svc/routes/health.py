from fastapi import APIRouter

router = APIRouter(prefix="/api/ai", tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "service": "ai-svc"}
