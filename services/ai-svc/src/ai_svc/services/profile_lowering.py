"""Profile-Lowered Instruction Protocol builder.

The tutor must preserve the assigned grade-level or general-education
objective while lowering the access path to the learner's profile. This
module emits a deterministic prompt block that summarises the learner's
functioning level, communication mode, active accommodations, mastery
gaps, IEP goals, sensory constraints, language profile, curriculum
alignment, and process profile — and instructs the tutor to adapt
representation, response mode, pacing, scaffolding, language load,
sensory load, examples, and tools.

The block is intentionally deterministic (no LLM input) so unit tests
can assert exact phrasing for safety-critical rules.
"""
from __future__ import annotations

from typing import Any

PROFILE_LOWERING_HEADER = "## Profile-Lowered Instruction Protocol"

PROFILE_LOWERING_RULE = (
    "Teach the assigned grade-level or general-education objective, but "
    "lower the access path to the learner's profile. Do not simply make "
    "the academic target easier unless the learner's profile explicitly "
    "requires prerequisite rebuilding. Preserve the learning goal while "
    "adapting representation, response mode, pacing, scaffolding, language "
    "load, sensory load, examples, and tools."
)

_FUNCTIONING_RULES = {
    "STANDARD": [
        "Use grade-level vocabulary with brief explanations.",
        "Use Socratic questioning and productive struggle.",
        "Offer hints before answers.",
    ],
    "SUPPORTED": [
        "Use shorter steps and concrete examples.",
        "Check understanding after each step.",
        "Provide visual model before symbolic notation.",
    ],
    "LOW_VERBAL": [
        "Reduce verbal load.",
        "Use picture-first, gesture/touch, 2-choice or 3-choice response modes.",
        "Avoid long paragraphs.",
        "Use demonstration before asking for an answer.",
    ],
    "NON_VERBAL": [
        "Use touch, selection, matching, drag, drawing, AAC-friendly choices, "
        "and caregiver/facilitator support.",
        "Do not require spoken response.",
        "Interpret nonverbal responses as valid evidence.",
    ],
    "PRE_SYMBOLIC": [
        "Do not present abstract academic tasks as text-only problems.",
        "Use sensory-safe exposure, object matching, cause-effect, routines, "
        "imitation, and parent-mediated learning.",
        "Convert grade-level objective into access skills while preserving "
        "the long-term educational target.",
    ],
}


_SUBJECT_LOWERING = {
    "math": (
        "If the general-education task is a math task such as area, fractions, "
        "or word problems, preserve the objective but adapt access: show the "
        "model visually (rectangle, fraction bar, number line, grid), label "
        "values, offer a scratchpad or grid, use repeated addition or tiling "
        "before formula if mastery is low, and allow number, drawing, drag, "
        "or choice response based on profile."
    ),
    "geometry": (
        "If the general-education task is \"find area of a rectangle,\" preserve "
        "the objective but adapt access: show a rectangle visually, label sides, "
        "offer scratchpad or grid, use repeated addition or tiling before "
        "formula if mastery is low, and allow number, drawing, drag, or choice "
        "response based on profile."
    ),
    "homework": (
        "If the learner uploads grade-level homework, do not solve it directly. "
        "Re-express the problem at the learner's access level, model one step, "
        "then guide the learner to complete the next step."
    ),
    "ela": (
        "Preserve the comprehension or writing target, but lower text density, "
        "add vocabulary support, chunk passages, and allow oral, choice, "
        "annotation, or sentence-frame responses."
    ),
    "science": (
        "Preserve the scientific concept, but use diagram, classification, "
        "sequencing, observation, and concrete examples before abstract "
        "vocabulary."
    ),
    "history": (
        "Preserve the historical concept, but use timeline, cause/effect, map, "
        "compare/contrast, and vocabulary supports."
    ),
    "coding": (
        "Preserve the computational thinking target, but use trace tables, "
        "block-level explanations, and small debugging steps."
    ),
}


SAFETY_BLOCK = (
    "\n## Tutor Safety and Pedagogy Limits\n"
    "- Do not ignore learner accommodations.\n"
    "- Do not skip visual or scratchpad supports when the profile indicates they help.\n"
    "- Do not require speech from a NON_VERBAL learner.\n"
    "- Do not require long typed responses from LOW_VERBAL or PRE_SYMBOLIC learners.\n"
    "- Do not provide final homework answers before the learner attempts a step.\n"
    "- Do not lower expectations by removing the educational objective unless "
    "the profile requires prerequisite rebuilding."
)


def _subject_key(subject: str | None, topic: str | None) -> str | None:
    s = (subject or "").lower()
    t = (topic or "").lower()
    if "geometry" in s or "geometry" in t or "area" in t or "rectangle" in t:
        return "geometry"
    if any(k in s for k in ("math", "mathematics", "arithmetic", "algebra")):
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


_SUBJECT_ALIASES = {
    "mathematics": ("math", "mathematics", "geometry", "algebra", "arithmetic"),
    "math": ("math", "mathematics", "geometry", "algebra", "arithmetic"),
    "english language arts": ("ela", "english", "reading", "writing", "literature"),
    "ela": ("ela", "english", "reading", "writing", "literature"),
    "science": ("science", "biology", "chemistry", "physics"),
    "history": ("history", "social"),
    "history & social studies": ("history", "social"),
    "coding & computer science": ("coding", "code", "programming", "computer"),
    "coding": ("coding", "code", "programming", "computer"),
}


def _subject_aliases(subject: str | None) -> tuple[str, ...]:
    if not subject:
        return ()
    s = subject.lower().strip()
    return _SUBJECT_ALIASES.get(s, (s.split()[0],) if s else ())


