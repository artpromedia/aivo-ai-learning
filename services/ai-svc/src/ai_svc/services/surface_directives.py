"""Tutor-to-surface directive contract + validator.

The tutor (chat / homework / lesson generator) may emit a structured
`surfaceDirectives` array alongside its narrative response. Each entry
asks the frontend to render a `LearnerSurfaceSpec` (geometry workspace,
scratchpad, manipulative, reading annotation, etc.) instead of describing
the diagram in raw text.

This module enforces the contract before AI output reaches the
frontend. Malformed directives must be rejected — never rendered as raw
HTML/SVG — so the validator returns a structured list of issues
callers can log or surface to the learner as a recoverable error.
"""
from __future__ import annotations

import re
from typing import Any

from .surface_schema import KNOWN_INTERACTIONS, SURFACE_REQUIRED

DIRECTIVE_TYPES: frozenset[str] = frozenset(
    {
        "open_scratchpad",
        "show_geometry",
        "show_number_line",
        "show_graph",
        "show_manipulative",
        "show_reading_annotation",
        "show_science_diagram",
        "collect_answer",
        "collect_drawing",
        "collect_voice_or_choice",
    }
)

_HTML_TAG_RE = re.compile(r"<\s*[a-z!][^>]*>", re.IGNORECASE)
_SCRIPT_RE = re.compile(r"<\s*script\b", re.IGNORECASE)
_SVG_RE = re.compile(r"<\s*svg\b", re.IGNORECASE)


class DirectiveIssue:
    __slots__ = ("code", "detail")

    def __init__(self, code: str, detail: str) -> None:
        self.code = code
        self.detail = detail

    def to_dict(self) -> dict[str, str]:
        return {"code": self.code, "detail": self.detail}


def _contains_unsafe_markup(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    return bool(_SCRIPT_RE.search(value) or _SVG_RE.search(value) or _HTML_TAG_RE.search(value))


def _walk_strings(node: Any):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from _walk_strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from _walk_strings(v)


def _functioning_level_violates(directive: dict, functioning_level: str | None) -> list[DirectiveIssue]:
    issues: list[DirectiveIssue] = []
    if not functioning_level:
        return issues
    surface = directive.get("surface") or {}
    answer_input = surface.get("answerInput") or {}
    expected_action = (directive.get("expectedLearnerAction") or "").lower()
    answer_type = (answer_input.get("type") or "").lower()

    if functioning_level == "NON_VERBAL":
        speech_terms = ("speech", "speak", "spoken", "aloud", "say ", "voice ")
        if directive.get("type") == "collect_voice_or_choice" and any(t in expected_action for t in speech_terms):
            issues.append(DirectiveIssue("requires_speech_from_non_verbal", directive.get("id", "")))
        elif any(t in expected_action for t in speech_terms):
            issues.append(DirectiveIssue("requires_speech_from_non_verbal", directive.get("id", "")))
        if answer_type in ("voice", "speech"):
            issues.append(DirectiveIssue("requires_speech_from_non_verbal", directive.get("id", "")))
    if functioning_level in ("LOW_VERBAL", "PRE_SYMBOLIC"):
        if answer_type in ("long_text", "essay"):
            issues.append(
                DirectiveIssue(
                    "requires_long_typed_for_low_verbal_or_pre_symbolic",
                    directive.get("id", ""),
                )
            )
    return issues


def validate_directive(directive: Any, *, functioning_level: str | None = None) -> list[DirectiveIssue]:
    """Validate a single tutor surface directive."""
    issues: list[DirectiveIssue] = []
    if not isinstance(directive, dict):
        return [DirectiveIssue("not_object", "directive")]

    if not directive.get("id"):
        issues.append(DirectiveIssue("missing_id", "directive"))
    dtype = directive.get("type")
    if dtype not in DIRECTIVE_TYPES:
        issues.append(DirectiveIssue("unsupported_directive_type", str(dtype)))

    surface = directive.get("surface")
    if not isinstance(surface, dict):
        issues.append(DirectiveIssue("missing_surface", directive.get("id", "")))
        return issues

    surface_id = directive.get("surfaceId") or surface.get("id")
    if not surface_id:
        issues.append(DirectiveIssue("missing_surface_id", directive.get("id", "")))

    stype = surface.get("type")
    if stype and stype not in KNOWN_INTERACTIONS:
        issues.append(DirectiveIssue("unsupported_surface_type", str(stype)))

    if stype == "geometry_workspace":
        shapes = (surface.get("diagram") or {}).get("shapes")
        if not isinstance(shapes, list) or not shapes:
            issues.append(DirectiveIssue("geometry_missing_shapes", surface_id or ""))

    if stype in SURFACE_REQUIRED and stype not in ("draw", "math_expression"):
        scratch = surface.get("scratchpad")
        # Scratchpad-required tasks (computation-heavy) must enable the
        # scratchpad and capture ink — otherwise the learner's work
        # is invisible to the tutor.
        if stype == "scratchpad" and not (scratch and scratch.get("enabled")):
            issues.append(DirectiveIssue("scratchpad_disabled", surface_id or ""))

    accessibility = surface.get("accessibility") or {}
    if not accessibility.get("altText"):
        issues.append(DirectiveIssue("missing_alt_text", surface_id or ""))

    # Reject any raw HTML / SVG / script inside the surface payload.
    for s in _walk_strings(surface):
        if _contains_unsafe_markup(s):
            issues.append(DirectiveIssue("raw_html_or_svg", surface_id or ""))
            break

    issues.extend(_functioning_level_violates(directive, functioning_level))
    return issues


def validate_directives(
    directives: Any, *, functioning_level: str | None = None
) -> tuple[list[dict], list[DirectiveIssue]]:
    """Validate a list of directives. Returns `(valid_directives, issues)`.

    Invalid directives are dropped from the returned list so they cannot
    reach the frontend, but every issue is preserved for logging.
    """
    if not isinstance(directives, list):
        return [], [DirectiveIssue("not_array", "surfaceDirectives")]

    kept: list[dict] = []
    all_issues: list[DirectiveIssue] = []
    for d in directives:
        d_issues = validate_directive(d, functioning_level=functioning_level)
        if d_issues:
            all_issues.extend(d_issues)
        else:
            kept.append(d)
    return kept, all_issues


SURFACE_TOOL_PROTOCOL = (
    "\n## Surface Tool Protocol\n"
    "When a learner would benefit from a visual, manipulative, scratchpad, "
    "diagram, graph, or annotation surface, return a structured "
    "`surfaceDirectives` array. Do not describe a diagram in text when the "
    "UI can render one. Use structured geometry JSON, never raw SVG or HTML. "
    "Always include accessibility alt text. Always select surfaces based on "
    "learner profile, subject, and task.\n"
    "- Geometry requires geometry_workspace.\n"
    "- Computation requiring work requires scratchpad.\n"
    "- Fractions may use manipulatives, area models, number lines, or scratchpad.\n"
    "- Reading comprehension may use reading_annotation.\n"
    "- Science systems may use science_diagram or classification manipulatives.\n"
    "- Coding may use trace table or step workspace.\n"
    "- LOW_VERBAL learners should receive visual/choice/touch surfaces before text-heavy explanations.\n"
    "- NON_VERBAL learners should receive non-speech response surfaces.\n"
    "- PRE_SYMBOLIC learners should receive cause-effect, matching, imitation, "
    "object-choice, or parent-mediated surfaces."
)
