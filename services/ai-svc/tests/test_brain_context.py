"""Tests for the ai-svc brain context normaliser.

Run with: pytest services/ai-svc/tests/test_brain_context.py -v
"""
import json

from ai_svc.services.brain_context import normalize_brain_context


class TestBrainContextNormalization:
    def test_returns_empty_for_none(self):
        n = normalize_brain_context(None)
        assert n["active_accommodations"] == []
        assert n["mastery_levels"] == {}
        assert n["_meta"]["source_shape"] == "empty"

    def test_returns_empty_for_non_dict(self):
        n = normalize_brain_context("not a dict")  # type: ignore[arg-type]
        assert n["_meta"]["source_shape"] == "empty"

    def test_state_envelope_extracts_brain_record(self):
        raw = {
            "state": {
                "active_accommodations": ["scratchpad", "extended_time"],
                "mastery_levels": {"math.geometry.area": 0.3},
            }
        }
        n = normalize_brain_context(raw)
        assert n["_meta"]["source_shape"] == "state"
        assert "scratchpad" in n["active_accommodations"]
        assert n["mastery_levels"]["math.geometry.area"] == 0.3

    def test_direct_brain_record_camel_case(self):
        raw = {
            "activeAccommodations": ["picture_supports"],
            "masteryLevels": {"math.addition": 0.5},
            "activeTutors": ["nova"],
        }
        n = normalize_brain_context(raw)
        assert n["_meta"]["source_shape"] == "direct"
        assert "picture_supports" in n["active_accommodations"]
        assert n["mastery_levels"]["math.addition"] == 0.5
        assert "nova" in n["active_tutors"]

    def test_direct_brain_record_snake_case(self):
        raw = {
            "active_accommodations": ["reduced_text"],
            "mastery_levels": {"ela.reading": 0.6},
        }
        n = normalize_brain_context(raw)
        assert "reduced_text" in n["active_accommodations"]
        assert n["mastery_levels"]["ela.reading"] == 0.6

    def test_context_shape_extracts_joined_fields(self):
        raw = {
            "learner": {"id": "L1", "name": "X", "gradeLevel": "5", "communicationMode": "choice_touch"},
            "brainState": {
                "activeAccommodations": ["scratchpad"],
                "masteryLevels": {"math.geometry.area": 0.35},
            },
            "sensoryProfile": {"visual": "typical", "auditory": "hyper"},
            "iepGoals": ["Solve visual math problems"],
            "functioningLevel": {"level": "LOW_VERBAL", "deliveryLevel": "SECOND"},
            "languageProfile": {"dominant_language": "English"},
        }
        n = normalize_brain_context(raw)
        assert n["_meta"]["source_shape"] == "context"
        assert n["learner"]["grade_level"] == "5"
        assert n["learner"]["communication_mode"] == "choice_touch"
        assert "scratchpad" in n["active_accommodations"]
        assert n["mastery_levels"]["math.geometry.area"] == 0.35
        assert n["sensory_profile"]["auditory"] == "hyper"
        assert "Solve visual math problems" in n["iep_goals"]
        assert n["functioning_level"] == "LOW_VERBAL"
        assert n["language_profile"]["dominant_language"] == "English"

    def test_camel_case_normalises_to_snake_case_keys(self):
        # camelCase input must produce snake_case keys for prompt builder.
        raw = {"masteryLevels": {"x": 0.1}, "activeAccommodations": ["a"]}
        n = normalize_brain_context(raw)
        assert "mastery_levels" in n
        assert "active_accommodations" in n

    def test_json_string_arrays_parse(self):
        raw = {"active_accommodations": json.dumps(["scratchpad", "extended_time"])}
        n = normalize_brain_context(raw)
        assert "scratchpad" in n["active_accommodations"]

    def test_malformed_json_does_not_crash(self):
        raw = {"active_accommodations": "{not-json"}
        n = normalize_brain_context(raw)
        # The accommodation field stays empty, but the rest of the profile
        # still normalises cleanly.
        assert n["active_accommodations"] == []

    def test_completeness_flags_set(self):
        raw = {
            "activeAccommodations": ["picture_supports"],
            "masteryLevels": {"k": 0.4},
            "iepProfile": {"goals": ["a goal"]},
            "sensoryProfile": {"visual": "hyper"},
            "languageProfile": {"dominant_language": "en"},
            "functioningLevel": "LOW_VERBAL",
        }
        n = normalize_brain_context(raw)
        c = n["_meta"]["completeness"]
        assert c["has_accommodations"]
        assert c["has_mastery"]
        assert c["has_iep"]
        assert c["has_sensory"]
        assert c["has_language"]
        assert c["has_functioning_level"]
