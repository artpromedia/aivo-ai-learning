"""Brain context normalisation for ai-svc.

The TypeScript callers (learning-svc, tutor-svc) emit a NormalizedBrainContext
that contains both camelCase and snake_case fields so this Python prompt
builder can consume either shape without surprises.

This module accepts any of the upstream shapes (a /context response, a
direct brain record, a legacy { state: ... } envelope, or already
normalised input) and returns a snake_case dictionary whose keys match the
field names prompt_builder.py expects.
"""
from __future__ import annotations

import json
import logging
from typing import Any

logger = logging.getLogger("ai-svc.brain_context")

_SNAKE_KEYS = (
    "active_accommodations",
    "active_tutors",
    "mastery_levels",
    "functioning_level_profile",
    "sensory_profile",
    "iep_profile",
    "iep_goals",
    "language_profile",
    "curriculum_alignment",
    "process_profile",
    "episodic_memory",
)


def _coerce_json(value: Any) -> Any:
    """If `value` is a JSON-encoded string, decode it. Otherwise return as-is."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:  # noqa: BLE001 — malformed JSON should not crash prompt build
            return None
    return value


def _pick(d: dict, *keys: str) -> Any:
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None


def _ensure_list(value: Any) -> list:
    value = _coerce_json(value)
    return list(value) if isinstance(value, list) else []


def _ensure_dict(value: Any) -> dict:
    value = _coerce_json(value)
    return dict(value) if isinstance(value, dict) else {}


def _is_context_shape(raw: dict) -> bool:
    return any(
        isinstance(raw.get(k), (dict, list))
        for k in ("brainState", "iepGoals", "functioningLevel", "sensoryProfile")
    )


def normalize_brain_context(raw: dict | None) -> dict:
    """Normalise an upstream brain-svc payload into a snake_case dict.

    Accepts either:
      - a `/context` response with brainState, iepGoals, sensoryProfile, etc.
      - a direct brain record (camelCase or snake_case)
      - a legacy { state: {...} } envelope
      - already-normalised input

    Returns a dictionary containing the snake_case keys prompt_builder.py
    consumes (active_accommodations, mastery_levels, etc.) plus an
    additional `_meta` block describing profile completeness.
    """
    if not isinstance(raw, dict):
        return _empty()

    top_level = raw
    if _is_context_shape(raw):
        brain_record = raw.get("brainState") if isinstance(raw.get("brainState"), dict) else {}
        source_shape = "context"
    elif isinstance(raw.get("state"), dict):
        brain_record = raw["state"]
        top_level = brain_record
        source_shape = "state"
    else:
        brain_record = raw
        source_shape = "direct"

    def from_either(*keys: str) -> Any:
        return _pick(brain_record, *keys) or _pick(top_level, *keys)

    active_accommodations = _ensure_list(
        from_either("activeAccommodations", "active_accommodations")
    )
    active_tutors = _ensure_list(from_either("activeTutors", "active_tutors"))
    mastery_levels = _ensure_dict(from_either("masteryLevels", "mastery_levels"))
    sensory_profile = _ensure_dict(from_either("sensoryProfile", "sensory_profile"))
    iep_profile = _ensure_dict(from_either("iepProfile", "iep_profile"))

    iep_goals_raw = (
        _pick(top_level, "iepGoals", "iep_goals")
        or _pick(brain_record, "iepGoals", "iep_goals")
        or iep_profile.get("goals")
    )
    iep_goals = _ensure_list(iep_goals_raw)

    functioning_level_profile = _ensure_dict(
        from_either("functioningLevel", "functioningLevelProfile", "functioning_level_profile")
    )
    fl_raw_brain = _pick(brain_record, "functioningLevel", "functioning_level")
    fl_raw_top = _pick(top_level, "functioningLevel", "functioning_level")
    # If functioningLevel was returned as an object (from /context), take
    # its .level field rather than the whole dict.
    if isinstance(fl_raw_brain, dict):
        fl_raw_brain = fl_raw_brain.get("level")
    if isinstance(fl_raw_top, dict):
        fl_raw_top = fl_raw_top.get("level")
    functioning_level = (
        fl_raw_brain
        or fl_raw_top
        or functioning_level_profile.get("level")
    )

    language_profile = _ensure_dict(from_either("languageProfile", "language_profile"))
    curriculum_alignment = _ensure_dict(from_either("curriculumAlignment", "curriculum_alignment"))
    process_profile = _ensure_dict(from_either("processProfile", "process_profile"))
    episodic_memory = _ensure_list(from_either("episodicMemory", "episodic_memory"))

    learner_raw = top_level.get("learner") if isinstance(top_level.get("learner"), dict) else {}
    learner = {}
    if learner_raw:
        learner = {
            "id": learner_raw.get("id"),
            "name": learner_raw.get("name"),
            "grade_level": learner_raw.get("gradeLevel") or learner_raw.get("grade_level"),
            "communication_mode": learner_raw.get("communicationMode") or learner_raw.get("communication_mode"),
            "diagnoses": learner_raw.get("diagnoses") or [],
            "curriculum_framework": learner_raw.get("curriculumFramework") or learner_raw.get("curriculum_framework"),
        }

    completeness = {
        "has_brain_state": bool(brain_record),
        "has_functioning_level": bool(functioning_level or functioning_level_profile),
        "has_accommodations": bool(active_accommodations),
        "has_mastery": bool(mastery_levels),
        "has_iep": bool(iep_profile or iep_goals),
        "has_sensory": bool(sensory_profile),
        "has_language": bool(language_profile),
    }

    # Preserve a passthrough copy of any extra fields the caller already set
    # (e.g. curriculum_focus, dape_profile) so we never strip them silently.
    passthrough = {}
    reserved = {
        "brainState", "brain_state", "state", "learner", "iepGoals", "iep_goals",
        "iepProfile", "iep_profile", "sensoryProfile", "sensory_profile",
        "functioningLevel", "functioningLevelProfile", "functioning_level_profile",
        "activeAccommodations", "active_accommodations", "activeTutors", "active_tutors",
        "masteryLevels", "mastery_levels", "languageProfile", "language_profile",
        "curriculumAlignment", "curriculum_alignment", "processProfile", "process_profile",
        "episodicMemory", "episodic_memory", "profileCompleteness", "sourceShape", "_meta",
    }
    if isinstance(raw, dict):
        for k, v in raw.items():
            if k not in reserved:
                passthrough[k] = v

    normalized = {
        "active_accommodations": active_accommodations,
        "active_tutors": active_tutors,
        "mastery_levels": mastery_levels,
        "functioning_level": functioning_level,
        "functioning_level_profile": functioning_level_profile,
        "sensory_profile": sensory_profile,
        "iep_profile": iep_profile,
        "iep_goals": iep_goals,
        "language_profile": language_profile,
        "curriculum_alignment": curriculum_alignment,
        "process_profile": process_profile,
        "episodic_memory": episodic_memory,
        "learner": learner,
        "_meta": {
            "source_shape": source_shape,
            "completeness": completeness,
        },
    }
    normalized.update(passthrough)
    return normalized


def _empty() -> dict:
    return {
        "active_accommodations": [],
        "active_tutors": [],
        "mastery_levels": {},
        "functioning_level": None,
        "functioning_level_profile": {},
        "sensory_profile": {},
        "iep_profile": {},
        "iep_goals": [],
        "language_profile": {},
        "curriculum_alignment": {},
        "process_profile": {},
        "episodic_memory": [],
        "learner": {},
        "_meta": {
            "source_shape": "empty",
            "completeness": {
                "has_brain_state": False,
                "has_functioning_level": False,
                "has_accommodations": False,
                "has_mastery": False,
                "has_iep": False,
                "has_sensory": False,
                "has_language": False,
            },
        },
    }
