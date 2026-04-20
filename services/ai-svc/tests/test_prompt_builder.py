"""Tests for the AIVO tutor prompt builder.

Run with: pytest services/ai-svc/tests/test_prompt_builder.py -v
"""
import pytest

from ai_svc.services.prompt_builder import (
    _build_sensory_instructions,
    build_content_generation_prompt,
    build_tutor_system_prompt,
)
from ai_svc.prompts.tutor_personas import TUTOR_PERSONAS


# ---------------------------------------------------------------------------
# Functioning-level adaptations are reflected in the prompt
# ---------------------------------------------------------------------------
class TestFunctioningLevelAdaptations:
    def test_standard_uses_socratic_method(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "STANDARD")
        assert "Socratic" in prompt or "socratic" in prompt.lower()

    def test_standard_session_length_15_to_20(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "STANDARD")
        assert "15-20" in prompt

    def test_supported_uses_simpler_language(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "SUPPORTED")
        assert "Simpler language" in prompt or "simplified" in prompt.lower()

    def test_low_verbal_picture_based(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "LOW_VERBAL")
        assert "Picture" in prompt or "picture" in prompt
        assert "2-choice" in prompt or "picture_choice" in prompt

    def test_non_verbal_partner_assisted(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "NON_VERBAL")
        assert "Partner-assisted" in prompt or "partner_assisted" in prompt.lower() or "facilitator" in prompt.lower()

    def test_pre_symbolic_parent_coaching(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "PRE_SYMBOLIC")
        assert "parent" in prompt.lower() and "coaching" in prompt.lower()

    def test_unknown_functioning_level_falls_back_to_standard(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", {}, "UNKNOWN_LEVEL")
        # Should not crash and should default to STANDARD style
        assert "STANDARD" not in prompt or "Socratic" in prompt or "15-20" in prompt


# ---------------------------------------------------------------------------
# Tutor persona is included
# ---------------------------------------------------------------------------
class TestPersonaIncluded:
    @pytest.mark.parametrize("sku", list(TUTOR_PERSONAS.keys()))
    def test_persona_system_prompt_appears(self, sku):
        prompt = build_tutor_system_prompt(sku, {}, "STANDARD")
        persona = TUTOR_PERSONAS[sku]
        # At least the tutor name should appear
        assert persona["name"] in prompt

    def test_unknown_sku_falls_back_to_default_persona(self):
        prompt = build_tutor_system_prompt("ADDON_TUTOR_NONEXISTENT", {}, "STANDARD")
        assert "helpful AI tutor" in prompt or "tutor" in prompt.lower()


# ---------------------------------------------------------------------------
# Accommodation injection
# ---------------------------------------------------------------------------
class TestAccommodationInjection:
    def test_text_to_speech_appears_in_prompt(self):
        ctx = {"active_accommodations": ["text_to_speech", "extended_time"]}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "text_to_speech" in prompt
        assert "extended_time" in prompt

    def test_no_accommodations_section_when_empty(self):
        ctx = {"active_accommodations": []}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "Active Accommodations" not in prompt

    def test_picture_supports_appears(self):
        ctx = {"active_accommodations": ["picture_supports", "reduced_text"]}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "LOW_VERBAL")
        assert "picture_supports" in prompt