def _relevant_mastery(mastery: dict, subject: str | None, topic: str | None) -> dict:
    if not isinstance(mastery, dict):
        return {}
    aliases = _subject_aliases(subject)
    t = (topic or "").lower()
    out: dict = {}
    for skill, score in mastery.items():
        key = str(skill).lower()
        if any(a and a in key for a in aliases) or (t and any(part in key for part in t.split() if part)):
            out[skill] = score
    # If we still have nothing but the caller passed mastery, include up to 6 so
    # the model at least sees the relevant skills the learner is working on.
    if not out and not aliases and not t:
        for i, (k, v) in enumerate(mastery.items()):
            if i >= 6:
                break
            out[k] = v
    return out


def _relevant_iep_goals(goals: Any, subject: str | None, topic: str | None) -> list[str]:
    if not isinstance(goals, list):
        return []
    s = (subject or "").lower()
    t = (topic or "").lower()
    out: list[str] = []
    for g in goals:
        if isinstance(g, str):
            text = g
        elif isinstance(g, dict):
            text = str(g.get("description") or g.get("goal") or g.get("text") or "")
        else:
            continue
        if not text:
            continue
        # If neither subject nor topic mention is present, keep the goal —
        # IEP goals are often cross-cutting (e.g. alternative response modes).
        lt = text.lower()
        if not s and not t:
            out.append(text)
        elif (s and s.split()[0] in lt) or (t and any(part in lt for part in t.split() if part)) or "alternative" in lt or "response" in lt:
            out.append(text)
        else:
            out.append(text)
    return out[:5]


def build_profile_lowering_block(
    *,
    subject: str | None,
    topic: str | None,
    grade_target: str | None,
    functioning_level: str,
    brain_context: dict,
) -> str:
    """Return the deterministic Profile-Lowered Instruction Protocol block."""
    lines: list[str] = ["\n" + PROFILE_LOWERING_HEADER, PROFILE_LOWERING_RULE]

    fl = functioning_level if functioning_level in _FUNCTIONING_RULES else "STANDARD"
    lines.append(f"\n### Functioning Level: {fl}")
    for rule in _FUNCTIONING_RULES[fl]:
        lines.append(f"- {rule}")

    # Learner evidence section — only render what we actually have.
    bc = brain_context if isinstance(brain_context, dict) else {}
    learner = bc.get("learner") or {}
    accommodations = bc.get("active_accommodations") or []
    mastery = bc.get("mastery_levels") or {}
    sensory = bc.get("sensory_profile") or {}
    language = bc.get("language_profile") or {}
    curriculum = bc.get("curriculum_alignment") or {}
    process = bc.get("process_profile") or {}
    iep_goals = bc.get("iep_goals") or []

    evidence: list[str] = []
    comm = learner.get("communication_mode") if isinstance(learner, dict) else None
    if comm:
        evidence.append(f"- Communication mode: {comm}")
    if grade_target:
        evidence.append(f"- Grade-level objective target: {grade_target}")
    if accommodations:
        evidence.append("- Active accommodations: " + ", ".join(str(a) for a in accommodations))
    relevant_mastery = _relevant_mastery(mastery, subject, topic)
    if relevant_mastery:
        evidence.append(
            "- Relevant mastery (0–1): "
            + ", ".join(f"{k}={v}" for k, v in list(relevant_mastery.items())[:6])
        )
    relevant_goals = _relevant_iep_goals(iep_goals, subject, topic)
    if relevant_goals:
        evidence.append("- IEP goals to honour:")
        for g in relevant_goals:
            evidence.append(f"  - {g}")
    if sensory:
        sens_pairs = ", ".join(f"{k}={v}" for k, v in sensory.items() if v)
        if sens_pairs:
            evidence.append(f"- Sensory profile: {sens_pairs}")
    if language:
        dom = language.get("dominant_language") or language.get("dominantLanguage")
        tgt = language.get("target_language") or language.get("targetLanguage")
        if dom or tgt:
            parts = []
            if dom:
                parts.append(f"dominant={dom}")
            if tgt:
                parts.append(f"target={tgt}")
            evidence.append("- Language profile: " + ", ".join(parts))
    if curriculum:
        framework = curriculum.get("framework") or curriculum.get("currentFocus") or curriculum.get("current_focus")
        if framework:
            evidence.append(f"- Curriculum alignment: {framework}")
    if process:
        ppairs = []
        for k in (
            "scratchpadUseRate", "scratchpad_use_rate",
            "hintDependenceRate", "hint_dependence_rate",
            "fineMotorDragConcern", "fine_motor_drag_concern",
            "selfCorrectionSignal", "self_correction_signal",
        ):
            if k in process and process[k] is not None:
                ppairs.append(f"{k}={process[k]}")
        modes = process.get("preferredInteractionModes") or process.get("preferred_interaction_modes")
        if modes:
            ppairs.append("preferred_modes=" + ",".join(str(m) for m in modes))
        if ppairs:
            evidence.append("- Process profile: " + "; ".join(ppairs))

    if evidence:
        lines.append("\n### Learner Profile Evidence")
        lines.extend(evidence)

    # Subject lowering example.
    key = _subject_key(subject, topic)
    if key and key in _SUBJECT_LOWERING:
        lines.append("\n### Subject Lowering Example")
        lines.append(_SUBJECT_LOWERING[key])

    # Homework guidance is included anywhere "homework" is in the topic so
    # the homework helper inherits the guide-don't-solve directive.
    if topic and "homework" in topic.lower():
        lines.append("\n### Homework Guidance")
        lines.append(_SUBJECT_LOWERING["homework"])

    lines.append(SAFETY_BLOCK)
    return "\n".join(lines)
