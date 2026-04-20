"use client";
import { Star, Flame, Trophy, Heart } from "lucide-react";
import { useFlVariant } from "@aivo/learner-ui";

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
  grey: "hsl(220 9% 46%)",
  orange: "hsl(43 100% 50%)",
  purple: "hsl(262 83% 58%)",
  gold: "hsl(43 100% 50%)",
};

export function QuietProgressStrip({ profile }: QuietProgressStripProps) {
  const { profile: flProfile, isPreSymbolic } = useFlVariant();

  if (!profile || isPreSymbolic || flProfile.progressMode === "none" || flProfile.progressMode === "hidden") return null;

  const xpPercent = Math.min(100, (profile.xpProgress / profile.xpForNextLevel) * 100);
  const streakColor = STREAK_COLORS[profile.streak.tier] || STREAK_COLORS.grey;

  if (flProfile.progressMode === "stars-only") {
    return (
      <section className="px-4 md:px-8 py-4" aria-label="Your progress">
        <div className="flex items-center justify-center gap-6 vi-card p-4 max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-[hsl(43_100%_50%)] fill-[hsl(43_100%_50%)]" aria-hidden />
            <span className="text-xl font-extrabold text-[hsl(43_100%_50%)]">{profile.totalXp} Stars</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6" style={{ color: streakColor }} aria-hidden />
            <span className="text-xl font-extrabold" style={{ color: streakColor }}>
              {profile.streak.current} day{profile.streak.current !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 py-4" aria-label="Your progress">
      <div className="flex items-center justify-center gap-4 md:gap-6 vi-card p-4 max-w-2xl mx-auto flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[hsl(262_83%_58%)] fill-[hsl(262_83%_58%)]" aria-hidden />
          <span className="text-sm font-extrabold text-slate-900">Lv. {profile.level}</span>
          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[hsl(262_83%_58%)] h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="w-5 h-5" style={{ color: streakColor }} aria-hidden />
          <span className="text-sm font-extrabold" style={{ color: streakColor }}>{profile.streak.current}-day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="w-5 h-5 text-[hsl(43_100%_50%)]" aria-hidden />
          <span className="text-sm font-extrabold text-slate-900">{profile.badges.length} badges</span>
        </div>
        {profile.selMood && (
          <div className="flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-[hsl(340_82%_52%)] fill-[hsl(340_82%_52%)]" aria-hidden />
            <span className="text-sm font-extrabold text-slate-600">mood: {profile.selMood}</span>
          </div>
        )}
      </div>
    </section>
  );
}
