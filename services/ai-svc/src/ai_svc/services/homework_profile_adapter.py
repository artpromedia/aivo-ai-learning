"""Homework helper profile adapter.

Produces a structured compact profile summary for the homework helper
prompt — replacing the previous `tutor_system[:500]` truncation, which
silently dropped the learner's accommodations, mastery gaps, and IEP
goals.

The summary is deterministic, never embeds raw IEP documents or parent
private notes, and contains only the fields the homework helper needs to
adapt schoolwork down to the learner's access level while preserving the
educational objective.
"""
from __future__ import annotations

from typing import Any

from ..prompts.tutor_personas import TUTOR_PERSONAS
from .brain_context import normalize_brain_context

HOMEWORK_MISSION = (
    "## Homework Mission\n"
    "Help the learner complete general-education homework by translating "
    "the access path to the learner's profile. Preserve the educational "
    "objective. Do not simply give the final answer."
)

HOMEWORK_ADAPTATION_RULES = (
    "\n## Homework Adaptation Rules\n"
    "- Identify what the school problem is asking.\n"
    "- Rephrase it at the learner's access level.\n"
    "- Model only the first similar step when necessary.\n"
    "- Ask the learner to try the next step.\n"
    "- Use the learner's preferred response mode.\n"
    "- Use scratchpad, diagram, number line, geometry workspace, reading "
    "annotation, or manipulatives when appropriate.\n"
    "- If the learner is stuck, give a micro-hint before a larger hint.\n"
    "- If the learner asks for the answer, redirect to guided completion.\n"
    "- At the end, summarize the strategy so the learner can transfer it "
    "back to the school assignment."
)

_SUBJECT_RULES = {
    "math": (
        "Use concrete model → visual model → symbolic step. For geometry, "
        "render shapes/angles/scratchpad when available."
    ),
    "ela": (
        "Chunk reading, define vocabulary, use annotation or sentence "
        "frames, then guide comprehension/writing."
    ),
    "science": (
        "Use diagrams, classify/sequence tasks, observable examples, then "
        "vocabulary."
    ),
    "history": (
        "Use timeline, cause/effect, map, compare/contrast, vocabulary "
        "supports."
    ),
    "coding": (
        "Use trace tables, block-level explanations, small debugging steps."
    ),
}

_FORBIDDEN_RESPONSE_MODES = {
    "STANDARD": [],
    "SUPPORTED": ["unsupported_long_essay"],
    "LOW_VERBAL": ["long_typed_response", "open_essay"],
    "NON_VERBAL": ["spoken_response", "long_typed_response"],
    "PRE_SYMBOLIC": ["text_only_abstract", "long_typed_response"],
}

_RECOMMENDED_RESPONSE_MODES = {
    "STANDARD": ["typed_answer", "spoken_answer", "scratchpad"],
    "SUPPORTED": ["typed_answer", "scratchpad", "drawing"],
    "LOW_VERBAL": ["choice_grid", "scratchpad", "drawing", "voice_short"],
    "NON_VERBAL": ["choice_grid", "drag", "drawing", "match"],
    "PRE_SYMBOLIC": ["object_match", "cause_effect", "imitation", "parent_mediated"],
}


def _subject_key(subject: str | None) -> str | None:
    if not subject:
        return None
    s = subject.lower()
    if "math" in s or "geometry" in s or "algebra" in s or "arithmetic" in s:
        return "math"
    if "ela" in s or "english" in s or "reading" in s or "writing" in s:
        return "ela"
    if "science" in s:
        return "science"
    if "history" in s or "social" in s:
        return "history"
    if "coding" in s or "computer" in s or "programming" in s:
        return "coding"
    return None


def _recommended_surface(subject_key: str | None, focus: dict | None) -> str:
    text = " ".join(
        [
            str((focus or {}).get("topic") or ""),
            str((focus or {}).get("detectedSubject") or ""),
            str((focus or {}).get("subject") or ""),
        ]
    ).lower()
    if "geometry" in text or "area" in text or "rectangle" in text or "shape" in text:
        return "geometry_workspace"
    if subject_key == "math":
        return "scratchpad"
    if subject_key == "ela":
        return "reading_annotation"
    if subject_key == "science":
        return "science_diagram"
    return "scratchpad"


