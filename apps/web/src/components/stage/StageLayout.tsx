"use client";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import type { TutorKey } from "@aivo/brand";
import type { Beat, TutorState, SensoryAdaptations, SessionPhase } from "./types";
import { TUTOR_THEMES } from "./types";
import { ProgressPath } from "./ProgressPath";
import { TutorCharacter } from "./TutorCharacter";
import { StageContent } from "./StageContent";
import { ResponseZone } from "./ResponseZone";
import type { FunctioningLevel } from "./types";

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
}

export function StageLayout({
  tutorKey, phase, tutorState, currentBeat, progress, totalBeats,
  currentBeatIndex, speechText, functioningLevel, adaptations,
  isParentWatching, onAnswer, onPause,
}: StageLayoutProps) {
  const tutor = TUTORS[tutorKey];
  const theme = TUTOR_THEMES[tutorKey];
  const showSubtitles = adaptations.useSubtitles;

  return (
    <div
      className={`fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br ${theme?.bgGradient || "from-slate-900 to-purple-900"}`}
      style={{
        filter: `saturate(${adaptations.colorSaturation}%)`,
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <StageBackground tutorKey={tutorKey} motionReduced={adaptations.motionReduced} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
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
        />

        <div className="flex items-center gap-3">
          {isParentWatching && (
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <span>👁</span>
              <span className="hidden md:inline">Co-viewing</span>
            </div>
          )}
          <button
            onClick={onPause}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-lg hover:bg-white/20 transition-all"
            aria-label="Pause / Take a break"
          >
            ☁️
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

      <div className="relative z-10 flex-shrink-0 pb-4 pt-2 px-4">
        <ResponseZone
          beat={currentBeat}
          functioningLevel={functioningLevel}
          adaptations={adaptations}
          onAnswer={onAnswer}
          accentColor={theme?.accentColor || tutor.color}
        />
      </div>
    </div>
  );
}

function StageBackground({ tutorKey, motionReduced }: { tutorKey: string; motionReduced: boolean }) {
  const theme = TUTOR_THEMES[tutorKey];
  if (!theme) return null;

  const count = motionReduced ? 5 : 15;
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
          className={`absolute ${motionReduced ? "opacity-20" : "animate-stage-particle opacity-30"}`}
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
