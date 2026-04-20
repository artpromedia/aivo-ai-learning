"use client";
import { useState } from "react";
import { Heart, X } from "lucide-react";
import { useFlVariant, LearnerCard } from "@aivo/learner-ui";

interface SelExercise {
  title: string;
  steps: string[];
  durationMinutes: number;
}

const EMOTIONS = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "😴", label: "Tired", value: "tired" },
  { emoji: "🤩", label: "Excited", value: "excited" },
];

interface SelCheckInProps {
  onCheckin: (emotion: string) => Promise<SelExercise | null>;
}

export function SelCheckIn({ onCheckin }: SelCheckInProps) {
  const { isLow } = useFlVariant();
  const [isOpen, setIsOpen] = useState(false);
  const [exercise, setExercise] = useState<SelExercise | null>(null);

  const visibleEmotions = isLow ? EMOTIONS.slice(0, 4) : EMOTIONS;

  const handleSelect = async (emotion: string) => {
    setIsOpen(false);
    const result = await onCheckin(emotion);
    if (result) setExercise(result);
  };

  if (exercise) {
    return (
      <LearnerCard className="max-w-lg mx-auto" variant="bordered" accentColor="hsl(43 100% 50%)">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[hsl(43_100%_50%)] fill-[hsl(43_100%_50%)]" aria-hidden />
            <h3 className="font-extrabold text-lg text-slate-900">{exercise.title}</h3>
          </div>
          <button
            onClick={() => setExercise(null)}
            aria-label="Close"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(43_100%_50%)]"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[hsl(43_100%_50%/0.16)] text-[hsl(43_100%_50%)] text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-sm text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="text-xs text-slate-500 mt-3 font-semibold">{exercise.durationMinutes} minutes</div>
      </LearnerCard>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-full bg-[hsl(43_100%_50%/0.16)] text-[hsl(43_100%_50%)] font-extrabold hover:bg-[hsl(43_100%_50%/0.22)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(43_100%_50%)] ${
          isLow ? "px-7 py-3 text-lg" : "px-5 py-2.5 text-sm"
        }`}
        style={{ minHeight: "var(--learner-hit-target, 44px)" }}
        aria-expanded={isOpen}
      >
        <Heart className="w-4 h-4 fill-[hsl(43_100%_50%)]" aria-hidden /> How are you feeling?
      </button>
      {isOpen && (
        <div className="flex gap-2 flex-wrap justify-center vi-card p-3" role="radiogroup" aria-label="How are you feeling?">
          {visibleEmotions.map((e) => (
            <button
              key={e.value}
              onClick={() => handleSelect(e.value)}
              role="radio"
              aria-checked={false}
              className={`hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(43_100%_50%)] rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 ${
                isLow ? "text-4xl p-3" : "text-2xl p-2"
              }`}
              title={e.label}
              aria-label={e.label}
              style={{ minHeight: "var(--learner-hit-target, 48px)", minWidth: "var(--learner-hit-target, 48px)" }}
            >
              <span aria-hidden>{e.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