def build_homework_profile_summary(
    *,
    tutor_sku: str,
    subject: str | None,
    homework_focus: dict | None,
    functioning_level: str,
    brain_context: dict,
) -> str:
    """Return a structured Markdown summary of the homework profile context.

    Important: never includes raw IEP documents or parent private notes;
    only concise instructional summaries.
    """
    bc = normalize_brain_context(brain_context)
    persona = TUTOR_PERSONAS.get(tutor_sku, {}) or {}
    persona_name = persona.get("name") or "Homework Tutor"
    persona_subject = persona.get("subject") or subject or "homework"

    learner = bc.get("learner") or {}
    accommodations = bc.get("active_accommodations") or []
    mastery = bc.get("mastery_levels") or {}
    sensory = bc.get("sensory_profile") or {}
    language = bc.get("language_profile") or {}
    curriculum = bc.get("curriculum_alignment") or {}
    process = bc.get("process_profile") or {}
    iep_goals_raw = bc.get("iep_goals") or []

    iep_goals: list[str] = []
    for g in iep_goals_raw[:5]:
        if isinstance(g, str):
            iep_goals.append(g)
        elif isinstance(g, dict):
            text = g.get("description") or g.get("goal") or g.get("text")
            if text:
                iep_goals.append(str(text))

    skey = _subject_key(subject or persona_subject)
    subject_rule = _SUBJECT_RULES.get(skey or "", "")

    forbidden = _FORBIDDEN_RESPONSE_MODES.get(functioning_level, [])
    recommended = _RECOMMENDED_RESPONSE_MODES.get(functioning_level, _RECOMMENDED_RESPONSE_MODES["STANDARD"])
    surface = _recommended_surface(skey, homework_focus)

    lines: list[str] = []
    lines.append("## Learner Profile Summary")
    lines.append(f"- Tutor persona: {persona_name} ({persona_subject})")
    lines.append(f"- Functioning level: {functioning_level}")
    comm = learner.get("communication_mode") if isinstance(learner, dict) else None
    if comm:
        lines.append(f"- Communication mode: {comm}")
    if learner.get("grade_level"):
        lines.append(f"- Grade level: {learner['grade_level']}")
    delivery = curriculum.get("delivery_level") or curriculum.get("deliveryLevel")
    if delivery:
        lines.append(f"- Delivery level: {delivery}")
    if accommodations:
        lines.append("- Active accommodations: " + ", ".join(str(a) for a in accommodations))
    if mastery:
        gap_text = ", ".join(
            f"{k}={v}" for k, v in list(mastery.items())[:6] if isinstance(v, (int, float)) and v is not None
        )
        if gap_text:
            lines.append(f"- Mastery (0–1): {gap_text}")
    if iep_goals:
        lines.append("- Relevant IEP goals:")
        for g in iep_goals:
            lines.append(f"  - {g}")
    if sensory:
        sens = ", ".join(f"{k}={v}" for k, v in sensory.items() if v)
        if sens:
            lines.append(f"- Sensory profile: {sens}")
    if language and (language.get("dominant_language") or language.get("dominantLanguage")):
        lines.append(
            f"- Language profile: dominant={language.get('dominant_language') or language.get('dominantLanguage')}"
        )
    if process:
        modes = process.get("preferredInteractionModes") or process.get("preferred_interaction_modes")
        if modes:
            lines.append("- Preferred interaction modes: " + ", ".join(str(m) for m in modes))
    if curriculum:
        framework = curriculum.get("framework") or curriculum.get("currentFocus") or curriculum.get("current_focus")
        if framework:
            lines.append(f"- Curriculum alignment: {framework}")
    if homework_focus:
        lines.append("- Current homework focus:")
        for k in ("subject", "detectedSubject", "topic", "problemCount"):
            v = homework_focus.get(k)
            if v is not None:
                lines.append(f"  - {k}: {v}")
    lines.append(f"- Recommended learning surface: {surface}")
    lines.append("- Recommended response modes: " + ", ".join(recommended))
    if forbidden:
        lines.append("- Forbidden response modes: " + ", ".join(forbidden))

    out = [HOMEWORK_MISSION, "", "\n".join(lines), HOMEWORK_ADAPTATION_RULES]
    if subject_rule:
        out.append(f"\n### Subject Strategy ({skey})\n{subject_rule}")
    return "\n".join(out)


def recommended_surface_for(subject: str | None, homework_focus: dict | None) -> str:
    """Public helper so the homework route can echo the recommended surface
    back to the client in its response payload."""
    return _recommended_surface(_subject_key(subject), homework_focus)
