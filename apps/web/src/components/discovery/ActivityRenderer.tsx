"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Check, Heart, Mic, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { TUTORS } from "@aivo/brand";
import { useTranslations } from "next-intl";
import { useSpeechInput, matchVoiceAnswer, type SpeechInputError } from "@aivo/stage-runtime";
import { useAuth } from "@/providers/auth-provider";
import type { Activity, AdventureChapter, ActivityChoice } from "./types";
import { IconWell, colorForTutor, VI_COLOR, VI_TINT } from "./_vi";
import { playCorrectCue, playIncorrectCue } from "@/lib/audio";
import { useTutorVoice } from "@/lib/useTutorVoice";
import { resolveSpeechLang } from "@/components/stage/useTTS";
import { useLocale } from "@/providers/i18n-provider";
import Mascot from "@/components/Mascot";

// BCP-47 language tags accepted by the Web Speech API for STT. Mirrors
// the table in `components/stage/ResponseZone.tsx` so spoken answers in
// the Discovery flow are recognised in the learner's UI locale.
const STT_LOCALE_MAP: Record<string, string> = {
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

interface ActivityRendererProps {
  activity: Activity;
  chapter: AdventureChapter;
  activityNumber: number;
  totalActivities: number;
  onAnswer: (correct: boolean, latencyMs: number) => void;
  onSkip: () => void;
}

export default function ActivityRenderer({
  activity, chapter, activityNumber, totalActivities, onAnswer,
}: ActivityRendererProps) {
  const [phase, setPhase] = useState<"narrating" | "interacting" | "feedback">("narrating");
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showChoices, setShowChoices] = useState(false);
  const promptStartRef = useRef<number>(Date.now());
  const tutor = TUTORS[chapter.tutorKey];
  const subjectKey = colorForTutor(tutor?.color);
  const subjectColor = VI_COLOR[subjectKey];
  const subjectTint = VI_TINT[subjectKey];
  const { locale } = useLocale();
  const voiceLang = resolveSpeechLang(locale);

  // Speak the narration during the narrating phase, then the tutor line
  // once choices are showing. Mute toggle and reduced-motion fallback live
  // inside the hook so call sites don't repeat the gating. `lang` pins the
  // SpeechSynthesis voice to the learner's selected UI locale so the tutor
  // speaks in the same language the LLM produced the narration in.
  useTutorVoice(phase === "narrating" ? activity.narration : null, { lang: voiceLang });
  useTutorVoice(phase !== "narrating" && showChoices ? activity.tutorLine : null, { lang: voiceLang });

  useEffect(() => {
    setPhase("narrating");
    setSelected(null);
    setIsCorrect(null);
    setShowChoices(false);
    const t1 = setTimeout(() => { setPhase("interacting"); promptStartRef.current = Date.now(); }, 2500);
    const t2 = setTimeout(() => setShowChoices(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activity.id]);

  const handleSelect = (choice: ActivityChoice) => {
    if (selected) return;
    setSelected(choice.id);
    setIsCorrect(choice.isCorrect);
    setPhase("feedback");
    const latency = Date.now() - promptStartRef.current;
    if (choice.isCorrect) playCorrectCue();
    else playIncorrectCue();
    setTimeout(() => onAnswer(choice.isCorrect, latency), 1800);
  };

  // Bridge voice_response answers through the same feedback overlay
  // animation that tap/drag answers use, so a correct spoken answer
  // gets the celebration card and not just a green transcript line.
  // Cues are played by the inner surface so we don't double-trigger.
  const handleVoiceAnswer = (correct: boolean, latencyMs: number) => {
    if (selected) return;
    setSelected("voice");
    setIsCorrect(correct);
    setPhase("feedback");
    setTimeout(() => onAnswer(correct, latencyMs), 1800);
  };

  return (
    <div className="fixed inset-0 vi-bg tier-scene-bg flex flex-col overflow-hidden pt-20">
      <div className="max-w-3xl mx-auto w-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>{chapter.landmark.emoji}</span>
          <span className="text-slate-600 text-xs font-extrabold">{chapter.title}</span>
        </div>
        <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={activityNumber} aria-valuemax={totalActivities}>
          {Array.from({ length: totalActivities }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < activityNumber - 1 ? "w-6 bg-[hsl(262_83%_58%)]"
                  : i === activityNumber - 1 ? "w-8 bg-[hsl(262_83%_58%)]"
                  : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-y-auto py-4">
        {phase === "feedback" && isCorrect !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div
              className="vi-card text-center px-8 py-6"
              style={{
                borderColor: isCorrect ? "hsl(142 71% 45% / 0.3)" : "hsl(43 100% 50% / 0.3)",
                background: isCorrect ? "hsl(142 71% 45% / 0.06)" : "hsl(43 100% 50% / 0.06)",
              }}
            >
              <div className="mx-auto mb-2 inline-flex">
                {isCorrect ? (
                  <Mascot mood="cheer" size={72} label="Great job!" />
                ) : (
                  <IconWell color="sel" size="md">
                    <Heart className="w-7 h-7" strokeWidth={2.5} />
                  </IconWell>
                )}
              </div>
              <p className="text-xl font-extrabold text-slate-900">{isCorrect ? "Amazing!" : "Good try!"}</p>
              <p className="text-sm text-slate-600 mt-1">{isCorrect ? "You got it right!" : "The adventure continues!"}</p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-700 ${phase === "narrating" ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute"}`}>
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto text-center">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 shadow-lg animate-bounce-gentle" style={{ borderColor: subjectColor }}>
              <Image src={tutor.avatar} alt={tutor.name} width={96} height={96} className="object-cover" />
            </div>
            <div className="vi-card px-6 py-4" style={{ background: subjectTint, borderColor: `${subjectColor}26` }}>
              <p className="text-slate-800 text-base leading-relaxed">{activity.narration}</p>
            </div>
          </div>
        </div>

        {phase !== "narrating" && (
          <div className="w-full max-w-lg space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 shrink-0" style={{ borderColor: subjectColor }}>
                <Image src={tutor.avatar} alt={tutor.name} width={48} height={48} className="object-cover" />
              </div>
              <div className="vi-card px-5 py-3 flex-1" style={{ background: subjectTint, borderColor: `${subjectColor}26` }}>
                <p className="text-slate-800 text-sm">{activity.tutorLine}</p>
              </div>
            </div>

            <div className="text-center text-5xl mb-2" aria-hidden>{activity.sceneEmoji}</div>

            {activity.interaction === "voice_response" ? (
              <VoiceActivitySurface
                activity={activity}
                accentColor={subjectColor}
                showChoices={showChoices}
                onAnswer={handleVoiceAnswer}
                promptStartRef={promptStartRef}
              />
            ) : (
              <div
                className={`grid grid-cols-2 gap-3 transition-all duration-500 ${showChoices ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              >
                {(activity.choices || []).map((choice, idx) => {
                  const isSelected = selected === choice.id;
                  const isWrong = isSelected && !choice.isCorrect;
                  const isRight = selected !== null && choice.isCorrect;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleSelect(choice)}
                      disabled={selected !== null}
                      className={`relative vi-card p-4 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)] focus-visible:ring-offset-2 ${
                        isRight ? "scale-105" : isWrong ? "scale-95 opacity-50" : isSelected ? "" : "hover:scale-105 active:scale-95"
                      }`}
                      style={{
                        borderColor: isRight ? "hsl(142 71% 45%)" : isWrong ? "hsl(0 72% 51%)" : isSelected ? subjectColor : undefined,
                        background: isRight ? "hsl(142 71% 45% / 0.08)" : isWrong ? "hsl(0 72% 51% / 0.08)" : undefined,
                        animationDelay: `${idx * 100}ms`,
                      }}
                    >
                      {choice.emoji && <div className="text-3xl mb-2" aria-hidden>{choice.emoji}</div>}
                      <p className="text-slate-900 font-extrabold text-sm">{choice.label}</p>
                      {isRight && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[hsl(142_71%_45%)] flex items-center justify-center text-white shadow-md">
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface VoiceActivitySurfaceProps {
  activity: Activity;
  accentColor: string;
  showChoices: boolean;
  onAnswer: (correct: boolean, latencyMs: number) => void;
  promptStartRef: React.MutableRefObject<number>;
}

/**
 * Microphone-driven response surface for `voice_response` Discovery
 * activities (used by Echo's Sound Studio for the speech-domain baseline).
 * Mirrors the behaviour of the stage `VoiceResponse` component but
 * adapts to the Discovery `onAnswer(correct, latencyMs)` signature and
 * commits at most one answer per mount.
 */
function VoiceActivitySurface({
  activity, accentColor, showChoices, onAnswer, promptStartRef,
}: VoiceActivitySurfaceProps) {
  const t = useTranslations("stt");
  const { locale } = useLocale();
  const { accessToken } = useAuth();
  const sttLocale = STT_LOCALE_MAP[locale] || "en-US";
  const [committedText, setCommittedText] = useState<string | null>(null);
  const [matched, setMatched] = useState<boolean | null>(null);
  const answeredRef = useRef(false);

  const expectedAnswer = (() => {
    const variants = [activity.correctAnswer, ...(activity.acceptedAnswers || [])]
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    return variants.length > 0 ? variants.join("|") : undefined;
  })();

  const { status, transcript, error, isSupported, start, stop, reset } = useSpeechInput({
    locale: sttLocale,
    authToken: accessToken,
    onResult: (text) => {
      setCommittedText(text);
      const result = matchVoiceAnswer(text, expectedAnswer);
      setMatched(result.matched);
      if (result.matched && !answeredRef.current) {
        answeredRef.current = true;
        playCorrectCue();
        const latency = Date.now() - promptStartRef.current;
        onAnswer(true, latency);
      } else if (!result.matched) {
        playIncorrectCue();
      }
    },
  });

  // Stop the in-flight recognition session if the activity unmounts so
  // we don't leak the mic across activity transitions.
  useEffect(() => () => { stop(); }, [stop]);

  const handleClick = () => {
    if (status === "listening") { stop(); return; }
    if (status === "processing") return;
    setCommittedText(null);
    setMatched(null);
    reset();
    void start();
  };

  const handleSkip = () => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const latency = Date.now() - promptStartRef.current;
    onAnswer(false, latency);
  };

  const errorLabel = (e: SpeechInputError | null) => {
    switch (e) {
      case "permission_denied": return t("mic_denied");
      case "no_speech": return t("no_speech");
      case "unsupported": return t("mic_unavailable");
      case "network":
      case "transcription_failed": return t("transcription_failed");
      case "audio_capture": return t("audio_capture_error");
      default: return null;
    }
  };

  const isListening = status === "listening";
  const isProcessing = status === "processing";

  return (
    <div
      className={`w-full flex flex-col items-center gap-2 transition-all duration-500 ${showChoices ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      role="group"
      aria-label={t("voice_answer_group")}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={!isSupported || isProcessing || answeredRef.current}
        aria-label={
          isListening ? t("listening_stop") :
          isProcessing ? t("processing") :
          isSupported ? t("tap_to_speak") : t("mic_unavailable")
        }
        aria-pressed={isListening}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center bg-white vi-border border-[3px] transition-all shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)] disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening
            ? "scale-110 ring-4 ring-[hsl(262_83%_58%/0.35)] animate-pulse"
            : "hover:scale-110 active:scale-95"
        }`}
        style={{ borderColor: accentColor, boxShadow: `0 4px 14px ${accentColor}33` }}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-slate-700 animate-spin" strokeWidth={2} aria-hidden />
        ) : (
          <Mic className="w-8 h-8 text-slate-700" strokeWidth={2} aria-hidden />
        )}
        {isListening && (
          <span
            className="absolute inset-0 rounded-full border-2 animate-ping"
            style={{ borderColor: accentColor }}
            aria-hidden
          />
        )}
      </button>
      <p className="text-slate-600 text-xs font-body min-h-4" aria-hidden>
        {isListening ? t("listening") :
         isProcessing ? t("processing") :
         !isSupported ? t("mic_unavailable") :
         t("tap_to_speak")}
      </p>
      {committedText && (
        <p
          className={`text-sm italic max-w-md text-center ${
            matched === true ? "text-emerald-700" :
            matched === false ? "text-rose-700" :
            "text-slate-700"
          }`}
          aria-live="polite"
        >
          “{committedText}”
        </p>
      )}
      {matched === false && !isListening && !isProcessing && !answeredRef.current && (
        <div className="flex flex-col items-center gap-2" role="status">
          <p className="text-rose-600 text-xs">{t("not_quite")}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-white border-2 text-slate-800 hover:bg-slate-50 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)]"
              style={{ borderColor: accentColor }}
              aria-label={t("try_again")}
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2.5} aria-hidden />
              {t("try_again")}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)]"
            >
              {t("skip")}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="text-rose-600 text-xs inline-flex items-center gap-1" role="alert">
          <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          {errorLabel(error)}
        </p>
      )}
      <div aria-live="polite" className="sr-only">
        {isListening && t("listening")}
        {isProcessing && t("processing")}
        {status === "idle" && committedText && matched === true && t("answer_correct")}
        {status === "idle" && committedText && matched === false && t("answer_not_quite", { text: committedText })}
        {status === "idle" && transcript && matched === null && t("heard_answer", { text: transcript })}
      </div>
    </div>
  );
}
