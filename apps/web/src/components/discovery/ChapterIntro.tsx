"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import type { AdventureChapter } from "./types";

interface ChapterIntroProps {
  chapter: AdventureChapter;
  chapterNumber: number;
  totalChapters: number;
  onReady: () => void;
}

export default function ChapterIntro({ chapter, chapterNumber, totalChapters, onReady }: ChapterIntroProps) {
  const [step, setStep] = useState(0);
  const tutor = TUTORS[chapter.tutorKey];

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${chapter.bgGradient} flex flex-col items-center justify-center overflow-hidden`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: tutor.color }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: tutor.color }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md">
        <div className={`transition-all duration-700 ${step >= 0 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
          <p className="text-white/40 text-sm font-heading font-bold uppercase tracking-widest mb-2">
            Chapter {chapterNumber} of {totalChapters}
          </p>
          <div className="text-6xl mb-4">{chapter.landmark.emoji}</div>
        </div>

        <div className={`transition-all duration-700 delay-100 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">{chapter.title}</h1>
          <p className="text-lg text-white/60 font-body">{chapter.subtitle}</p>
        </div>

        <div className={`mt-8 transition-all duration-700 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-center justify-center gap-4">
            <div
              className="w-20 h-20 rounded-full overflow-hidden border-3 shadow-xl"
              style={{ borderColor: tutor.color, boxShadow: `0 0 30px ${tutor.color}40` }}
            >
              <Image src={tutor.avatar} alt={tutor.name} width={80} height={80} className="object-cover" />
            </div>
          </div>
          <p className="text-white/70 font-body mt-4 text-sm leading-relaxed max-w-xs mx-auto">
            {chapter.sceneDescription}
          </p>
        </div>

        <div className={`mt-10 transition-all duration-700 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <button
            onClick={onReady}
            className="px-8 py-3 rounded-full text-white font-heading font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-transform"
            style={{ backgroundColor: tutor.color, boxShadow: `0 8px 30px ${tutor.color}40` }}
          >
            Explore! {chapter.landmark.emoji}
          </button>
        </div>
      </div>
    </div>
  );
}
