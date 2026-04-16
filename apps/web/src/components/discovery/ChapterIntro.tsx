"use client";
import { useState } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import type { AdventureChapter } from "./types";

interface ChapterIntroProps {
  chapter: AdventureChapter;
  chapterNumber: number;
  totalChapters: number;
  onReady: () => void;
  onBringGrownUp?: () => void;
  lightMode?: boolean;
}

export default function ChapterIntro({ chapter, chapterNumber, totalChapters, onReady, onBringGrownUp, lightMode = false }: ChapterIntroProps) {
  const [phase, setPhase] = useState<"intro" | "ready">("intro");
  const [replayCount, setReplayCount] = useState(0);
  const tutor = TUTORS[chapter.tutorKey];

  const textPrimary = lightMode ? "text-slate-900" : "text-white";
  const textSecondary = lightMode ? "text-slate-500" : "text-white/60";
  const textMuted = lightMode ? "text-slate-400" : "text-white/40";

  if (phase === "ready") {
    return (
      <div className={`fixed inset-0 bg-gradient-to-br ${lightMode ? "from-amber-50 via-white to-purple-50" : chapter.bgGradient} flex flex-col items-center justify-center overflow-hidden`}>
        <div className="relative z-10 text-center px-6 max-w-md">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-3 shadow-xl mx-auto mb-6"
            style={{ borderColor: tutor.color, boxShadow: `0 0 30px ${tutor.color}40` }}
          >
            <Image src={tutor.avatar} alt={tutor.name} width={80} height={80} className="object-cover" />
          </div>

          <h2 className={`text-2xl font-heading font-bold ${textPrimary} mb-2`}>Ready?</h2>
          <p className={`${textSecondary} mb-8`}>
            {tutor.name} will guide you through this chapter
          </p>

          <div className="space-y-3 max-w-xs mx-auto">
            <button
              onClick={onReady}
              className="w-full px-8 py-4 rounded-2xl text-white font-heading font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(135deg, ${tutor.color}, ${tutor.color}cc)`,
                minHeight: "var(--learner-hit-target, 56px)",
              }}
            >
              ▶ Start
            </button>
            <button
              onClick={() => { setReplayCount(replayCount + 1); setPhase("intro"); }}
              className={`w-full px-8 py-3 rounded-2xl ${lightMode ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-white/10 text-white/80 hover:bg-white/20"} font-heading font-bold transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2`}
              style={{ minHeight: "var(--learner-hit-target, 48px)" }}
            >
              🔄 Hear it again
            </button>
            {onBringGrownUp && (
              <button
                onClick={onBringGrownUp}
                className={`w-full px-8 py-3 rounded-2xl ${lightMode ? "bg-pink-50 text-pink-700 hover:bg-pink-100" : "bg-pink-500/10 text-pink-300 hover:bg-pink-500/20"} font-heading font-bold transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2`}
                style={{ minHeight: "var(--learner-hit-target, 48px)" }}
              >
                👨‍👩‍👧 Bring my grown-up
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${lightMode ? "from-amber-50 via-white to-purple-50" : chapter.bgGradient} flex flex-col items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: tutor.color }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: tutor.color }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md">
        <p className={`${textMuted} text-sm font-heading font-bold uppercase tracking-widest mb-2`}>
          Chapter {chapterNumber} of {totalChapters}
        </p>
        <div className="text-6xl mb-4" aria-hidden="true">{chapter.landmark.emoji}</div>

        <h1 className={`text-3xl font-heading font-bold ${textPrimary} mb-1`}>{chapter.title}</h1>
        <p className={`text-lg ${textSecondary} font-body mb-8`}>{chapter.subtitle}</p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-3 shadow-xl"
            style={{ borderColor: tutor.color, boxShadow: `0 0 30px ${tutor.color}40` }}
          >
            <Image src={tutor.avatar} alt={tutor.name} width={80} height={80} className="object-cover" />
          </div>
        </div>
        <p className={`${lightMode ? "text-slate-600" : "text-white/70"} font-body text-sm leading-relaxed max-w-xs mx-auto mb-8`}>
          {chapter.sceneDescription}
        </p>

        <button
          onClick={() => setPhase("ready")}
          className="px-8 py-3 rounded-full text-white font-heading font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
          style={{ backgroundColor: tutor.color, boxShadow: `0 8px 30px ${tutor.color}40`, minHeight: "var(--learner-hit-target, 56px)" }}
        >
          I'm ready! {chapter.landmark.emoji}
        </button>
      </div>
    </div>
  );
}
