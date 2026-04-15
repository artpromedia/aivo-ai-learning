"use client";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  learnerName?: string;
  createdAt: string;
}

interface WhileYouWereAwayProps {
  activities: Activity[];
  lastVisit: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  skill_mastered: "🎯",
  streak: "🔥",
  xp_milestone: "⭐",
  badge_earned: "🏆",
  session_completed: "📚",
  mastery_up: "📈",
  team_change: "🤝",
  default: "📣",
};

export function WhileYouWereAway({ activities, lastVisit }: WhileYouWereAwayProps) {
  if (!lastVisit || activities.length === 0) return null;

  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince < 1) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h2 className="text-lg font-heading font-bold text-slate-900 mb-3">
        📣 While you were away ({daysSince} day{daysSince !== 1 ? "s" : ""})
      </h2>
      <div className="space-y-3">
        {activities.slice(0, 5).map(a => (
          <div key={a.id} className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[a.type] || TYPE_ICONS.default}</span>
            <div>
              <p className="text-sm text-slate-700">
                {a.learnerName && <span className="font-semibold">{a.learnerName}: </span>}
                {a.title}
              </p>
              {a.description && <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
