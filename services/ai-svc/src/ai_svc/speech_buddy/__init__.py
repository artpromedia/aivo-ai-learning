"""Speech Buddy agent orchestrator (interface-only scaffold).

The bodies are implemented by the agent-core task
(Speech Buddy agent core: STT, planner, dialogue, TTS, safety filter).
This package exists so other tasks can import a stable surface today.

See:
    docs/products/speech-buddy/README.md  (session format, SEL skill map)
    docs/products/speech-buddy/safety.md  (safety policy)
    docs/products/speech-buddy/threat-model.md
"""

from .types import (
    AGE_BANDS,
    SAFETY_FLAG_CATEGORIES,
    SKILL_TAGS,
    AgeBand,
    SafetyFlag,
    SafetyFlagCategory,
    SafetyFlagSeverity,
    SkillTag,
    SpeechBuddySession,
    SpeechBuddyState,
    TurnEvent,
)
from .orchestrator import (
    SPEECH_BUDDY_STATES,
    SpeechBuddyOrchestrator,
)
from .tools import (
    SpeechBuddyToolset,
)

__all__ = [
    "AGE_BANDS",
    "SAFETY_FLAG_CATEGORIES",
    "SKILL_TAGS",
    "SPEECH_BUDDY_STATES",
    "AgeBand",
    "SafetyFlag",
    "SafetyFlagCategory",
    "SafetyFlagSeverity",
    "SkillTag",
    "SpeechBuddyOrchestrator",
    "SpeechBuddySession",
    "SpeechBuddyState",
    "SpeechBuddyToolset",
    "TurnEvent",
]