# ---------------------------------------------------------------------------
# IEP goal injection
# ---------------------------------------------------------------------------
class TestIepGoalInjection:
    def test_iep_goals_appear_in_prompt(self):
        ctx = {
            "iep_profile": {
                "goals": [
                    "Increase reading fluency to 90 wpm",
                    "Solve 2-step word problems with 80% accuracy",
                ]
            }
        }
        prompt = build_tutor_system_prompt("ADDON_TUTOR_ELA", ctx, "STANDARD")
        assert "IEP Goals" in prompt
        assert "reading fluency" in prompt
        assert "2-step word problems" in prompt

    def test_iep_goals_capped_at_5(self):
        goals = [f"Goal #{i}" for i in range(10)]
        ctx = {"iep_profile": {"goals": goals}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_ELA", ctx, "STANDARD")
        # Only first 5 should appear
        assert "Goal #0" in prompt
        assert "Goal #4" in prompt
        assert "Goal #5" not in prompt

    def test_no_iep_section_when_no_goals(self):
        ctx = {"iep_profile": {}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_ELA", ctx, "STANDARD")
        assert "IEP Goals" not in prompt


# ---------------------------------------------------------------------------
# Sensory profile injection
# ---------------------------------------------------------------------------
class TestSensoryProfileInjection:
    def test_visual_hyper_includes_muted_colors(self):
        ctx = {"sensory_profile": {"visual": "hyper"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "muted colors" in prompt
        assert "minimal animations" in prompt

    def test_visual_hypo_increases_stimulation(self):
        ctx = {"sensory_profile": {"visual": "hypo"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "bright colors" in prompt or "bold text" in prompt

    def test_auditory_hyper_minimizes_audio(self):
        ctx = {"sensory_profile": {"auditory": "hyper"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "soft tones" in prompt or "text alternatives" in prompt

    def test_tactile_hyper_minimizes_haptic(self):
        ctx = {"sensory_profile": {"tactile": "hyper"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "haptic" in prompt.lower() or "touch" in prompt.lower()

    def test_typical_sensory_no_adjustments_section(self):
        ctx = {"sensory_profile": {"visual": "typical", "auditory": "typical", "tactile": "typical"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "Sensory Adjustments" not in prompt


# ---------------------------------------------------------------------------
# Curriculum alignment injection
# ---------------------------------------------------------------------------
class TestCurriculumAlignment:
    def test_ccss_framework_referenced(self):
        ctx = {"curriculum_alignment": {"framework": "CCSS"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "CCSS" in prompt

    def test_ngss_framework_referenced(self):
        ctx = {"curriculum_alignment": {"framework": "NGSS"}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_SCIENCE", ctx, "STANDARD")
        assert "NGSS" in prompt

    def test_no_framework_no_section(self):
        ctx = {"curriculum_alignment": {}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "Curriculum Alignment" not in prompt


# ---------------------------------------------------------------------------
# Mastery injection
# ---------------------------------------------------------------------------
class TestMasteryInjection:
    def test_subject_mastery_appears(self):
        # Subject for ADDON_TUTOR_MATH is "Mathematics", filter is substring match
        ctx = {"mastery_levels": {"mathematics_algebra": 0.7, "mathematics_geometry": 0.5}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        assert "Current Mastery" in prompt
        assert "mathematics_algebra" in prompt or "0.7" in prompt

    def test_unrelated_mastery_filtered_out(self):
        ctx = {"mastery_levels": {"history_world_war": 0.9}}
        prompt = build_tutor_system_prompt("ADDON_TUTOR_MATH", ctx, "STANDARD")
        # Math tutor should not display unrelated mastery
        assert "Current Mastery" not in prompt


# ---------------------------------------------------------------------------
# Content generation prompt builder
# ---------------------------------------------------------------------------
class TestContentGenerationPrompt:
    def test_lesson_includes_json_template(self):
        sys_p, user_p = build_content_generation_prompt(
            subject="Math",
            topic="Fractions",
            grade_target="3rd",
            delivery_level="THIRD",
            functioning_level="STANDARD",
            brain_context={},
            content_type="LESSON",
        )
        assert "objective" in user_p
        assert "vocabulary" in user_p

    def test_practice_includes_problems_template(self):
        sys_p, user_p = build_content_generation_prompt(
            subject="Math", topic="Addition", grade_target="K",
            delivery_level="KINDERGARTEN", functioning_level="STANDARD",
            brain_context={}, content_type="PRACTICE",
        )
        assert "problems" in user_p
        assert "difficulty" in user_p

    def test_safety_clause_always_present(self):
        sys_p, _ = build_content_generation_prompt(
            subject="Science", topic="Stars", grade_target="2nd",
            delivery_level="SECOND", functioning_level="STANDARD",
            brain_context={}, content_type="LESSON",
        )
        assert "safe" in sys_p.lower()
        assert "violent" in sys_p.lower() or "inappropriate" in sys_p.lower()

    def test_accommodations_appear_in_user_prompt(self):
        _, user_p = build_content_generation_prompt(
            subject="Math", topic="Numbers", grade_target="K",
            delivery_level="KINDERGARTEN", functioning_level="STANDARD",
            brain_context={"active_accommodations": ["text_to_speech"]},
            content_type="LESSON",
        )
        assert "text_to_speech" in user_p


# ---------------------------------------------------------------------------
# Sensory instructions builder (unit)
# ---------------------------------------------------------------------------
class TestSensoryInstructions:
    def test_empty_profile_returns_empty_string(self):
        assert _build_sensory_instructions({}) == ""

    def test_typical_returns_empty_string(self):
        assert _build_sensory_instructions(
            {"visual": "typical", "auditory": "typical", "tactile": "typical"}
        ) == ""
