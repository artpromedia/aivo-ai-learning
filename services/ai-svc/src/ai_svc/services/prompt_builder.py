import json
from typing import Optional
from ..prompts.tutor_personas import TUTOR_PERSONAS, FUNCTIONING_LEVEL_ADAPTATIONS


def build_tutor_system_prompt(
    tutor_sku: str,
    brain_context: dict,
    functioning_level: str = "STANDARD",
    attempts_on_current_topic: int = 0,
    mastery_trend: str = "stable",
    current_mastery: float | None = None,
) -> str:
    persona = TUTOR_PERSONAS.get(tutor_sku, {})
    adaptation = FUNCTIONING_LEVEL_ADAPTATIONS.get(functioning_level, FUNCTIONING_LEVEL_ADAPTATIONS["STANDARD"])

    layer1 = persona.get("system_prompt", "You are a helpful AI tutor.")

    sensory_profile = brain_context.get("sensory_profile", {})
    iep_profile = brain_context.get("iep_profile", {})
    accommodations = brain_context.get("active_accommodations", [])
    mastery = brain_context.get("mastery_levels", {})
    curriculum = brain_context.get("curriculum_alignment", {})

    layer2_parts = [
        f"\n## Learner Context",
        f"- Functioning Level: {functioning_level}",
        f"- Interaction Mode: {adaptation['interaction_mode']}",
        f"- Session Length: {adaptation['session_length']}",
        f"- Teaching Method: {adaptation['method']}",
    ]

    if mastery:
        subject = persona.get("subject", "")
        subject_mastery = {k: v for k, v in mastery.items() if subject.lower() in k.lower()} if subject else mastery
        if subject_mastery:
            layer2_parts.append(f"- Current Mastery: {json.dumps(subject_mastery)}")

    if accommodations:
        layer2_parts.append(f"- Active Accommodations: {', '.join(accommodations)}")

    if sensory_profile:
        sensory_instructions = _build_sensory_instructions(sensory_profile)
        if sensory_instructions:
            layer2_parts.append(f"\n## Sensory Adjustments\n{sensory_instructions}")

    if iep_profile:
        goals = iep_profile.get("goals", [])
        if goals:
            goals_text = "\n".join(f"  - {g}" for g in goals[:5])
            layer2_parts.append(f"\n## IEP Goals\n{goals_text}")

    if curriculum:
        framework = curriculum.get("framework", "")
        if framework:
            layer2_parts.append(f"\n## Curriculum Alignment: {framework}")

    curriculum_focus = brain_context.get("curriculum_focus") or {}
    if curriculum_focus and isinstance(curriculum_focus, dict):
        focus_lines = ["\n## This Week's Focus (from parent/teacher upload)"]
        title = curriculum_focus.get("title")
        if title:
            focus_lines.append(f"- Title: {title}")
        week_start = curriculum_focus.get("weekStart")
        week_end = curriculum_focus.get("weekEnd")
        if week_start or week_end:
            focus_lines.append(f"- Date range: {week_start or '?'} to {week_end or '?'}")
        topics = curriculum_focus.get("topics") or []
        if topics:
            focus_lines.append("- Topics to anchor on: " + "; ".join(topics[:8]))
        keywords = curriculum_focus.get("keywords") or []
        if keywords:
            focus_lines.append("- Vocabulary the learner will see this week: " + ", ".join(keywords[:15]))
        skills = curriculum_focus.get("skills") or []
        if skills:
            focus_lines.append("- Skills to practice: " + "; ".join(skills[:8]))
        standards = curriculum_focus.get("standards") or []
        if standards:
            focus_lines.append("- Aligned standards: " + ", ".join(standards[:10]))
        summary = curriculum_focus.get("summary")
        if summary:
            focus_lines.append(f"- Summary: {summary}")
        focus_lines.append(
            "Prefer examples, problems, and analogies that reinforce the topics above. "
            "If the learner asks something off-topic, gently bridge back to this focus when natural."
        )
        layer2_parts.append("\n".join(focus_lines))

    layer2_parts.append(f"\n## Subject Strategy\n{persona.get('subject_strategy', '')}")

    scaffolding = _build_scaffolding_instructions(
        attempts_on_current_topic, mastery_trend, current_mastery
    )
    if scaffolding:
        layer2_parts.append(scaffolding)

    return layer1 + "\n".join(layer2_parts)


