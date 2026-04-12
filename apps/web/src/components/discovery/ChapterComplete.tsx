"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import type { AdventureChapter, ChapterResult } from "./types";

interface ChapterCompleteProps {
  chapter: AdventureChapter;
  result: ChapterResult;
  isLastChapter: boolean;
  onContinue: () => void;
}

export default function ChapterComplete({ chapter, result, isLastChapter, onContinue }: ChapterCompleteProps) {
  const [show, setShow] = useState(false);
  const tutor = TUTORS[chapter.tutorKey];

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${chapter.bgGradient} flex items-center justify-center`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${(i * 29 + 5) % 100}%`,
              top: `${(i * 17 + 3) % 100}%`,
              animationName: "float",
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i * 0.2) % 2}s`,
              animationIterationCount: "infinite",
              opacity: 0.3,
            }}
          >
            {chapter.landmark.emoji}
          </div>
        ))}
      </div>

      <div className={`relative z-10 text-center px-6 max-w-sm transition-all duration-700 ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
        <div
          className="w-20 h-20 rounded-full overflow-hidden border-3 shadow-xl mx-auto mb-4"
          style={{ borderColor: tutor.color, boxShadow: `0 0 30px ${tutor.color}50` }}
        >
          <Image src={tutor.avatar} alt={tutor.name} width={80} height={80} className="object-cover" />
        </div>

        <div className="text-5xl mb-3">{chapter.landmark.emoji}</div>
        <h2 className="text-2xl font-heading font-bold text-white mb-1">World Complete!</h2>
        <p className="text-white/60 font-body text-sm mb-6">{chapter.transitionLine}</p>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-amber-400">{result.correct}/{result.total}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase">Correct</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-cyan-400">+{result.correct * 10}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase">XP</p>
            </div>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-heading font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          {isLastChapter ? "See Results! 🎉" : "Next World! 🗺️"}
        </button>
      </div>
    </div>
  );
}
