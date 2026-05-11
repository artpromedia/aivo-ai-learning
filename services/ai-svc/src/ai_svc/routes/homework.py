"""Homework adaptation and OCR routes."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..vision.ocr_processor import process_ocr
from ..vision.homework_adapter import adapt_homework
from ..services.llm_gateway import generate_completion
from ..services.prompt_builder import build_tutor_system_prompt, _build_language_directive, _normalize_locale
from ..services.brain_context import normalize_brain_context
from ..services.homework_profile_adapter import (
    build_homework_profile_summary,
    recommended_surface_for,
)
from ..services.profile_lowering import build_profile_lowering_block

logger = logging.getLogger("ai-svc.homework")

router = APIRouter(prefix="/api/ai/homework", tags=["homework"])


class OCRRequest(BaseModel):
    image_base64: str | None = None
    text_input: str | None = None
    mime_type: str = "image/jpeg"


class AdaptRequest(BaseModel):
    extracted_problems: list[dict[str, Any]] = Field(default_factory=list)
    brain_context: dict[str, Any] = Field(default_factory=dict)
    subject: str = "math"


class HomeworkChatRequest(BaseModel):
    tutor_sku: str
    learner_id: str
    functioning_level: str = "STANDARD"
    brain_context: dict[str, Any] = Field(default_factory=dict)
    homework_context: dict[str, Any] = Field(default_factory=dict)
    homework_focus: dict[str, Any] | None = None
    messages: list[dict[str, str]] = Field(default_factory=list)
    max_tokens: int = 1500
    locale: str | None = None


_HOMEWORK_AGENT_SYSTEM_PROMPT = """You are the AIVO Homework Helper — a patient, encouraging AI tutor that helps students work through their homework.

## Core Principles
1. NEVER give direct answers. Use Socratic questioning to guide the student.
2. Break complex problems into smaller, manageable steps.
3. Celebrate effort and progress, not just correct answers.
4. If the student is stuck after 2-3 hints, provide a worked example for a SIMILAR problem, then return to the original.
5. Track which problems the student has attempted and completed.

## Interaction Style
- Start by acknowledging the specific problem the student is working on
- Ask guiding questions ("What do you think the first step would be?")
- Provide visual scaffolding when helpful (use simple text diagrams, number lines, etc.)
- Give specific, encouraging feedback ("Great thinking! You identified the right operation.")
- If the student gets frustrated, offer a break or switch to an easier problem first

{profile_summary}

{profile_lowering_block}

## Current Homework
{homework_summary}
"""


@router.post("/ocr")
async def homework_ocr(body: OCRRequest):
    if not body.image_base64 and not body.text_input:
        raise HTTPException(status_code=400, detail="Either image_base64 or text_input is required")

    try:
        result = await process_ocr(
            image_base64=body.image_base64,
            text_input=body.text_input,
            mime_type=body.mime_type,
        )
        return result.to_dict()
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@router.post("/adapt")
async def adapt_homework_route(body: AdaptRequest):
    if not body.extracted_problems:
        raise HTTPException(status_code=400, detail="extracted_problems is required")

    try:
        result = await adapt_homework(
            extracted_problems=body.extracted_problems,
            brain_context=body.brain_context,
            subject=body.subject,
        )
        return result.to_dict()
    except Exception as e:
        logger.error(f"Adaptation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Homework adaptation failed: {str(e)}")


@router.post("/chat")
async def homework_chat(body: HomeworkChatRequest):
    normalized = normalize_brain_context(body.brain_context)
    functioning_level = body.functioning_level
    if functioning_level == "STANDARD":
        derived = normalized.get("functioning_level")
        if isinstance(derived, str) and derived:
            functioning_level = derived

    homework_focus = body.homework_focus or {
        "subject": (body.homework_context or {}).get("subject"),
        "problemCount": len((body.homework_context or {}).get("adapted_problems", []) or []),
    }
    subject_hint = homework_focus.get("subject") or homework_focus.get("detectedSubject")

    profile_summary = build_homework_profile_summary(
        tutor_sku=body.tutor_sku,
        subject=subject_hint,
        homework_focus=homework_focus,
        functioning_level=functioning_level,
        brain_context=normalized,
    )

    profile_lowering = build_profile_lowering_block(
        subject=subject_hint,
        topic="homework",
        grade_target=None,
        functioning_level=functioning_level,
        brain_context=normalized,
    )

    homework_summary = ""
    if body.homework_context:
        problems = body.homework_context.get("adapted_problems", [])
        if problems:
            homework_summary = "Problems being worked on:\n"
            for p in problems[:10]:
                num = p.get("problem_number", "?")
                text = p.get("adapted", p.get("original", ""))
                homework_summary += f"- Problem {num}: {text[:200]}\n"

    system_prompt = _HOMEWORK_AGENT_SYSTEM_PROMPT.format(
        profile_summary=profile_summary,
        profile_lowering_block=profile_lowering,
        homework_summary=homework_summary or "No specific homework loaded yet.",
    )

    # Re-append the language directive AFTER the homework wrapper so the
    # final instruction the model sees is "respond in {language}". The
    # wrapper above is hard-coded English and would otherwise pull the
    # response back to English even when the persona block asked for Spanish.
    system_prompt += "\n" + _build_language_directive(_normalize_locale(body.locale))

    try:
        result = await generate_completion(
            system_prompt=system_prompt,
            user_prompt=body.messages[-1]["content"] if body.messages else "I need help with my homework!",
            max_tokens=body.max_tokens,
            temperature=0.7,
        )

        # Derive a small structured envelope on top of the raw answer so
        # frontends can render the recommended surface and adaptation
        # markers without re-parsing the prompt. The `answer` field is
        # preserved as a string for backwards compatibility.
        completeness = normalized.get("_meta", {}).get("completeness", {}) if isinstance(normalized, dict) else {}
        adaptations: list[str] = []
        if completeness.get("has_accommodations"):
            adaptations.append("active_accommodations_applied")
        if completeness.get("has_mastery"):
            adaptations.append("mastery_aware_pacing")
        if completeness.get("has_iep"):
            adaptations.append("iep_goals_honoured")
        if functioning_level != "STANDARD":
            adaptations.append(f"functioning_level:{functioning_level}")

        return {
            "response": result["content"],
            "answer": result["content"],
            "model": result["model"],
            "prompt_tokens": result["prompt_tokens"],
            "completion_tokens": result["completion_tokens"],
            "profileAdaptationsApplied": adaptations,
            "recommendedSurface": recommended_surface_for(subject_hint, homework_focus),
            "nextLearnerAction": "Try the first step the tutor models, then reply with what you got.",
            "safety": {
                "gaveFinalAnswerFirst": False,
                "requiresParentSupport": functioning_level in ("NON_VERBAL", "PRE_SYMBOLIC"),
            },
        }
    except Exception as e:
        logger.error(f"Homework chat failed: {e}")
        raise HTTPException(status_code=503, detail=f"Homework chat failed: {str(e)}")
