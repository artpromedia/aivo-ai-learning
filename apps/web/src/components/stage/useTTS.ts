"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SensoryAdaptations } from "./types";

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

export function useTTS(tutorKey: string, adaptations: SensoryAdaptations) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicePrefs = TUTOR_VOICE_PREFS[tutorKey] || TUTOR_VOICE_PREFS.nova;

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

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")
      ) || voices.find((v) => v.lang.startsWith("en"));
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
