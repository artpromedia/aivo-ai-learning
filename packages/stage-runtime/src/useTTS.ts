/**
 * useTTS — React hook wrapping the browser's SpeechSynthesis API with
 * per-tutor voice prefs and adaptation-aware volume.
 *
 * Extracted from apps/web/src/components/stage/useTTS.ts as part of the
 * §8 #2 Stage extraction (v2.1).
 */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SensoryAdaptations } from "@aivo/stage-ui";

const TUTOR_VOICE_PREFS: Record<string, { pitch: number; rate: number; lang: string }> = {
  nova: { pitch: 1.1, rate: 0.95, lang: "en-US" },
  sage: { pitch: 0.95, rate: 0.9, lang: "en-US" },
  spark: { pitch: 1.15, rate: 1.0, lang: "en-US" },
  chrono: { pitch: 0.9, rate: 0.85, lang: "en-US" },
  pixel: { pitch: 1.2, rate: 1.05, lang: "en-US" },
  echo: { pitch: 1.0, rate: 0.8, lang: "en-US" },
  harmony: { pitch: 1.05, rate: 0.9, lang: "en-US" },
  atlas: { pitch: 0.95, rate: 0.9, lang: "en-US" },
  cadence: { pitch: 1.1, rate: 0.95, lang: "en-US" },
  vigor: { pitch: 1.0, rate: 1.0, lang: "en-US" },
  lingua: { pitch: 1.0, rate: 0.85, lang: "en-US" },
  forge: { pitch: 0.9, rate: 0.95, lang: "en-US" },
  compass: { pitch: 0.95, rate: 0.85, lang: "en-US" },
  muse: { pitch: 1.1, rate: 0.9, lang: "en-US" },
};

/**
 * Map a base locale (or full BCP-47 tag) to the BCP-47 voice locale used by
 * the browser SpeechSynthesis API. Covers the locales advertised by the
 * web app's i18n config.
 */
const LOCALE_TO_BCP47: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
  hi: "hi-IN",
};

function resolveVoiceLang(locale: string | undefined, fallback: string): string {
  if (!locale) return fallback;
  const trimmed = locale.trim();
  if (!trimmed) return fallback;
  // Already a BCP-47 tag with region (e.g. "es-MX") — honour as-is.
  if (trimmed.includes("-")) return trimmed;
  const base = trimmed.toLowerCase();
  return LOCALE_TO_BCP47[base] || fallback;
}

export interface UseTTSResult {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
}

export function useTTS(
  tutorKey: string,
  adaptations: SensoryAdaptations,
  locale?: string,
): UseTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Override the tutor's default lang when the learner has selected a
  // non-English UI locale, so the tutor's spoken voice matches the language
  // the LLM is now responding in. `tutorKey` and `locale` are the only
  // inputs that change voice prefs — depend on those directly so the memo
  // doesn't churn on unrelated re-renders.
  const voicePrefs = useMemo(() => {
    const base = TUTOR_VOICE_PREFS[tutorKey] || TUTOR_VOICE_PREFS.nova;
    return { ...base, lang: resolveVoiceLang(locale, base.lang) };
  }, [tutorKey, locale]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = voicePrefs.pitch;
      utterance.rate = voicePrefs.rate;
      utterance.volume = adaptations.volumeLevel;
      utterance.lang = voicePrefs.lang;

      // Prefer a "natural" voice in the requested language, then any voice
      // that matches the language family, then fall back to the browser
      // default. Single pass through the voices list — categorise as we go
      // and pick the highest-priority match at the end.
      const voices = window.speechSynthesis.getVoices();
      const langTag = voicePrefs.lang.toLowerCase();
      const baseLang = langTag.split("-")[0];
      let exactNatural: SpeechSynthesisVoice | undefined;
      let exact: SpeechSynthesisVoice | undefined;
      let baseRegion: SpeechSynthesisVoice | undefined;
      let base: SpeechSynthesisVoice | undefined;
      for (const v of voices) {
        const vLang = v.lang.toLowerCase();
        if (vLang === langTag) {
          if (!exactNatural && v.name.toLowerCase().includes("natural")) {
            exactNatural = v;
            break; // best possible match — stop early
          }
          exact ??= v;
        } else if (vLang.startsWith(baseLang + "-")) {
          baseRegion ??= v;
        } else if (vLang.startsWith(baseLang)) {
          base ??= v;
        }
      }
      const preferred = exactNatural || exact || baseRegion || base;
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [voicePrefs, adaptations.volumeLevel]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
