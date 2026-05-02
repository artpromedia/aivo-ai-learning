"""
AI Prompt Playground endpoint.

Used by the admin AI Playground UI to test tutor system prompts and model
configurations against real LLM providers via litellm. Admin-only.
"""
import logging
from typing import List, Literal, Optional

import litellm
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from brain_svc.auth import AuthClaims, require_auth

logger = logging.getLogger("brain-svc.playground")

router = APIRouter()


# Map the UI's friendly model id -> a concrete litellm model string.
# Keep this list in sync with apps/web .../ai/playground/page.tsx MODELS.
MODEL_MAP: dict[str, str] = {
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "claude-3-5-sonnet": "anthropic/claude-3-5-sonnet-20241022",
    "gemini-2.0-flash": "gemini/gemini-2.0-flash",
}

ADMIN_ROLES = {"PLATFORM_ADMIN", "DISTRICT_ADMIN"}


class PlaygroundMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class PlaygroundRequest(BaseModel):
    model: str = Field(..., description="UI model id, e.g. 'gpt-4o'")
    tutorKey: Optional[str] = None
    systemPrompt: str = ""
    messages: List[PlaygroundMessage]
    temperature: float = 0.7
    maxTokens: int = Field(500, ge=1, le=4000)


@router.post("")
async def playground_complete(
    body: PlaygroundRequest,
    auth: AuthClaims = Depends(require_auth),
):
    if auth.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")

    litellm_model = MODEL_MAP.get(body.model)
    if not litellm_model:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {body.model}")

    chat: list[dict] = []
    if body.systemPrompt.strip():
        chat.append({"role": "system", "content": body.systemPrompt.strip()})
    for m in body.messages:
        chat.append({"role": m.role, "content": m.content})

    if not any(m["role"] == "user" for m in chat):
        raise HTTPException(status_code=400, detail="At least one user message is required")

    try:
        response = await litellm.acompletion(
            model=litellm_model,
            messages=chat,
            temperature=body.temperature,
            max_tokens=body.maxTokens,
        )
    except Exception as e:
        logger.warning("Playground model %s failed: %s", litellm_model, e)
        raise HTTPException(status_code=502, detail=f"Model call failed: {e}")

    content = response.choices[0].message.content if response.choices else ""
    usage = getattr(response, "usage", None)
    return {
        "response": content,
        "model": litellm_model,
        "tutorKey": body.tutorKey,
        "usage": {
            "promptTokens": getattr(usage, "prompt_tokens", 0) or 0,
            "completionTokens": getattr(usage, "completion_tokens", 0) or 0,
            "totalTokens": getattr(usage, "total_tokens", 0) or 0,
        },
    }
