"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import type { Activity, AdventureChapter, ActivityChoice } from "./types";

interface ActivityRendererProps {
  activity: Activity;
  chapter: AdventureChapter;
  activityNumber: number;
  totalActivities: number;
  onAnswer: (correct: boolean, latencyMs: number) => void;
  onSkip: () => void;
}

export default function ActivityRenderer({
  activity,
  chapter,
  activityNumber,
  totalActivities,
  onAnswer,
}: ActivityRendererProps) {
  const [phase, setPhase] = useState<"narrating" | "interacting" | "feedback">("narrating");
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showChoices, setShowChoices] = useState(false);
  const promptStartRef = useRef<number>(Date.now());
  const tutor = TUTORS[chapter.tutorKey];

  useEffect(() => {
    setPhase("narrating");
    setSelected(null);
    setIsCorrect(null);
    setShowChoices(false);
    const t1 = setTimeout(() => {
      setPhase("interacting");
      promptStartRef.current = Date.now();
    }, 2500);
    const t2 = setTimeout(() => setShowChoices(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activity.id]);

  const handleSelect = (choice: ActivityChoice) => {
    if (selected) return;
    setSelected(choice.id);
    const correct = choice.isCorrect;
    setIsCorrect(correct);
    setPhase("feedback");

    const latency = Date.now() - promptStartRef.current;

    setTimeout(() => {
      onAnswer(correct, latency);
    }, 1800);
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${chapter.bgGradient} flex flex-col overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-lg">{chapter.landmark.emoji}</span>
          <span className="text-white/60 text-xs font-heading font-bold">{chapter.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalActivities }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < activityNumber - 1
                  ? "bg-amber-400"
                  : i === activityNumber - 1
                    ? "bg-white scale-125"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {phase === "feedback" && isCorrect !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className={`text-center px-8 py-6 rounded-3xl backdrop-blur-md ${
              isCorrect ? "bg-green-500/20" : "bg-amber-500/20"
            }`}>
              <div className="text-6xl mb-2">{isCorrect ? "🌟" : "💪"}</div>
              <p className="text-xl font-heading font-bold text-white">
                {isCorrect ? "Amazing!" : "Good try!"}
              </p>
              <p className="text-sm text-white/60 mt-1">
                {isCorrect
                  ? "You got it right!"
                  : "The adventure continues!"}
              </p>
            </div>
          </div>
        )}

        <div className={`transition-all duration-700 ${phase === "narrating" ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute"}`}>
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto text-center">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-3 shadow-xl animate-bounce"
              style={{ borderColor: tutor.color, boxShadow: `0 0 30px ${tutor.color}50` }}
            >
              <Image src={tutor.avatar} alt={tutor.name} width={96} height={96} className="object-cover" />
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4">
              <p className="text-white font-body text-base leading-relaxed">{activity.narration}</p>
            </div>
          </div>
        </div>

        {phase !== "narrating" && (
          <div className="w-full max-w-lg space-y-6">
            <div className="flex items-start gap-3">
              <div
                className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0"
                style={{ borderColor: tutor.color }}
              >
                <Image src={tutor.avatar} alt={tutor.name} width={56} height={56} className="object-cover" />
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl rounded-tl-sm px-5 py-3 flex-1">
                <p className="text-white font-body text-sm">{activity.tutorLine}</p>
              </div>
            </div>

            <div className="text-center text-5xl mb-2">{activity.sceneEmoji}</div>

            <div className={`grid gap-3 transition-all duration-500 ${showChoices ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${
              (activity.choices?.length || 0) <= 2 ? "grid-cols-2" : "grid-cols-2"
            }`}>
              {(activity.choices || []).map((choice, idx) => {
                const isSelected = selected === choice.id;
                const isWrong = isSelected && !choice.isCorrect;
                const isRight = selected !== null && choice.isCorrect;

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelect(choice)}
                    disabled={selected !== null}
                    className={`relative p-4 rounded-2xl border-2 text-center transition-all duration-300 ${
                      isRight
                        ? "border-green-400 bg-green-500/20 scale-105"
                        : isWrong
                          ? "border-red-400 bg-red-500/20 scale-95 opacity-50"
                          : isSelected
                            ? "border-white bg-white/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-95"
                    }`}
                    style={{
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    {choice.emoji && (
                      <div className="text-3xl mb-2">{choice.emoji}</div>
                    )}
                    <p className="text-white font-heading font-bold text-sm">
                      {choice.label}
                    </p>
                    {isRight && selected !== null && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
