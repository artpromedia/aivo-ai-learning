"""Locale-aware baseline + discovery prompt tests.

The tutor chat already pins response language via prompt_builder. The
*baseline assessment* and *discovery adventure* generators must do the
same, otherwise question text and tutor narration are produced in
English even when the learner's UI locale is not English.

These tests lock in:
  * Default (no locale) yields English directive.
  * Each supported locale yields its expected language name.
  * Region tags ("es-MX", "fr_CA") normalise to base language.
  * Unknown locales fall back to English (no exception, no broken text).

Run with: pytest services/ai-svc/tests/test_baseline_locale_prompt.py -v
"""
import pytest

from ai_svc.services.baseline_generator import (
    build_baseline_generation_prompt,
    build_discovery_adventure_prompt,
)


PARENT = {
    "communicationMode": "verbal",
    "deviceInteraction": "independent",
    "functioningLevel": "STANDARD",
    "attentionSpan": "typical",
    "diagnoses": [],
    "responses": {"pref-1": ["soccer"]},
}

CHAPTER = {
    "title": "Word Garden",
    "domain": "ela",
    "sceneDescription": "...",
    "tutorKey": "sage",
}


class TestBaselineLocale:
    def test_default_locale_is_english(self):
        sys, _ = build_baseline_generation_prompt(PARENT)
        assert "## Response Language" in sys
        assert "English" in sys

    def test_explicit_english_locale(self):
        sys, _ = build_baseline_generation_prompt(PARENT, locale="en")
        assert "## Response Language" in sys
        assert "Respond entirely in English" in sys

    @pytest.mark.parametrize(
        "locale,language",
        [
            ("es", "Spanish"),
            ("fr", "French"),
            ("de", "German"),
            ("pt", "Portuguese"),
            ("zh", "Chinese (Simplified)"),
            ("ja", "Japanese"),
            ("ko", "Korean"),
            ("ar", "Arabic"),
            ("hi", "Hindi"),
        ],
    )
    def test_supported_locales_pin_language(self, locale, language):
        sys, _ = build_baseline_generation_prompt(PARENT, locale=locale)
        assert "## Response Language" in sys
        assert f"Respond entirely in {language}" in sys

    def test_region_tag_normalises_to_base(self):
        sys, _ = build_baseline_generation_prompt(PARENT, locale="es-MX")
        assert "Respond entirely in Spanish" in sys

    def test_underscore_region_tag_normalises(self):
        sys, _ = build_baseline_generation_prompt(PARENT, locale="fr_CA")
        assert "Respond entirely in French" in sys

    def test_unknown_locale_falls_back_to_english(self):
        sys, _ = build_baseline_generation_prompt(PARENT, locale="xx")
        assert "Respond entirely in English" in sys


class TestDiscoveryLocale:
    def test_default_locale_is_english(self):
        sys, _ = build_discovery_adventure_prompt(PARENT, CHAPTER)
        assert "## Response Language" in sys
        assert "Respond entirely in English" in sys

    @pytest.mark.parametrize(
        "locale,language",
        [
            ("es", "Spanish"),
            ("zh", "Chinese (Simplified)"),
            ("ar", "Arabic"),
            ("hi", "Hindi"),
        ],
    )
    def test_locale_pins_language(self, locale, language):
        sys, _ = build_discovery_adventure_prompt(PARENT, CHAPTER, locale=locale)
        assert f"Respond entirely in {language}" in sys

    def test_non_english_adds_translate_glossary_guidance(self):
        # The directive reinforces glossing subject vocabulary so e.g.
        # "fraction" surfaces alongside the localised word — important for
        # baseline ELA/math/science questions.
        sys, _ = build_discovery_adventure_prompt(PARENT, CHAPTER, locale="es")
        assert "Translate or gloss subject-specific vocabulary" in sys

    def test_english_does_not_add_translation_guidance(self):
        sys, _ = build_discovery_adventure_prompt(PARENT, CHAPTER, locale="en")
        assert "Translate or gloss subject-specific vocabulary" not in sys


