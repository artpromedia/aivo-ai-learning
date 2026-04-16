"use client";
import { useState } from "react";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { TUTOR_INTROS } from "./types";

interface PreAdventureProps {
  learnerName: string;
  onStart: () => void;
  onShowMap?: () => void;
  lightMode?: boolean;
}

export default function PreAdventure({ learnerName, onStart, onShowMap, lightMode = false }: PreAdventureProps) {
  const [currentTutor, setCurrentTutor] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const [replayingIdx, setReplayingIdx] = useState<number | null>(null);

  const handleNext = () => {
    if (currentTutor < TUTOR_INTROS.length - 1) {
      setCurrentTutor(currentTutor + 1);
    } else {
      setAllRevealed(true);
    }
  };

  const handleReplay = (idx: number) => {
    setReplayingIdx(idx);
  };

  const bgClass = lightMode
    ? "from-amber-50 via-white to-purple-50"
    : "from-indigo-950 via-purple-950 to-slate-950";

  const textPrimary = lightMode ? "text-slate-900" : "text-white";
  const textSecondary = lightMode ? "text-slate-600" : "text-white/70";
  const textMuted = lightMode ? "text-slate-400" : "text-white/60";
  const starColor = lightMode ? "bg-purple-200/40" : "bg-white/30";

  const displayIdx = replayingIdx !== null ? replayingIdx : currentTutor;
  const displayIntro = TUTOR_INTROS[displayIdx];
  const displayTutor = TUTORS[displayIntro.tutorKey];

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${bgClass} flex flex-col items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 ${starColor} rounded-full`}
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              animationName: "twinkle",
              animationDuration: `${2 + (i % 3)}s`,
              animationDelay: `${(i * 0.3) % 2}s`,
              animationIterationCount: "infinite",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg w-full">
        <h1 className={`text-3xl md:text-4xl font-heading font-bold ${textPrimary} mb-2`}>
          Hi{learnerName ? `, ${learnerName}` : ""}!
        </h1>
        <p className={`text-lg ${textSecondary} font-body mb-8`}>
          Some really cool friends want to meet you!
        </p>

        <div className="mb-8">
          <div
            className="flex flex-col items-center gap-3 transition-all duration-500"
            key={displayIdx}
          >
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl"
              style={{ borderColor: displayIntro.color, boxShadow: `0 0 30px ${displayIntro.color}40` }}
            >
              <Image src={displayTutor.avatar} alt={displayIntro.name} width={96} height={96} className="object-cover" />
            </div>
            <p className={`text-xl font-heading font-bold ${textPrimary}`}>{displayIntro.name}</p>
            <p className={`text-sm ${textMuted} font-body leading-relaxed max-w-xs`}>
              &ldquo;{displayIntro.line}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {TUTOR_INTROS.map((intro, idx) => {
            const isRevealed = idx <= currentTutor;
            const isCurrent = idx === displayIdx;
            return (
              <button
                key={intro.tutorKey}
                onClick={() => isRevealed && handleReplay(idx)}
                disabled={!isRevealed}
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isCurrent ? "scale-110 ring-2 ring-white/50" : isRevealed ? "opacity-70 hover:opacity-100" : "opacity-20 grayscale"
                }`}
                style={{ borderColor: isRevealed ? intro.color : "transparent" }}
                aria-label={isRevealed ? `Replay ${intro.name}'s intro` : `${intro.name} — not yet revealed`}
              >
                <Image src={TUTORS[intro.tutorKey].avatar} alt={intro.name} width={40} height={40} className="object-cover" />
              </button>
            );
          })}
        </div>

        {!allRevealed ? (
          <div className="space-y-3">
            <button
              onClick={() => { setReplayingIdx(null); handleNext(); }}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xl font-heading font-bold shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-400"
              style={{ minHeight: "var(--learner-hit-target, 56px)" }}
            >
              Meet the next friend →
            </button>
            <p className={`text-xs ${textMuted}`}>
              {currentTutor + 1} of {TUTOR_INTROS.length} friends
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onStart}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xl font-heading font-bold shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-400"
              style={{ minHeight: "var(--learner-hit-target, 56px)" }}
            >
              Let&apos;s Go! 🚀
            </button>
            {onShowMap && (
              <button
                onClick={onShowMap}
                className={`block mx-auto text-sm ${lightMode ? "text-purple-600 hover:text-purple-800" : "text-white/60 hover:text-white/80"} font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg px-4 py-2`}
              >
                🗺️ Show me the map first
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
