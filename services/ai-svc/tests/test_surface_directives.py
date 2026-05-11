"""Tests for tutor surface directive validation.

Run with: pytest services/ai-svc/tests/test_surface_directives.py -v
"""
from ai_svc.services.surface_directives import (
    SURFACE_TOOL_PROTOCOL,
    validate_directive,
    validate_directives,
)


def _valid_geometry_directive() -> dict:
    return {
        "id": "directive_geo_area_01",
        "type": "show_geometry",
        "surfaceId": "surface_geo_area_01",
        "reason": "Visual support for area",
        "expectedLearnerAction": "Write the area formula or count grid squares.",
        "profileAdaptationRationale": "LOW_VERBAL learner with visual_support accommodation.",
        "surface": {
            "id": "surface_geo_area_01",
            "type": "geometry_workspace",
            "prompt": "Find the area of this rectangle.",
            "diagram": {
                "canvasMode": "hybrid",
                "shapes": [
                    {"id": "rect1", "kind": "rectangle", "x": 120, "y": 80, "width": 320, "height": 160}
                ],
            },
            "scratchpad": {"enabled": True, "tools": ["pencil"]},
            "answerInput": {"type": "number", "label": "Area"},
            "capture": {"finalAnswer": True, "inkStrokes": True},
            "accessibility": {
                "altText": "A rectangle labeled 8 cm by 4 cm.",
                "reduceMotionSafe": True,
                "keyboardAlternative": True,
            },
        },
    }


class TestSurfaceDirectives:
    def test_valid_geometry_directive_passes(self):
        issues = validate_directive(_valid_geometry_directive())
        assert issues == []

    def test_missing_alt_text_rejected(self):
        d = _valid_geometry_directive()
        d["surface"]["accessibility"] = {}
        issues = validate_directive(d)
        codes = [i.code for i in issues]
        assert "missing_alt_text" in codes

    def test_geometry_missing_shapes_rejected(self):
        d = _valid_geometry_directive()
        d["surface"]["diagram"]["shapes"] = []
        codes = [i.code for i in validate_directive(d)]
        assert "geometry_missing_shapes" in codes

    def test_raw_svg_rejected(self):
        d = _valid_geometry_directive()
        d["surface"]["prompt"] = "<svg><rect/></svg>"
        codes = [i.code for i in validate_directive(d)]
        assert "raw_html_or_svg" in codes

    def test_raw_html_rejected(self):
        d = _valid_geometry_directive()
        d["surface"]["prompt"] = "<div>Hello</div>"
        codes = [i.code for i in validate_directive(d)]
        assert "raw_html_or_svg" in codes

    def test_non_verbal_speech_response_rejected(self):
        d = _valid_geometry_directive()
        d["type"] = "collect_voice_or_choice"
        d["expectedLearnerAction"] = "Speak the answer aloud"
        codes = [i.code for i in validate_directive(d, functioning_level="NON_VERBAL")]
        assert "requires_speech_from_non_verbal" in codes

    def test_low_verbal_long_typed_rejected(self):
        d = _valid_geometry_directive()
        d["surface"]["answerInput"] = {"type": "long_text"}
        codes = [i.code for i in validate_directive(d, functioning_level="LOW_VERBAL")]
        assert "requires_long_typed_for_low_verbal_or_pre_symbolic" in codes

    def test_unsupported_directive_type_rejected(self):
        d = _valid_geometry_directive()
        d["type"] = "bogus_directive_type"
        codes = [i.code for i in validate_directive(d)]
        assert "unsupported_directive_type" in codes

    def test_validate_directives_drops_invalid_keeps_valid(self):
        good = _valid_geometry_directive()
        bad = {"id": "bad", "type": "show_geometry", "surface": {"type": "geometry_workspace", "accessibility": {"altText": "x"}, "diagram": {"shapes": []}}}
        kept, issues = validate_directives([good, bad])
        assert len(kept) == 1
        assert any(i.code == "geometry_missing_shapes" for i in issues)

    def test_surface_tool_protocol_text(self):
        assert "Surface Tool Protocol" in SURFACE_TOOL_PROTOCOL
        assert "geometry_workspace" in SURFACE_TOOL_PROTOCOL
        assert "raw SVG" in SURFACE_TOOL_PROTOCOL or "raw SVG or HTML" in SURFACE_TOOL_PROTOCOL
