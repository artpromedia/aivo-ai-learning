"use client";
import { TUTORS } from "@aivo/brand";
import { useFlVariant, LearnerCard } from "@aivo/learner-ui";

interface AdventuresTabProps {
  onNavigate: (path: string) => void;
}

const QUEST_WORLDS = [
  { name: "Mathlands", emoji: "🔢", tutor: "nova", slug: "nova" },
  { name: "Word World", emoji: "📚", tutor: "sage", slug: "sage" },
  { name: "Science Frontier", emoji: "🔬", tutor: "spark", slug: "spark" },
  { name: "Time Archive", emoji: "⏳", tutor: "chrono", slug: "chrono" },
  { name: "Code Realm", emoji: "💻", tutor: "pixel", slug: "pixel" },
];

export function AdventuresTab({ onNavigate }: AdventuresTabProps) {
  const { isLow } = useFlVariant();

  return (
    <div className="space-y-6">
      <LearnerCard>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl" aria-hidden="true">🗺️</span>
          <h3 className="font-heading font-bold text-purple-800">{isLow ? "Adventures" : "Quest Worlds"}</h3>
        </div>
        <div className="space-y-2">
          {QUEST_WORLDS.slice(0, isLow ? 3 : 5).map((world) => {
            const tutor = TUTORS[world.tutor as keyof typeof TUTORS];
            return (
              <button
                key={world.slug}
                onClick={() => onNavigate(`/dashboard/learner/quests/${world.slug}`)}
                className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 hover:bg-purple-50 transition-colors text-left group focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400"
                style={{ minHeight: "var(--learner-hit-target, 48px)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${tutor?.color || "#7C3AED"}15` }}
                  aria-hidden="true"
                >
                  {world.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-purple-700 transition-colors">{world.name}</p>
                  <p className="text-xs text-slate-400">Explore quests</p>
                </div>
                <span className="text-slate-300 group-hover:text-purple-500 transition-colors" aria-hidden="true">→</span>
              </button>
            );
          })}
        </div>
      </LearnerCard>

      {!isLow && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate("/dashboard/learner/challenges")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-red-400"
            style={{ minHeight: "var(--learner-hit-target, 40px)" }}
          >
            <span aria-hidden="true">⚔️</span> Challenges
          </button>
          <button
            onClick={() => onNavigate("/dashboard/learner/homework")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm hover:bg-purple-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400"
            style={{ minHeight: "var(--learner-hit-target, 40px)" }}
          >
            <span aria-hidden="true">📸</span> Homework Helper
          </button>
        </div>
      )}
    </div>
  );
}
