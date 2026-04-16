"use client";
import Image from "next/image";
import { useState } from "react";
import { TUTORS } from "@aivo/brand";
import type { TutorKey } from "@aivo/brand";
import type { Beat, TutorState, SensoryAdaptations, SessionPhase } from "./types";
import { TUTOR_THEMES } from "./types";
import { ProgressPath } from "./ProgressPath";
import { TutorCharacter } from "./TutorCharacter";
import { StageContent } from "./StageContent";
import { ResponseZone } from "./ResponseZone";
import { BeatPreview } from "./BeatPreview";
import { StageBreakCloud } from "./StageBreakCloud";
import type { FunctioningLevel } from "./types";
import { MOTION_BUDGETS } from "@aivo/learner-ui";

interface StageLayoutProps {
  tutorKey: TutorKey;
  phase: SessionPhase;
  tutorState: TutorState;
  currentBeat: Beat | null;
  progress: number;
  totalBeats: number;
  currentBeatIndex: number;
  speechText?: string;
  functioningLevel: FunctioningLevel;
  adaptations: SensoryAdaptations;
  isParentWatching?: boolean;
  onAnswer: (correct: boolean) => void;
  onPause: () => void;
  onHome?: () => void;
  onHelp?: () => void;
  onBeatPreviewDone?: () => void;
}

