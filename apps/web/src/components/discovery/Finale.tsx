"use client";
import { useState, useEffect, useCallback } from "react";
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
  onSubmitResults: () => Promise<{ success: boolean; brain?: any; error?: string }>;
}

type BrainStatus = "idle" | "building" | "ready" | "error";

export default function Finale({ learnerName, chapterResults, totalCorrect, totalAttempts, xpEarned, onFinish, onSubmitResults }: FinaleProps) {
  const [step, setStep] = useState(0);
  const [brainStatus, setBrainStatus] = useState<BrainStatus>("idle");
  const [brainData, setBrainData] = useState<any>(null);

  const buildBrain = useCallback(async () => {
    setBrainStatus("building");
    const result = await onSubmitResults();
    if (result.success) {
      setBrainData(result.brain);
      setBrainStatus("ready");
    } else {
      setBrainStatus("error");
    }
  }, [onSubmitResults]);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2500);
    const t3 = setTimeout(() => setStep(3), 4000);
    const t4 = setTimeout(() => {
      setStep(4);
      buildBrain();
    }, 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [buildBrain]);

  const brainStatusSection = () => {
    if (brainStatus === "building") {
      return (
        <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl px-6 py-5 animate-pulse">
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-sm font-heading font-bold text-purple-300">Building Your Learning Brain...</p>
          <p className="text-[11px] text-white/40 mt-1">Analyzing your adventure to create a personalized learning path</p>
          <div className="flex gap-1 justify-center mt-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      );
    }

    if (brainStatus === "ready") {
      return (
        <div className="mt-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur border border-emerald-500/30 rounded-2xl px-6 py-5">
          <div className="text-3xl mb-2">🧠✨</div>
          <p className="text-sm font-heading font-bold text-emerald-400">Your Learning Brain is Ready!</p>
          {brainData?.active_tutors && (
            <p className="text-[11px] text-white/50 mt-1">
              {brainData.active_tutors.length} tutors activated for your journey
            </p>
          )}
          {brainData?.functioning_level && (
            <p className="text-[11px] text-white/40 mt-0.5">
              Learning path: {brainData.functioning_level}
            </p>
          )}
        </div>
      );
    }

    if (brainStatus === "error") {
      return (
        <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl px-6 py-5">
          <div className="text-3xl mb-2">🧠</div>
          <p className="text-sm font-heading font-bold text-amber-400">Your results are saved!</p>
          <p className="text-[11px] text-white/40 mt-1">Your learning brain will finish setting up when you start your first lesson</p>
        </div>
      );
    }

    return null;
  };

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

      <div className="relative z-10 text-center px-6 max-w-md max-h-[90vh] overflow-y-auto">
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
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur border border-amber-500/30 rounded-2xl px-6 py-4 mb-2">
            <div className="text-3xl mb-1">🏅</div>
            <p className="text-sm font-heading font-bold text-amber-400">Discovery Explorer</p>
            <p className="text-[11px] text-white/50">Your first badge!</p>
          </div>
        </div>

        <div className={`transition-all duration-1000 ${step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {brainStatusSection()}

          <button
            onClick={onFinish}
            disabled={brainStatus === "building"}
            className={`mt-6 px-10 py-4 rounded-full text-white text-lg font-heading font-bold shadow-2xl transition-all ${
              brainStatus === "building"
                ? "bg-gray-500/50 cursor-wait shadow-none"
                : "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-500/30 hover:scale-105 active:scale-95"
            }`}
          >
            {brainStatus === "building" ? "Building Brain..." : "Start Learning! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
