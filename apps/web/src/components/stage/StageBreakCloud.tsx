"use client";
import { useState } from "react";

type BreakActivity = "breathe" | "music" | "stretch" | "quiet";

interface StageBreakCloudProps {
  isOpen: boolean;
  onClose: () => void;
  onPause: () => void;
  onHome?: () => void;
}

const BREAK_OPTIONS: { id: BreakActivity; icon: string; label: string; description: string }[] = [
  { id: "breathe", icon: "🌬️", label: "Breathe", description: "Slow, calm breaths" },
  { id: "music", icon: "🎵", label: "Listen", description: "Relaxing sounds" },
  { id: "stretch", icon: "🧘", label: "Stretch", description: "Gentle movement" },
  { id: "quiet", icon: "☁️", label: "Just sit", description: "Quiet moment" },
];

export function StageBreakCloud({ isOpen, onClose, onPause, onHome }: StageBreakCloudProps) {
  const [activity, setActivity] = useState<BreakActivity | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Break options"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3" aria-hidden="true">☁️</div>
          <h2 className="text-2xl font-heading font-bold text-slate-800">Take a break</h2>
          <p className="text-slate-500 mt-1">Your lesson is paused</p>
        </div>

        {!activity ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {BREAK_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActivity(option.id)}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-sky-50 border-2 border-transparent hover:border-sky-300 hover:bg-sky-100 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-400"
                  style={{ minHeight: "var(--learner-hit-target, 72px)" }}
                >
                  <span className="text-3xl" aria-hidden="true">{option.icon}</span>
                  <span className="font-heading font-bold text-sky-800">{option.label}</span>
                  <span className="text-xs text-sky-600">{option.description}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setActivity(null); onClose(); }}
                className="w-full px-6 py-3 rounded-2xl bg-purple-100 text-purple-700 font-heading font-bold hover:bg-purple-200 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400"
                style={{ minHeight: "var(--learner-hit-target, 48px)" }}
              >
                Keep going
              </button>
              {onHome && (
                <button
                  onClick={onHome}
                  className="w-full px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-heading font-bold hover:bg-slate-200 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-slate-400"
                  style={{ minHeight: "var(--learner-hit-target, 48px)" }}
                >
                  🏠 Go home (progress saved)
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-8">
              <div className="text-6xl mb-4" aria-hidden="true">
                {BREAK_OPTIONS.find((o) => o.id === activity)?.icon}
              </div>
              <p className="text-lg font-heading font-bold text-slate-700 mb-2">
                {activity === "breathe" && "Breathe in slowly... hold... breathe out..."}
                {activity === "music" && "Close your eyes and listen..."}
                {activity === "stretch" && "Reach up high, then gently touch your toes..."}
                {activity === "quiet" && "It's okay to just sit quietly. Take as long as you need."}
              </p>
              <p className="text-sm text-slate-400 mt-4">Take as long as you need</p>
            </div>
            <button
              onClick={() => { setActivity(null); onClose(); }}
              className="w-full px-6 py-3 rounded-2xl bg-purple-600 text-white font-heading font-bold hover:bg-purple-700 transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400"
              style={{ minHeight: "var(--learner-hit-target, 48px)" }}
            >
              I'm ready to go back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
