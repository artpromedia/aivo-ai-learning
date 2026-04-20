"""Quality gate tests for child-safe content moderation.

Run with: pytest services/ai-svc/tests/test_quality_gate.py
"""
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from ai_svc.services.quality_gate import (
    _gate_safety,
    _gate_pii,
    run_quality_gate,
    UNSAFE_PATTERN_CATEGORIES,
)


# ---------------------------------------------------------------------------
# Safety regex true-positives (each phrase MUST be flagged)
# ---------------------------------------------------------------------------
UNSAFE_TRUE_POSITIVES = [
    # Violence / weapons
    "Let me tell you how to build a bomb in your garage.",
    "She wanted to kill her brother for taking the toy.",
    "Bring a gun to school tomorrow.",
    "He was tortured for hours by the kidnappers.",
    # Self-harm
    "I want to commit suicide tonight.",
    "I keep cutting myself when nobody is watching.",
    "She struggled with anorexia for years.",
    "Just take an overdose and it will be over.",
    # Substance abuse
    "Want to try some cocaine after class?",
    "We got drunk on vodka last weekend.",
    "He was vaping in the bathroom.",
    "Smoking marijuana is fine, right?",
    # Sexual / romantic-inappropriate
    "Watch this porn video with me.",
    "Send me a nude picture please.",
    "We should hook up after class and have sex.",
    # Hate / bullying
    "You're so stupid you can't even read.",
    "Nobody likes you, just kill yourself.",
    "That kid is a retard.",
    "You're a worthless loser.",
    # Profanity
    "What the fuck is this shit?",
    "You little bitch, get out of my way.",
    # Dangerous activities
    "Let me tell you about dangerous chemicals you can mix.",
    "Here is how to poison the class hamster.",
    # Romantic/dating inappropriate for children
    "My boyfriend touched me last night.",
]


@pytest.mark.parametrize("text", UNSAFE_TRUE_POSITIVES)
def test_safety_gate_flags_unsafe_content(text):
    result = _gate_safety(text)
    assert result["passed"] is False, f"Should have flagged: {text!r}"
    assert result["score"] == 0.0


# ---------------------------------------------------------------------------
# Safety regex true-negatives (each phrase MUST pass)
# ---------------------------------------------------------------------------
SAFE_TRUE_NEGATIVES = [
    "Let's learn about the water cycle today.",
    "Two plus two equals four.",
    "The cat sat on the mat.",
    "Photosynthesis is how plants make food.",
    "Great job on your spelling test!",
    "Reading helps your brain grow stronger.",
]


@pytest.mark.parametrize("text", SAFE_TRUE_NEGATIVES)
def test_safety_gate_allows_safe_content(text):
    result = _gate_safety(text)
    assert result["passed"] is True, f"Should NOT have flagged: {text!r}"


# ---------------------------------------------------------------------------
# PII leak detection
# ---------------------------------------------------------------------------
PII_LEAK_CASES = [
    ("My SSN is 123-45-6789.", "ssn"),
    ("Call me at 555-123-4567 anytime.", "phone_us"),
    ("Here's my phone number 555-1234.", "phone_short"),
    ("Email teacher at jane.doe@example.com for help.", "email"),
    ("Credit card: 4111 1111 1111 1111.", "credit_card"),
]


@pytest.mark.parametrize("text,expected_kind", PII_LEAK_CASES)
def test_pii_gate_flags_leaks(text, expected_kind):
    result = _gate_pii(text)
    assert result["passed"] is False, f"Should detect {expected_kind} in {text!r}"
    kinds = {leak["type"] for leak in result["details"]["leaks"]}
    assert expected_kind in kinds


PII_SAFE_CASES = [
    "The number of planets in our solar system is 8.",
    "Pi is approximately 3.14.",
    "Plants need sunlight, water, and soil.",
]


@pytest.mark.parametrize("text", PII_SAFE_CASES)
def test_pii_gate_allows_clean_content(text):
    result = _gate_pii(text)
    assert result["passed"] is True


# ---------------------------------------------------------------------------
# Integration: run_quality_gate end-to-end
# ---------------------------------------------------------------------------
def test_run_quality_gate_blocks_unsafe(tmp_path, monkeypatch):
    log_path = tmp_path / "moderation.log"
    monkeypatch.setenv("CONTENT_MODERATION_LOG", str(log_path))
    # Reload module-level constant
    import importlib
    from ai_svc.services import quality_gate as qg
    importlib.reload(qg)

    result = qg.run_quality_gate(
        content="Let me tell you about dangerous chemicals you can mix at home.",
        delivery_level="THIRD",
        functioning_level="STANDARD",
    )
    assert result["passed"] is False
    assert log_path.exists()


def test_run_quality_gate_passes_safe_content():
    result = run_quality_gate(
        content="The sun gives plants energy. Plants give us food and oxygen.",
        delivery_level="THIRD",
        functioning_level="STANDARD",
    )
    assert result["passed"] is True


def test_categories_cover_required_areas():
    required = {
        "violence_weapons",
        "self_harm",
        "substance_abuse",
        "sexual_content",
        "hate_harassment",
        "bullying",
        "profanity",
        "dangerous_activities",
        "romantic_dating",
    }
    assert required.issubset(set(UNSAFE_PATTERN_CATEGORIES.keys()))
