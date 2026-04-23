"""Golden-path + safety + privacy tests for DefaultOrchestrator.

Covers:
  * recess scenario, 3-turn happy path, skill-evidence persisted
  * crisis-script firing on self-harm input ends the session and pages
    a guardian email through the EventEmitter (mocked)
  * raw audio bytes are never written into transcript_lines / events /
    encrypted transcript ciphertext
  * end_session emits encrypted transcript that decrypts back to source
"""
from __future__ import annotations

import asyncio

import pytest

from ai_svc.speech_buddy import (
    DefaultOrchestrator,
    DefaultToolset,
    EventEmitter,
    MockSTT,
    MockTTS,
    SafetyFilter,
    decrypt_transcript,
)
from ai_svc.speech_buddy.encryption import EncryptedTranscript


def _orch() -> DefaultOrchestrator:
    return DefaultOrchestrator(
        stt=MockSTT(),
        tts=MockTTS(),
        toolset=DefaultToolset(),
        emitter=EventEmitter(),  # http_client=None → no comms-svc dispatch
        safety=SafetyFilter(),
    )


def _run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


def test_golden_path_three_turn_recess():
    async def go():
        orchestrator = _orch()
        session = await orchestrator.start_session(
            tenant_id="tenant-1",
            learner_id="learner-1",
            age_band="6-9",
            locale="en",
            consent_record_id="consent-abc",
            targeted_skills=("ask_open_question",),
        )
        assert session.state == "greet"
        out1 = await orchestrator.run_turn(session.id, text="Can I play with you?")
        assert out1.ended is False
        assert out1.next_state == "roleplayTurn"
        assert any(s == "ask_open_question" for s, _ in out1.turn_event.skill_evidence)
        assert len(out1.turn_event.safety_flags) == 0
        assert len(out1.buddy_audio) > 0
        out2 = await orchestrator.run_turn(session.id, text="I felt sad when nobody picked me.")
        assert out2.ended is False
        assert any(s == "name_a_feeling" for s, _ in out2.turn_event.skill_evidence)
        out3 = await orchestrator.run_turn(session.id, text="What kind of game do you like best?")
        assert out3.ended is False
        summary = await orchestrator.end_session(session.id, reason="completed")
        assert summary["turnCount"] == 3
        assert summary["endedReason"] == "completed"
        assert "ask_open_question" in summary["skillEvidenceTotals"]
        assert "name_a_feeling" in summary["skillEvidenceTotals"]
        assert summary["transcriptCiphertext"] is not None
        assert summary["questAssigned"] is not None
    asyncio.new_event_loop().run_until_complete(go())


def test_self_harm_input_triggers_crisis_and_ends():
    async def go():
        orchestrator = _orch()
        session = await orchestrator.start_session(
            tenant_id="tenant-1",
            learner_id="learner-2",
            age_band="10-12",
            locale="en",
            consent_record_id="consent-abc",
        )
        out = await orchestrator.run_turn(session.id, text="I want to hurt myself")
        assert out.ended is True
        assert out.ended_reason == "safety_hard_flag"
        assert out.terminal_flag is not None
        assert out.terminal_flag.category == "self_harm"
        assert out.terminal_flag.severity == "hard"
        from ai_svc.speech_buddy import CRISIS_SCRIPT_EN
        assert out.buddy_text == CRISIS_SCRIPT_EN
        types = [t for t, _ in orchestrator.emitter.emitted]
        assert "speech_buddy.safety.flag.raised" in types
        assert "speech_buddy.session.ended" in types
    asyncio.new_event_loop().run_until_complete(go())


def test_raw_audio_never_persisted():
    async def go():
        orchestrator = _orch()
        session = await orchestrator.start_session(
            tenant_id="tenant-1",
            learner_id="learner-3",
            age_band="6-9",
            locale="en",
            consent_record_id="consent-abc",
        )
        # Use bytes that DO NOT decode as UTF-8 — MockSTT will return "" so the
        # only possible source of these bytes appearing anywhere is a leak.
        audio = b"\xff\xfe\x80\x81\x82\x83\xc0\xc1AUDIO-LEAK-CANARY"
        out = await orchestrator.run_turn(session.id, audio_bytes=audio, mime_type="audio/webm")
        rec = orchestrator._sessions[session.id]
        # Privacy invariant 1: no transcript line carries the audio bytes.
        for line in rec.transcript_lines:
            assert "AUDIO-LEAK-CANARY" not in line
            assert b"\xff\xfe".decode("latin-1") not in line
        # Privacy invariant 2: TurnEvent has no bytes-typed field.
        for f in dir(out.turn_event):
            if f.startswith("_"): continue
            v = getattr(out.turn_event, f, None)
            assert not isinstance(v, (bytes, bytearray)), f"TurnEvent.{f} carried bytes"
        # Privacy invariant 3: Session record has no bytes-typed field either.
        for f in dir(rec.session):
            if f.startswith("_"): continue
            v = getattr(rec.session, f, None)
            assert not isinstance(v, (bytes, bytearray)), f"Session.{f} carried bytes"
        # Privacy invariant 4: encrypted transcript (if any) must not contain
        # the canary bytes (it shouldn't even encrypt undecodable input).
        summary = await orchestrator.end_session(session.id)
        ct = summary["transcriptCiphertext"]["ciphertext"]
        import base64
        raw_ct = base64.b64decode(ct)
        assert b"AUDIO-LEAK-CANARY" not in raw_ct
    asyncio.new_event_loop().run_until_complete(go())


def test_transcript_encryption_roundtrip():
    async def go():
        orchestrator = _orch()
        session = await orchestrator.start_session(
            tenant_id="tenant-roundtrip",
            learner_id="learner-7",
            age_band="13-15",
            locale="en",
            consent_record_id="consent-abc",
        )
        await orchestrator.run_turn(session.id, text="I'm trying to weigh two options about tonight.")
        summary = await orchestrator.end_session(session.id)
        enc_dict = summary["transcriptCiphertext"]
        assert enc_dict is not None
        enc = EncryptedTranscript(
            tenant_id=enc_dict["tenant_id"],
            nonce_b64=enc_dict["nonce"],
            ciphertext_b64=enc_dict["ciphertext"],
            algorithm=enc_dict["algorithm"],
        )
        decrypted = decrypt_transcript(enc)
        assert "child[" in decrypted
        assert "buddy[" in decrypted
    asyncio.new_event_loop().run_until_complete(go())


def test_other_tenants_cannot_decrypt():
    async def go():
        orchestrator = _orch()
        session = await orchestrator.start_session(
            tenant_id="tenant-A",
            learner_id="learner-A",
            age_band="6-9",
            locale="en",
            consent_record_id="consent-abc",
        )
        await orchestrator.run_turn(session.id, text="Hi I felt happy today!")
        summary = await orchestrator.end_session(session.id)
        enc_dict = summary["transcriptCiphertext"]
        enc = EncryptedTranscript(
            tenant_id="tenant-B-malicious",
            nonce_b64=enc_dict["nonce"],
            ciphertext_b64=enc_dict["ciphertext"],
            algorithm=enc_dict["algorithm"],
        )
        with pytest.raises(Exception):
            decrypt_transcript(enc)
    asyncio.new_event_loop().run_until_complete(go())
