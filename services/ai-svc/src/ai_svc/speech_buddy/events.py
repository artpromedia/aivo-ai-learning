"""Event emission helpers for Speech Buddy.

Delegates `safety.flag.raised`, `session.started`, `session.ended`,
`turn.recorded`, and `skill.evidence` to:

  - Structured logger (always)
  - comms-svc internal/speech-buddy-safety (hard flags only)

The wire format mirrors the TS types in ``packages/events/src/index.ts``.
Event ids are normalized via the constants in that package; we duplicate
the strings here so this module stays import-safe in pytest with no JS
dependencies.
"""
from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from .types import AgeBand, SafetyFlag

logger = logging.getLogger("ai-svc.speech_buddy.events")

# Mirror of @aivo/events EVENTS for Speech Buddy.
EVT_SESSION_STARTED   = "speech_buddy.session.started"
EVT_SESSION_ENDED     = "speech_buddy.session.ended"
EVT_TURN_RECORDED     = "speech_buddy.turn.recorded"
EVT_SKILL_EVIDENCE    = "speech_buddy.skill.evidence"
EVT_SAFETY_FLAG       = "speech_buddy.safety.flag.raised"
EVT_QUEST_ASSIGNED    = "speech_buddy.quest.assigned"


def hash_learner_id(learner_id: str) -> str:
    """Stable, irreversible hash for use in events/logs."""
    return hashlib.sha256(("aivo-spbuddy:" + learner_id).encode("utf-8")).hexdigest()[:32]


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class EventEmitter:
    """Tiny event emitter that logs and (for safety hard flags) pages comms-svc."""

    def __init__(
        self,
        *,
        comms_url: str | None = None,
        http_client: httpx.AsyncClient | None = None,
        internal_key: str | None = None,
        guardian_email_resolver=None,
    ) -> None:
        self._comms_url = comms_url or os.environ.get("COMMS_SVC_URL", "http://localhost:3009")
        self._http = http_client
        self._internal_key = internal_key or os.environ.get(
            "INTERNAL_SERVICE_KEY", "aivo-internal-dev-key"
        )
        # Optional async fn(learner_id) -> guardian email. If absent we send
        # an admin alert instead of a parent email; comms-svc will route.
        self._resolve_guardian = guardian_email_resolver
        self.emitted: list[tuple[str, dict[str, Any]]] = []

    def _emit(self, event_type: str, payload: dict[str, Any]) -> None:
        record = {
            "type": event_type,
            "timestamp": _iso_now(),
            "payload": payload,
        }
        self.emitted.append((event_type, payload))
        logger.info("speech_buddy.event", extra={"event": event_type, "payload": payload})
        # In production this would publish to the event bus; for now the
        # structured log line is the bus, consumed by tail+forward agents.

    # -- public emitters ------------------------------------------------------

    def session_started(self, *, session_id: str, age_band: AgeBand, locale: str, targeted_skills: tuple[str, ...]) -> None:
        self._emit(EVT_SESSION_STARTED, {
            "sessionId": session_id,
            "ageBand": age_band,
            "locale": locale,
            "targetedSkills": list(targeted_skills),
        })

    def session_ended(self, *, session_id: str, duration_seconds: int, turn_count: int, skill_evidence_totals: dict[str, float], quest_assigned: Optional[str], ended_reason: str) -> None:
        self._emit(EVT_SESSION_ENDED, {
            "sessionId": session_id,
            "durationSeconds": duration_seconds,
            "turnCount": turn_count,
            "skillEvidenceTotals": skill_evidence_totals,
            "questAssigned": quest_assigned,
            "endedReason": ended_reason,
        })

    def turn_recorded(self, *, session_id: str, turn_index: int, correlation_id: str, speaker: str, safety_flag_count: int) -> None:
        self._emit(EVT_TURN_RECORDED, {
            "sessionId": session_id,
            "turnIndex": turn_index,
            "correlationId": correlation_id,
            "speaker": speaker,
            "safetyFlagCount": safety_flag_count,
        })

    def skill_evidence(self, *, session_id: str, learner_id_hash: str, age_band: AgeBand, skill: str, weight: float) -> None:
        self._emit(EVT_SKILL_EVIDENCE, {
            "sessionId": session_id,
            "learnerId": learner_id_hash,
            "ageBand": age_band,
            "skill": skill,
            "weight": weight,
        })

    def quest_assigned(self, *, session_id: str, quest: str, skill: str) -> None:
        self._emit(EVT_QUEST_ASSIGNED, {
            "sessionId": session_id,
            "quest": quest,
            "skill": skill,
        })

    async def safety_flag(
        self,
        *,
        flag: SafetyFlag,
        session_id: str,
        age_band: AgeBand,
        learner_id_hash: str,
        guardian_email: Optional[str] = None,
    ) -> None:
        payload = {
            "sessionId": session_id,
            "correlationId": flag.correlation_id,
            "category": flag.category,
            "severity": flag.severity,
            "ageBand": age_band,
        }
        self._emit(EVT_SAFETY_FLAG, payload)
        if flag.severity != "hard" or self._http is None:
            return
        # Page comms-svc — guardian-channel notification, NO transcript text.
        url = f"{self._comms_url.rstrip('/')}/api/comms/internal/speech-buddy-safety"
        body = {
            "to": guardian_email,
            "learnerIdHash": learner_id_hash,
            "category": flag.category,
            "severity": flag.severity,
            "correlationId": flag.correlation_id,
            "ageBand": age_band,
            "raisedAt": flag.raised_at,
        }
        try:
            await self._http.post(
                url,
                json=body,
                headers={"x-internal-key": self._internal_key},
                timeout=2.0,
            )
        except Exception:
            logger.exception("speech_buddy.safety.comms_dispatch_failed")


__all__ = [
    "EVT_QUEST_ASSIGNED",
    "EVT_SAFETY_FLAG",
    "EVT_SESSION_ENDED",
    "EVT_SESSION_STARTED",
    "EVT_SKILL_EVIDENCE",
    "EVT_TURN_RECORDED",
    "EventEmitter",
    "hash_learner_id",
]
