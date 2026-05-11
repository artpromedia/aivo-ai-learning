"""Tests for the profile-lowered instruction protocol.

Run with: pytest services/ai-svc/tests/test_profile_lowering.py -v
"""
import pytest

from ai_svc.services.profile_lowering import (
    PROFILE_LOWERING_HEADER,
    PROFILE_LOWERING_RULE,
    build_profile_lowering_block,
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


class TestProfileLoweringBlock:
    def test_includes_header_and_rule(self):
        block = build_profile_lowering_block(
            subject="math", topic="area_rectangle", grade_target="5",
            functioning_level="STANDARD", brain_context=_ctx(),
        )
        assert PROFILE_LOWERING_HEADER in block
        assert PROFILE_LOWERING_RULE in block
        assert "preserve the learning goal" in block.lower()

    def test_low_verbal_has_picture_first_and_reduced_verbal(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="LOW_VERBAL", brain_context=_ctx(),
        )
        assert "picture-first" in block.lower() or "picture first" in block.lower()
        assert "verbal load" in block.lower()

    def test_non_verbal_forbids_required_speech(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="NON_VERBAL", brain_context=_ctx(),
        )
        assert "do not require spoken response" in block.lower()

    def test_pre_symbolic_avoids_text_only(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="PRE_SYMBOLIC", brain_context=_ctx(),
        )
        assert "text-only" in block.lower()

    def test_geometry_subject_lowering_example(self):
        block = build_profile_lowering_block(
            subject="math", topic="area_rectangle", grade_target="5",
            functioning_level="STANDARD", brain_context=_ctx(),
        )
        assert "rectangle" in block.lower()
        assert "scratchpad" in block.lower() or "grid" in block.lower()

    def test_accommodations_appear(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="LOW_VERBAL",
            brain_context=_ctx(active_accommodations=["picture_supports", "scratchpad"]),
        )
        assert "picture_supports" in block
        assert "scratchpad" in block

    def test_mastery_appears_when_relevant(self):
        block = build_profile_lowering_block(
            subject="math", topic="geometry.area", grade_target="5",
            functioning_level="STANDARD",
            brain_context=_ctx(mastery_levels={"math.geometry.area": 0.35}),
        )
        assert "math.geometry.area" in block

    def test_iep_goals_appear(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="STANDARD",
            brain_context=_ctx(iep_goals=["Solve visual math problems with 80% accuracy"]),
        )
        assert "visual math problems" in block

    def test_process_profile_renders(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="STANDARD",
            brain_context=_ctx(
                process_profile={
                    "scratchpadUseRate": 0.8,
                    "preferredInteractionModes": ["scratchpad", "geometry_workspace"],
                }
            ),
        )
        assert "scratchpadUseRate" in block
        assert "geometry_workspace" in block

    def test_no_hallucinated_iep_when_missing(self):
        # When the profile has no IEP goals, the block must not pretend
        # there are any.
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="STANDARD", brain_context=_ctx(),
        )
        assert "Relevant IEP" not in block
        assert "IEP goals to honour" not in block

    def test_homework_topic_guidance_says_guide_not_solve(self):
        block = build_profile_lowering_block(
            subject="math", topic="homework", grade_target="5",
            functioning_level="STANDARD", brain_context=_ctx(),
        )
        assert "do not solve it directly" in block.lower()
        assert "model one step" in block.lower()

    def test_safety_block_forbids_required_speech_for_non_verbal(self):
        block = build_profile_lowering_block(
            subject="math", topic="area", grade_target="5",
            functioning_level="NON_VERBAL", brain_context=_ctx(),
        )
        assert "do not require speech from a non_verbal" in block.lower()
