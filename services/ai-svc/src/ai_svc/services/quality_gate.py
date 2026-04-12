import json
import re
import logging

logger = logging.getLogger("ai-svc.quality_gate")

UNSAFE_PATTERNS = [
    r"(?i)\b(kill|murder|suicide|self.harm|weapon|gun|bomb|drug)\b",
    r"(?i)\b(sex|nude|porn|xxx)\b",
    r"(?i)\b(racist|slur|hate)\b",
]

READABILITY_GRADE_MAP = {
    "PRE_K": 0,
    "KINDERGARTEN": 1,
    "FIRST": 2,
    "SECOND": 3,
    "THIRD": 4,
    "FOURTH": 5,
    "FIFTH": 6,
    "SIXTH_PLUS": 7,
}


def run_quality_gate(
    content: str,
    delivery_level: str,
    functioning_level: str,
    sensory_profile: dict | None = None,
    accommodations: list[str] | None = None,
) -> dict:
    gates = []

    safety_result = _gate_safety(content)
    gates.append(safety_result)

    readability_result = _gate_readability(content, delivery_level)
    gates.append(readability_result)

    compliance_result = _gate_compliance(content, functioning_level, sensory_profile, accommodations)
    gates.append(compliance_result)

    passed = all(g["passed"] for g in gates)
    score = sum(g["score"] for g in gates) / len(gates)

    return {
        "passed": passed,
        "score": round(score, 2),
        "gates": gates,
    }


def _gate_safety(content: str) -> dict:
    violations = []
    for pattern in UNSAFE_PATTERNS:
        matches = re.findall(pattern, content)
        if matches:
            violations.extend(matches)

    passed = len(violations) == 0
    return {
        "gate": "safety",
        "passed": passed,
        "score": 1.0 if passed else 0.0,
        "details": {"violations": violations} if violations else {},
    }


def _gate_readability(content: str, delivery_level: str) -> dict:
    words = content.split()
    word_count = len(words)
    sentences = re.split(r"[.!?]+", content)
    sentence_count = max(len([s for s in sentences if s.strip()]), 1)

    avg_words_per_sentence = word_count / sentence_count
    avg_word_length = sum(len(w) for w in words) / max(word_count, 1)

    target_grade = READABILITY_GRADE_MAP.get(delivery_level, 4)

    if target_grade <= 2:
        max_avg_words = 8
        max_avg_word_length = 5
    elif target_grade <= 4:
        max_avg_words = 12
        max_avg_word_length = 6
    else:
        max_avg_words = 18
        max_avg_word_length = 7

    word_score = min(1.0, max_avg_words / max(avg_words_per_sentence, 1))
    length_score = min(1.0, max_avg_word_length / max(avg_word_length, 1))
    score = (word_score + length_score) / 2

    return {
        "gate": "readability",
        "passed": score >= 0.5,
        "score": round(score, 2),
        "details": {
            "avg_words_per_sentence": round(avg_words_per_sentence, 1),
            "avg_word_length": round(avg_word_length, 1),
            "target_grade": target_grade,
        },
    }


def _gate_compliance(
    content: str,
    functioning_level: str,
    sensory_profile: dict | None,
    accommodations: list[str] | None,
) -> dict:
    issues = []

    if functioning_level in ("LOW_VERBAL", "NON_VERBAL", "PRE_SYMBOLIC"):
        if len(content) > 2000:
            issues.append("Content too long for low-functioning level")
        sentences = re.split(r"[.!?]+", content)
        long_sentences = [s for s in sentences if len(s.split()) > 10]
        if len(long_sentences) > 3:
            issues.append("Too many long sentences for this functioning level")

    if sensory_profile:
        visual = sensory_profile.get("visual", "typical")
        if visual == "hyper":
            exclamation_count = content.count("!")
            if exclamation_count > 3:
                issues.append("Too many exclamation marks for visual hyper-sensitivity")

    passed = len(issues) == 0
    return {
        "gate": "compliance",
        "passed": passed,
        "score": 1.0 if passed else max(0.3, 1.0 - len(issues) * 0.2),
        "details": {"issues": issues} if issues else {},
    }
