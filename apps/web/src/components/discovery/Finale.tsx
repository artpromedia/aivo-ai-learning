"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import { ADVENTURE_CHAPTERS, TUTOR_INTROS, type ChapterResult } from "./types";

interface FinaleProps {
  learnerName: string;
  chapterResults: ChapterResult[];
  totalCorrect: number;
  totalAttempts: number;
  xpEarned: number;
  onFinish: () => void;
}

export default function Finale({ learnerName, chapterResults, totalCorrect, totalAttempts, xpEarned, onFinish }: FinaleProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2500);
    const t3 = setTimeout(() => setStep(3), 4000);
    const t4 = setTimeout(() => setStep(4), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-950 via-purple-950 to-indigo-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-xl"
            style={{
              left: `${(i * 31 + 7) % 100}%`,
              top: `${(i * 19 + 11) % 100}%`,
              animationName: "float",
              animationDuration: `${2 + (i % 5)}s`,
              animationDelay: `${(i * 0.15) % 3}s`,
              animationIterationCount: "infinite",
            }}
          >
            {["⭐", "✨", "🌟", "💫", "🎉", "🎊", "🦋", "🌈"][i % 8]}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-md">
        <div className={`transition-all duration-1000 ${step >= 0 ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">You Did It!</h1>
          <p className="text-white/60 font-body">
            {learnerName ? `${learnerName}, you` : "You"} explored every world and discovered so much!
          </p>
        </div>

        <div className={`mt-6 flex justify-center gap-3 transition-all duration-1000 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {TUTOR_INTROS.map((intro) => {
            const tutor = TUTORS[intro.tutorKey];
            return (
              <div key={intro.tutorKey} className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg" style={{ borderColor: intro.color }}>
                <Image src={tutor.avatar} alt={intro.name} width={48} height={48} className="object-cover" />
              </div>
            );
          })}
        </div>

        <div className={`mt-8 transition-all duration-1000 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-heading font-bold text-amber-400">{totalCorrect}/{totalAttempts}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase">Correct</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-3xl font-heading font-bold text-cyan-400">+{xpEarned}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase">XP Earned</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {chapterResults.map((result) => {
                const ch = ADVENTURE_CHAPTERS.find(c => c.id === result.chapterId);
                return (
                  <div key={result.chapterId} className="bg-white/5 rounded-xl p-2 text-center">
                    <div className="text-lg">{ch?.landmark.emoji || "📚"}</div>
                    <p className="text-[10px] text-white/50 font-bold">{result.correct}/{result.total}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`mt-6 transition-all duration-1000 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur border border-amber-500/30 rounded-2xl px-6 py-4 mb-6">
            <div className="text-3xl mb-1">🏅</div>
            <p className="text-sm font-heading font-bold text-amber-400">Discovery Explorer</p>
            <p className="text-[11px] text-white/50">Your first badge!</p>
          </div>
        </div>

        <div className={`transition-all duration-1000 ${step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-white/50 font-body text-sm mb-4">
            Your Brain is now getting ready — building a special learning path just for you!
          </p>
          <button
            onClick={onFinish}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-lg font-heading font-bold shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform"
          >
            Start Learning! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
