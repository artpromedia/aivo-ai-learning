"use client";
import { useState } from "react";
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
  const { isLow, profile } = useFlVariant();
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
      <LearnerCard className="max-w-lg mx-auto" variant="bordered" accentColor="#EC4899">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-lg text-pink-800">{exercise.title}</h3>
          <button onClick={() => setExercise(null)} className="text-sm text-pink-500 hover:text-pink-700 font-bold transition-colors">
            Close
          </button>
        </div>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-pink-200 text-pink-800 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-sm text-pink-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="text-xs text-pink-400 mt-3 font-semibold">{exercise.durationMinutes} minutes</div>
      </LearnerCard>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-full bg-pink-50 text-pink-700 font-bold hover:bg-pink-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-pink-400 ${
          isLow ? "px-6 py-3 text-lg" : "px-4 py-2 text-sm"
        }`}
        style={{ minHeight: "var(--learner-hit-target, 40px)" }}
      >
        <span aria-hidden="true">💛</span> How are you feeling?
      </button>
      {isOpen && (
        <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label="How are you feeling?">
          {visibleEmotions.map((e) => (
            <button
              key={e.value}
              onClick={() => handleSelect(e.value)}
              className={`hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-full ${
                isLow ? "text-4xl p-2" : "text-2xl p-1"
              }`}
              title={e.label}
              aria-label={e.label}
              style={{ minHeight: "var(--learner-hit-target, 44px)", minWidth: "var(--learner-hit-target, 44px)" }}
            >
              <span aria-hidden="true">{e.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
