"use client";
import { useFlVariant, LearnerCard } from "@aivo/learner-ui";

interface Badge {
  id: string;
  name: string;
  rarity: string;
}

interface RewardsTabProps {
  badges: Badge[];
  streakCurrent: number;
  streakLongest: number;
  coins: number;
  gems: number;
  onNavigate: (path: string) => void;
}

export function RewardsTab({ badges, streakCurrent, streakLongest, coins, gems, onNavigate }: RewardsTabProps) {
  const { isLow } = useFlVariant();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => onNavigate("/dashboard/learner/shop")}
          className={`inline-flex items-center gap-2 rounded-xl bg-green-50 text-green-700 font-bold hover:bg-green-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-green-400 ${
            isLow ? "px-8 py-4 text-lg" : "px-5 py-2.5 text-sm"
          }`}
          style={{ minHeight: "var(--learner-hit-target, 40px)" }}
        >
          <span aria-hidden="true">🛒</span> Shop
        </button>
        <button
          onClick={() => onNavigate("/dashboard/learner/badges")}
          className={`inline-flex items-center gap-2 rounded-xl bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-400 ${
            isLow ? "px-8 py-4 text-lg" : "px-5 py-2.5 text-sm"
          }`}
          style={{ minHeight: "var(--learner-hit-target, 40px)" }}
        >
          <span aria-hidden="true">🏅</span> Badges
        </button>
        {!isLow && (
          <button
            onClick={() => onNavigate("/dashboard/learner/leaderboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm hover:bg-purple-100 transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-400"
            style={{ minHeight: "var(--learner-hit-target, 40px)" }}
          >
            <span aria-hidden="true">🏆</span> Leaderboard
          </button>
        )}
      </div>

      {badges.length > 0 && (
        <LearnerCard>
          <h3 className="font-heading font-bold text-slate-800 mb-3">Recent Badges</h3>
          <div className={`grid gap-3 ${isLow ? "grid-cols-2" : "grid-cols-3 md:grid-cols-4"}`}>
            {badges.slice(0, isLow ? 4 : 8).map((b) => (
              <div key={b.id} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-3xl mb-1" aria-hidden="true">
                  {b.rarity === "legendary" ? "💎" : b.rarity === "epic" ? "🌟" : b.rarity === "rare" ? "⭐" : "🏅"}
                </div>
                <div className="text-xs font-bold text-slate-700 truncate">{b.name}</div>
              </div>
            ))}
          </div>
        </LearnerCard>
      )}

      <LearnerCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🔥</span>
            <span className="font-heading font-bold text-slate-700">Streak: {streakCurrent} days</span>
          </div>
          <span className="text-sm text-slate-400">Best: {streakLongest}</span>
        </div>
      </LearnerCard>
    </div>
  );
}
