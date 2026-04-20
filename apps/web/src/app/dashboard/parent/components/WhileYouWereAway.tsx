"use client";
import {
  Target,
  Flame,
  Star,
  Trophy,
  BookOpen,
  TrendingUp,
  Users,
  Megaphone,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

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

const TYPE_VISUAL: Record<
  string,
  { Icon: LucideIcon; color: string; bg: string }
> = {
  skill_mastered: {
    Icon: Target,
    color: "text-subject-science",
    bg: "bg-subject-science-soft",
  },
  streak: {
    Icon: Flame,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  xp_milestone: {
    Icon: Star,
    color: "text-subject-sel",
    bg: "bg-subject-sel-soft",
  },
  badge_earned: {
    Icon: Trophy,
    color: "text-subject-sel",
    bg: "bg-subject-sel-soft",
  },
  session_completed: {
    Icon: BookOpen,
    color: "text-subject-reading",
    bg: "bg-subject-reading-soft",
  },
  mastery_up: {
    Icon: TrendingUp,
    color: "text-subject-math",
    bg: "bg-subject-math-soft",
  },
  team_change: {
    Icon: Users,
    color: "text-primary",
    bg: "bg-purple-100",
  },
  default: {
    Icon: Megaphone,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
};

export function WhileYouWereAway({ activities, lastVisit }: WhileYouWereAwayProps) {
  if (!lastVisit || activities.length === 0) return null;

  const daysSince = Math.floor(
    (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince < 1) return null;

  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6 border-2 border-slate-100 shadow-sm">
      <h2 className="text-lg font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-purple-50 text-primary flex items-center justify-center shrink-0">
          <Newspaper size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
        While you were away
        <span className="ml-auto text-xs font-bold text-slate-500 px-2.5 py-1 rounded-full bg-slate-100">
          {daysSince} day{daysSince !== 1 ? "s" : ""}
        </span>
      </h2>
      <ul className="space-y-3">
        {activities.slice(0, 5).map((a) => {
          const v = TYPE_VISUAL[a.type] || TYPE_VISUAL.default;
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span
                className={`w-10 h-10 rounded-2xl ${v.bg} ${v.color} flex items-center justify-center shrink-0`}
                aria-hidden="true"
              >
                <v.Icon size={18} strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 leading-snug">
                  {a.learnerName && (
                    <span className="font-bold text-slate-900">{a.learnerName}: </span>
                  )}
                  <span className="font-medium">{a.title}</span>
                </p>
                {a.description && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {a.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
