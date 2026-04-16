"use client";
import { useFlVariant } from "@aivo/learner-ui";
import { LiveRegion } from "@aivo/learner-ui";

interface EngagementProfile {
  totalXp: number;
  level: number;
  xpForNextLevel: number;
  xpProgress: number;
  streak: { current: number; longest: number; tier: string };
  badges: { id: string; name: string; rarity: string }[];
  currency: { coins: number; gems: number };
  selMood?: string;
}

interface QuietProgressStripProps {
  profile: EngagementProfile | null;
}

const STREAK_COLORS: Record<string, string> = {
  grey: "#94a3b8",
  orange: "#f97316",
  purple: "#7c3aed",
  gold: "#eab308",
};

export function QuietProgressStrip({ profile }: QuietProgressStripProps) {
  const { profile: flProfile, isLow, isPreSymbolic } = useFlVariant();

  if (!profile || isPreSymbolic || flProfile.progressMode === "none" || flProfile.progressMode === "hidden") {
    return null;
  }

  const xpPercent = Math.min(100, (profile.xpProgress / profile.xpForNextLevel) * 100);

  if (flProfile.progressMode === "stars-only") {
    return (
      <section className="px-4 md:px-8 py-4" aria-label="Your progress">
        <div className="flex items-center justify-center gap-6 bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">⭐</span>
            <span className="text-xl font-heading font-bold text-amber-600">{profile.totalXp} Stars</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ color: STREAK_COLORS[profile.streak.tier] || "#94a3b8" }} aria-hidden="true">🔥</span>
            <span className="text-xl font-heading font-bold" style={{ color: STREAK_COLORS[profile.streak.tier] }}>
              {profile.streak.current} day{profile.streak.current !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 py-4" aria-label="Your progress">
      <div className="flex items-center justify-center gap-4 md:gap-8 bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">⭐</span>
          <span className="text-sm font-heading font-bold text-slate-700">Lv. {profile.level}</span>
          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-lg" style={{ color: STREAK_COLORS[profile.streak.tier] || "#94a3b8" }} aria-hidden="true">🔥</span>
          <span className="text-sm font-heading font-bold" style={{ color: STREAK_COLORS[profile.streak.tier] }}>
            {profile.streak.current}-day
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-lg" aria-hidden="true">🏆</span>
          <span className="text-sm font-heading font-bold text-slate-700">{profile.badges.length} badges</span>
        </div>

        {profile.selMood && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg" aria-hidden="true">💛</span>
            <span className="text-sm font-heading font-bold text-slate-500">mood: {profile.selMood}</span>
          </div>
        )}
      </div>
    </section>
  );
}