class TestSchemaStabilityGuidance:
    """The localised baseline / discovery prompts MUST keep enum-valued
    JSON fields (subject, interaction, difficulty, ids) in English even
    when the response language is non-English — otherwise the strict
    server-side validators in `routes/generate.py` reject the result and
    the caller sees a 502.

    These tests pin the user-facing prompt language so the LLM is never
    silently allowed to localise (e.g.) "math" → "matemáticas" and break
    `REQUIRED_SUBJECTS` validation.
    """

    def test_baseline_user_prompt_pins_subject_enum(self):
        _, user = build_baseline_generation_prompt(PARENT, locale="es")
        assert "subject" in user
        assert "math" in user and "ela" in user and "executive_function" in user
        # Schema-stability guidance must be present in non-English mode.
        assert "non-English" in user or "do not translate" in user.lower()

    def test_baseline_user_prompt_pins_id_prefixes(self):
        _, user = build_baseline_generation_prompt(PARENT, locale="es")
        for prefix in ("m1", "e1", "s1", "sp1", "sel1", "ls1", "ef1"):
            assert prefix in user

    def test_baseline_user_prompt_allows_label_translation(self):
        _, user = build_baseline_generation_prompt(PARENT, locale="es")
        # questionText and label are listed as the translatable fields
        assert "questionText" in user and "label" in user

    def test_discovery_user_prompt_pins_interaction_enum(self):
        _, user = build_discovery_adventure_prompt(PARENT, CHAPTER, locale="es")
        for v in ("tap_image", "tap_word", "drag_sort", "sequence", "memory"):
            assert v in user

    def test_discovery_user_prompt_pins_difficulty_enum(self):
        _, user = build_discovery_adventure_prompt(PARENT, CHAPTER, locale="es")
        assert '"easy"' in user and '"medium"' in user and '"hard"' in user

    def test_schema_guidance_present_for_default_locale_too(self):
        # Defensive: even when the LLM is responding in English we want
        # the same schema discipline so the validators stay strict.
        _, user = build_baseline_generation_prompt(PARENT)
        assert "non-English" in user or "do not translate" in user.lower()


SPEECH_CHAPTER = {
    "id": "echo_sound_studio",
    "title": "Echo's Sound Studio",
    "domain": "speech",
    "sceneDescription": "A friendly recording studio.",
    "tutorKey": "echo",
}


class TestVoiceResponseInteraction:
    """`voice_response` is an STT-driven activity type that gates on both
    chapter domain (`speech`) and functioning level. It must NOT be
    advertised to the LLM for non-speech chapters or for learners with
    NON_VERBAL / LOW_VERBAL profiles, otherwise we'd ask the kid to
    speak when they can't reliably produce verbal output.
    """

    def _user_prompt(self, chapter, functioning_level="STANDARD"):
        parent = {**PARENT, "functioningLevel": functioning_level}
        _, user = build_discovery_adventure_prompt(parent, chapter)
        return user

    def test_voice_response_offered_for_speech_chapter_standard(self):
        user = self._user_prompt(SPEECH_CHAPTER)
        assert "voice_response" in user
        assert "correctAnswer" in user
        assert "acceptedAnswers" in user

    def test_voice_response_offered_for_speech_chapter_supported(self):
        user = self._user_prompt(SPEECH_CHAPTER, functioning_level="SUPPORTED")
        assert "voice_response" in user

    def test_voice_response_NOT_offered_for_low_verbal(self):
        user = self._user_prompt(SPEECH_CHAPTER, functioning_level="LOW_VERBAL")
        assert "voice_response" not in user

    def test_voice_response_NOT_offered_for_non_verbal(self):
        user = self._user_prompt(SPEECH_CHAPTER, functioning_level="NON_VERBAL")
        assert "voice_response" not in user

    def test_voice_response_NOT_offered_for_non_speech_chapter(self):
        # The default ELA/CHAPTER fixture used elsewhere.
        user = self._user_prompt(CHAPTER)
        assert "voice_response" not in user

    def test_voice_response_in_enum_pinning_when_enabled(self):
        # The schema-stability block lists `voice_response` so the LLM
        # keeps the enum in English when responding in another language.
        parent = {**PARENT, "functioningLevel": "STANDARD"}
        _, user = build_discovery_adventure_prompt(parent, SPEECH_CHAPTER, locale="es")
        # Both the interaction-list block AND the enum-pinning block
        # must mention voice_response so non-English responses don't
        # localise the value (e.g. "respuesta_de_voz").
        assert user.count("voice_response") >= 2

    def test_voice_response_correctAnswer_language_guidance(self):
        # When responding in a non-English language, correctAnswer/
        # acceptedAnswers MUST be in that language (it's what the
        # learner actually speaks). The prompt must state this.
        parent = {**PARENT, "functioningLevel": "STANDARD"}
        _, user = build_discovery_adventure_prompt(parent, SPEECH_CHAPTER, locale="es")
        assert "correctAnswer" in user
        # Look for the explicit guidance line.
        assert "same language as" in user
