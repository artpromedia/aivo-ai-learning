"""Tutor profile integration tests.

These tests fail if tutor behaviour becomes generic — i.e. they prove
the full LOW_VERBAL learner profile reaches the system prompt that the
LLM gateway will receive.

Run with: pytest services/ai-svc/tests/test_tutor_profile_integration.py -v
"""
from ai_svc.services.brain_context import normalize_brain_context
from ai_svc.services.homework_profile_adapter import build_homework_profile_summary
from ai_svc.services.profile_lowering import build_profile_lowering_block
from ai_svc.services.prompt_builder import (
    build_content_generation_prompt,
    build_tutor_system_prompt,
)


LOW_VERBAL_GEOMETRY_CONTEXT = {
    "learner": {
        "id": "learner-low-verbal-geometry",
        "name": "Test Learner",
        "gradeLevel": "5",
        "communicationMode": "choice_touch",
    },
    "brainState": {
        "functioningLevelProfile": {
            "level": "LOW_VERBAL",
            "deliveryLevel": "SECOND",
            "notes": "Learner benefits from visuals and limited verbal load.",
        },
        "activeAccommodations": [
            "picture_supports",
            "reduced_text",
            "scratchpad",
            "extended_time",
        ],
        "masteryLevels": {
            "math.geometry.area": 0.35,
            "math.multiplication": 0.42,
        },
        "processProfile": {
            "scratchpadUseRate": 0.8,
            "hintDependenceRate": 0.4,
            "fineMotorDragConcern": False,
            "selfCorrectionSignal": "high",
            "preferredInteractionModes": ["scratchpad", "choice_grid", "geometry_workspace"],
        },
        "curriculumAlignment": {
            "framework": "CCSS",
            "currentFocus": "Area of rectangles and composite figures",
        },
    },
    "sensoryProfile": {"visual": "typical", "auditory": "hyper"},
    "iepGoals": [
        "Solve visual math problems using models with 80% accuracy.",
        "Use alternative response methods for academic tasks.",
    ],
    "languageProfile": {"dominant_language": "English"},
}


class TestTutorPromptUsesFullProfile:
    def test_prompt_carries_functioning_level_and_accommodations(self):
        prompt = build_tutor_system_prompt(
            "ADDON_TUTOR_MATH",
            LOW_VERBAL_GEOMETRY_CONTEXT,
            "LOW_VERBAL",
        )
        for needle in [
            "LOW_VERBAL",
            "picture_supports",
            "reduced_text",
            "scratchpad",
            "extended_time",
            "math.geometry.area",
            "Profile-Lowered Instruction Protocol",
            "Preserve the learning goal",
            "geometry_workspace",
            "Do not require speech",
        ]:
            assert needle in prompt, f"missing {needle}"

    def test_prompt_does_not_become_empty_for_camel_case_input(self):
        prompt = build_tutor_system_prompt(
            "ADDON_TUTOR_MATH",
            {"masteryLevels": {"math.geometry.area": 0.3}, "activeAccommodations": ["scratchpad"]},
            "LOW_VERBAL",
        )
        # The normaliser converted camelCase → snake_case so the prompt
        # builder's snake_case lookups must hit.
        assert "scratchpad" in prompt
        assert "math.geometry.area" in prompt

    def test_content_generation_prompt_includes_profile_lowering(self):
        system, user = build_content_generation_prompt(
            subject="math",
            topic="area_rectangle",
            grade_target="5",
            delivery_level="SECOND",
            functioning_level="LOW_VERBAL",
            brain_context=LOW_VERBAL_GEOMETRY_CONTEXT,
            content_type="LESSON",
        )
        assert "Profile-Lowered Instruction Protocol" in user
        assert "LOW_VERBAL" in user
        assert "profileAdaptationsApplied" in user
        assert "geometry_workspace" in user
        assert "scratchpad" in user

    def test_homework_summary_full_profile(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math", "topic": "Area of rectangles"},
            functioning_level="LOW_VERBAL",
            brain_context=LOW_VERBAL_GEOMETRY_CONTEXT,
        )
        for needle in [
            "LOW_VERBAL",
            "picture_supports",
            "scratchpad",
            "extended_time",
            "geometry_workspace",
            "Do not simply give the final answer",
            "visual math problems",
        ]:
            assert needle in s, f"missing {needle}"
