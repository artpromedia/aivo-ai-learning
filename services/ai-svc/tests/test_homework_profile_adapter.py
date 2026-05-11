"""Tests for the homework profile adapter.

Run with: pytest services/ai-svc/tests/test_homework_profile_adapter.py -v
"""
from ai_svc.services.homework_profile_adapter import (
    build_homework_profile_summary,
    recommended_surface_for,
)


def _ctx(**overrides):
    base = {
        "active_accommodations": [],
        "mastery_levels": {},
        "sensory_profile": {},
        "iep_goals": [],
        "language_profile": {},
        "curriculum_alignment": {},
        "process_profile": {},
        "learner": {},
    }
    base.update(overrides)
    return base


class TestHomeworkProfileSummary:
    def test_includes_homework_mission(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math"},
            functioning_level="STANDARD",
            brain_context=_ctx(),
        )
        assert "Homework Mission" in s
        assert "Do not simply give the final answer" in s

    def test_includes_adaptation_rules(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math"},
            functioning_level="STANDARD",
            brain_context=_ctx(),
        )
        assert "Homework Adaptation Rules" in s
        assert "Rephrase it at the learner's access level" in s

    def test_low_verbal_forbids_long_typed(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math"},
            functioning_level="LOW_VERBAL",
            brain_context=_ctx(),
        )
        assert "Forbidden response modes" in s
        assert "long_typed_response" in s

    def test_non_verbal_recommends_non_speech(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math"},
            functioning_level="NON_VERBAL",
            brain_context=_ctx(),
        )
        assert "spoken_response" in s  # under Forbidden
        assert "choice_grid" in s

    def test_geometry_recommends_geometry_workspace(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"topic": "Area of rectangles"},
            functioning_level="STANDARD",
            brain_context=_ctx(),
        )
        assert "geometry_workspace" in s

    def test_includes_relevant_iep_goals_concise(self):
        s = build_homework_profile_summary(
            tutor_sku="ADDON_TUTOR_MATH",
            subject="math",
            homework_focus={"subject": "math"},
            functioning_level="STANDARD",
            brain_context=_ctx(
                iep_goals=["Solve visual math problems using models with 80% accuracy."]
            ),
        )
        assert "visual math problems" in s

    def test_recommended_surface_for_helper(self):
        assert recommended_surface_for("math", {"topic": "area"}) == "geometry_workspace"
        assert recommended_surface_for("math", {"topic": "multiplication"}) == "scratchpad"
        assert recommended_surface_for("ela", {"topic": "comprehension"}) == "reading_annotation"
