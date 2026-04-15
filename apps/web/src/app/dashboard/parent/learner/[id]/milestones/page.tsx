"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Milestone {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
}

interface Badge {
  id: string;
  badgeKey: string;
  earnedAt: string;
}

const BADGE_DEFINITIONS: Record<string, { name: string; icon: string; description: string }> = {
  first_session: { name: "First Session", icon: "🌟", description: "Complete first tutoring session" },
  on_fire: { name: "On Fire", icon: "🔥", description: "7-day streak" },
  brain_activated: { name: "Brain Activated", icon: "🧠", description: "Brain profile approved" },
  bookworm: { name: "Bookworm", icon: "📚", description: "10 sessions completed" },
  mastery_champion: { name: "Mastery Champion", icon: "🏆", description: "Any subject above 75%" },
  goal_getter: { name: "Goal Getter", icon: "🎯", description: "IEP goal met" },
  team_player: { name: "Team Player", icon: "💬", description: "Full learning team" },
  multi_subject: { name: "Multi-Subject", icon: "🌈", description: "Active in 3+ subjects" },
  speed_learner: { name: "Speed Learner", icon: "⚡", description: "Top 25% session time" },
  explorer: { name: "Explorer", icon: "🌍", description: "All subject areas explored" },
};

const TYPE_ICONS: Record<string, string> = {
  skill_mastered: "🎯",
  streak: "🔥",
  xp_milestone: "⭐",
  badge_earned: "🏆",
  mastery_up: "📈",
  brain_created: "🧠",
  joined: "📝",
};

export default function MilestonesPage() {
  const { user, accessToken, loading } = useAuth();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/family/milestones/${learnerId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : { milestones: [], badges: [], streak: null })
      .then(data => {
        setMilestones(data.milestones || []);
        setBadges(data.badges || []);
        setStreak(data.streak);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  const earnedKeys = new Set(badges.map(b => b.badgeKey));
  const allBadges = Object.entries(BADGE_DEFINITIONS);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-slate-900">Milestones & Badges</h1>

      {streak && (
        <div className="flex gap-4">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex-1 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-orange-700">{streak.currentStreak}</div>
            <div className="text-xs text-orange-500 font-semibold">Current Streak</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex-1 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-amber-700">{streak.longestStreak}</div>
            <div className="text-xs text-amber-500 font-semibold">Longest Streak</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Badge Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {allBadges.map(([key, def]) => {
            const earned = earnedKeys.has(key);
            return (
              <div key={key} className={`text-center p-3 rounded-xl border ${earned ? "bg-purple-50 border-purple-200" : "bg-slate-50 border-slate-200 opacity-50"}`}>
                <div className="text-3xl mb-1">{earned ? def.icon : "❓"}</div>
                <div className={`text-xs font-bold ${earned ? "text-purple-700" : "text-slate-400"}`}>{def.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{def.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Achievement Timeline</h2>
        {loadingData ? (
          <div className="text-center py-8 text-slate-400 animate-pulse">Loading...</div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-slate-500 font-semibold">Achievements will appear here as your child progresses!</p>
          </div>
        ) : (
          <div className="space-y-4 relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-purple-100" />
            {milestones.map(m => (
              <div key={m.id} className="flex items-start gap-3 relative">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg flex-shrink-0 z-10 border-2 border-white">
                  {TYPE_ICONS[m.type] || "🏆"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-sm font-bold text-slate-800">{m.title}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(m.createdAt)}</span>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