export function StageLayout({
  tutorKey, phase, tutorState, currentBeat, progress, totalBeats,
  currentBeatIndex, speechText, functioningLevel, adaptations,
  isParentWatching, onAnswer, onPause, onHome, onHelp, onBeatPreviewDone,
}: StageLayoutProps) {
  const tutor = TUTORS[tutorKey];
  const theme = TUTOR_THEMES[tutorKey];
  const showSubtitles = adaptations.useSubtitles !== false;
  const motionBudget = MOTION_BUDGETS[functioningLevel];
  const [showBreak, setShowBreak] = useState(false);
  const [showBeatPreview, setShowBeatPreview] = useState(false);
  const [beatPreviewAcked, setBeatPreviewAcked] = useState<Record<number, boolean>>({});

  const beatsUntilBreak = (() => {
    const breakInterval = functioningLevel === "STANDARD" ? 5 : functioningLevel === "SUPPORTED" ? 4 : 3;
    const beatsIntoInterval = currentBeatIndex % breakInterval;
    return breakInterval - beatsIntoInterval;
  })();

  const shouldShowPreview = currentBeat && !beatPreviewAcked[currentBeatIndex] && phase !== "loading" && phase !== "celebration" && motionBudget.previewDurationMs > 0;

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br ${theme?.bgGradient || "from-slate-900 to-purple-900"}`}
      style={{
        filter: `saturate(${adaptations.colorSaturation}%)`,
      }}
      role="main"
      aria-label={`Learning session with ${tutor.name}`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <StageBackground tutorKey={tutorKey} motionReduced={adaptations.motionReduced} functioningLevel={functioningLevel} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-md" role="banner">
        <div className="flex items-center gap-3">
          {onHome && (
            <button
              onClick={onHome}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-sm hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Back home"
              style={{ minHeight: "var(--learner-hit-target, 36px)", minWidth: "var(--learner-hit-target, 36px)" }}
            >
              🏠
            </button>
          )}
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
            <Image src={tutor.avatar} alt={tutor.name} width={32} height={32} className="object-cover" />
          </div>
          <div>
            <p className="text-white text-sm font-heading font-bold leading-none">{tutor.name}</p>
            <p className="text-white/50 text-xs">{theme?.envName}</p>
          </div>
        </div>

        <ProgressPath
          progress={progress}
          totalSteps={totalBeats}
          currentStep={currentBeatIndex}
          accentColor={theme?.accentColor || tutor.color}
          beatsUntilBreak={beatsUntilBreak}
        />

        <div className="flex items-center gap-2">
          {isParentWatching && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur rounded-full px-3 py-1">
              <span className="text-xs" aria-hidden="true">❤️</span>
              <span className="text-white/60 text-xs font-bold hidden md:inline">Your grown-up is watching too</span>
            </div>
          )}
          {onHelp && (
            <button
              onClick={onHelp}
              className="h-9 px-3 rounded-full bg-amber-500/20 backdrop-blur border border-amber-400/30 flex items-center justify-center gap-1.5 text-sm text-amber-200 hover:bg-amber-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="I need help"
              style={{ minHeight: "var(--learner-hit-target, 36px)" }}
            >
              <span aria-hidden="true">🙋</span>
              <span className="hidden md:inline font-bold">Help</span>
            </button>
          )}
          <button
            onClick={() => setShowBreak(true)}
            className="h-9 px-3 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center gap-1.5 text-sm text-white/80 hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Take a break"
            style={{ minHeight: "var(--learner-hit-target, 36px)" }}
          >
            <span aria-hidden="true">☁️</span>
            <span className="hidden md:inline font-bold">Break</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-4 px-4 py-2 min-h-0">
        <div className="flex-shrink-0 flex items-center justify-center md:w-48">
          <TutorCharacter
            tutorKey={tutorKey}
            state={tutorState}
            speechText={speechText}
            showSubtitles={showSubtitles}
            adaptations={adaptations}
          />
        </div>

        <StageContent
          beat={currentBeat}
          adaptations={adaptations}
          phase={phase}
        />
      </div>

      <div className="relative z-10 flex-shrink-0 pb-4 pt-2 px-4" role="application" aria-label="Answer area">
        <ResponseZone
          beat={currentBeat}
          functioningLevel={functioningLevel}
          adaptations={adaptations}
          onAnswer={onAnswer}
          accentColor={theme?.accentColor || tutor.color}
        />
      </div>

      {shouldShowPreview && (
        <BeatPreview
          beat={currentBeat!}
          tutorName={tutor.name}
          accentColor={theme?.accentColor || tutor.color}
          autoAdvanceMs={motionBudget.previewDurationMs > 0 ? motionBudget.previewDurationMs + 1400 : 0}
          onReady={() => {
            setBeatPreviewAcked((prev) => ({ ...prev, [currentBeatIndex]: true }));
            onBeatPreviewDone?.();
          }}
        />
      )}

      <StageBreakCloud
        isOpen={showBreak}
        onClose={() => setShowBreak(false)}
        onPause={() => { setShowBreak(false); onPause(); }}
        onHome={onHome}
      />
    </div>
  );
}

function StageBackground({ tutorKey, motionReduced, functioningLevel }: { tutorKey: string; motionReduced: boolean; functioningLevel: FunctioningLevel }) {
  const theme = TUTOR_THEMES[tutorKey];
  if (!theme) return null;

  const motionBudget = MOTION_BUDGETS[functioningLevel];
  const count = motionBudget.particleCount;

  if (count === 0) return null;

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 7 + 5) % 100,
    y: (i * 11 + 3) % 100,
    size: 4 + (i % 3) * 4,
    delay: (i * 0.4) % 5,
    duration: 8 + (i % 5) * 2.5,
  }));

  const emojis: Record<string, string[]> = {
    nova: ["✨", "⭐", "💫", "🌟"],
    sage: ["📖", "✏️", "📝", "📚"],
    spark: ["⚡", "🔬", "🧪", "💡"],
    chrono: ["⏳", "🏛️", "📜", "🗺️"],
    pixel: ["💻", "⌨️", "🖥️", "📟"],
    echo: ["🎵", "🎶", "🗣️", "🔊"],
    harmony: ["💜", "💛", "🤝", "😊"],
    atlas: ["🌍", "🗺️", "🧭", "✈️"],
    cadence: ["🎵", "🎹", "🥁", "🎸"],
    vigor: ["🏃", "⚽", "🏀", "💪"],
    lingua: ["🌐", "🗣️", "📖", "🔤"],
    forge: ["⚙️", "🔧", "🔨", "🛠️"],
    compass: ["🧭", "🏠", "🚌", "💰"],
    muse: ["🎨", "🖌️", "🎭", "✨"],
  };

  const tutorEmojis = emojis[tutorKey] || ["✨"];

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${motionReduced ? "opacity-15" : "animate-stage-particle opacity-20"}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {tutorEmojis[p.id % tutorEmojis.length]}
        </div>
      ))}
    </>
  );
}