def _build_scaffolding_instructions(
    attempts: int,
    trend: str,
    current_mastery: float | None,
) -> str:
    """Return scaffolding / remediation guidance based on attempt count and trend.

    - Attempts <= 2: no scaffolding overhead.
    - Attempts 3-4: micro-step + concrete-before-abstract guidance.
    - Attempts >= 5: significant scaffolding — prerequisites, manipulatives.
    - Trend 'declining': regression-aware language.
    - Trend 'stable' with low mastery (< 0.4): switch teaching approach.
    """
    parts: list[str] = []

    attempts = max(0, int(attempts or 0))
    if attempts >= 5:
        parts.append(
            "\n## Scaffolding Mode (Heavy)\n"
            "This topic requires significant scaffolding. The learner has attempted "
            "this topic 5 or more times. Start with prerequisite skills before "
            "re-introducing the target concept. Use manipulatives, visual models, "
            "and concrete representations. Celebrate small wins explicitly. Avoid "
            "abstract notation until the learner demonstrates fluency with the "
            "concrete form."
        )
    elif attempts >= 3:
        parts.append(
            "\n## Scaffolding Mode (Light)\n"
            "The learner has struggled with this topic across multiple attempts. "
            "Break the concept into smaller steps. Use concrete examples before "
            "abstract concepts. Check understanding at each micro-step before "
            "moving on, and offer a hint before correcting an answer."
        )

    trend_normalized = (trend or "stable").lower()
    if trend_normalized == "declining":
        parts.append(
            "\n## Mastery Trend: Declining\n"
            "The learner's mastery on this topic is declining. This may indicate "
            "confusion, fatigue, or a gap in prerequisite knowledge. Gently assess "
            "what they remember from previous sessions before introducing new "
            "content. Do not push forward — consolidate first."
        )
    elif (
        trend_normalized == "stable"
        and current_mastery is not None
        and current_mastery < 0.4
    ):
        parts.append(
            "\n## Mastery Trend: Stable at Low Level\n"
            "The learner is not making progress with the current teaching approach. "
            "Try a completely different modality (visual instead of verbal, hands-on "
            "instead of explained, story-based instead of procedural). Avoid "
            "repeating the same explanation."
        )

    return "\n".join(parts)


def build_content_generation_prompt(
    subject: str,
    topic: str,
    grade_target: str,
    delivery_level: str,
    functioning_level: str,
    brain_context: dict,
    content_type: str = "LESSON",
) -> tuple[str, str]:
    adaptation = FUNCTIONING_LEVEL_ADAPTATIONS.get(functioning_level, FUNCTIONING_LEVEL_ADAPTATIONS["STANDARD"])

    system_prompt = f"""You are AIVO's content generation engine. Generate educational content that is:
- Age-appropriate and engaging
- Aligned to {grade_target} grade objectives
- Delivered at {delivery_level} comprehension level
- Adapted for {functioning_level} functioning level ({adaptation['method']})
- Using {adaptation['response_format']} format

Content must be safe, accurate, and free of bias. Never include violent, sexual, or inappropriate content.
Never reference real children or specific personal situations."""

    sensory_profile = brain_context.get("sensory_profile", {})
    if sensory_profile:
        system_prompt += f"\n\n## Sensory Profile Adjustments\n{_build_sensory_instructions(sensory_profile)}"

    user_prompt_parts = [
        f"Generate a {content_type.lower()} for {subject} on the topic: {topic}",
        f"Grade target: {grade_target}",
        f"Delivery level: {delivery_level}",
    ]

    if content_type == "LESSON":
        user_prompt_parts.append("""
Include in your response as JSON:
{
  "title": "lesson title",
  "objective": "what the learner will understand",
  "introduction": "engaging hook (2-3 sentences)",
  "content": [
    {"type": "explanation", "text": "..."},
    {"type": "example", "text": "..."},
    {"type": "practice", "question": "...", "answer": "...", "hint": "..."}
  ],
  "summary": "key takeaway",
  "vocabulary": [{"term": "...", "definition": "..."}],
  "next_steps": "what to explore next"
}""")
    elif content_type == "PRACTICE":
        user_prompt_parts.append("""
Generate 5 practice problems as JSON:
{
  "title": "practice set title",
  "problems": [
    {"question": "...", "choices": ["A", "B", "C", "D"], "correct": "A", "explanation": "...", "hint": "...", "difficulty": 1-5}
  ]
}""")

    accommodations = brain_context.get("active_accommodations", [])
    if accommodations:
        user_prompt_parts.append(f"Apply these accommodations: {', '.join(accommodations)}")

    return system_prompt, "\n".join(user_prompt_parts)


def _build_sensory_instructions(sensory_profile: dict) -> str:
    instructions = []

    visual = sensory_profile.get("visual", "typical")
    if visual == "hyper":
        instructions.append("- Reduce visual complexity: use muted colors, minimal animations, clean layouts")
    elif visual == "hypo":
        instructions.append("- Increase visual stimulation: use bright colors, bold text, engaging visuals")

    auditory = sensory_profile.get("auditory", "typical")
    if auditory == "hyper":
        instructions.append("- Minimize audio: use soft tones, avoid sudden sounds, provide text alternatives")
    elif auditory == "hypo":
        instructions.append("- Enhance audio: use clear narration, sound effects for engagement")

    tactile = sensory_profile.get("tactile", "typical")
    if tactile == "hyper":
        instructions.append("- Minimize haptic feedback, avoid complex touch interactions")

    return "\n".join(instructions) if instructions else ""
