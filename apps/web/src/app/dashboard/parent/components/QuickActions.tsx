"use client";
import { useRouter } from "next/navigation";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: string;
  priority: number;
  color: string;
}

interface QuickActionsProps {
  learners: Array<{
    id: string;
    name: string;
    functioningLevel?: string;
  }>;
  pendingReviews: Record<string, boolean>;
  hasBrain: Record<string, boolean>;
  baselineCompleted: Record<string, boolean>;
}

export function QuickActions({ learners, pendingReviews, hasBrain, baselineCompleted }: QuickActionsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [];

  for (const l of learners) {
    if (pendingReviews[l.id]) {
      actions.push({
        label: `Review ${l.name}'s Brain Profile`,
        description: "AIVO updated the brain profile and needs your approval.",
        href: `/dashboard/parent/learner/${l.id}/brain-review`,
        icon: "🧠",
        priority: 1,
        color: "from-amber-50 to-orange-50 border-amber-200",
      });
    }

    if (!l.functioningLevel) {
      actions.push({
        label: `Complete ${l.name}'s Assessment`,
        description: "Help us understand your child by completing the initial assessment (10 min).",
        href: `/dashboard/parent/learner/${l.id}/assessment`,
        icon: "📝",
        priority: 2,
        color: "from-cyan-50 to-blue-50 border-cyan-200",
      });
    } else if (baselineCompleted[l.id] && !hasBrain[l.id] && !pendingReviews[l.id]) {
      actions.push({
        label: `${l.name}'s brain is being built!`,
        description: "We'll notify you when it's ready for review.",
        href: `/dashboard/parent/learner/${l.id}`,
        icon: "⏳",
        priority: 3,
        color: "from-emerald-50 to-green-50 border-emerald-200",
      });
    }
  }

  actions.sort((a, b) => a.priority - b.priority);
  const topActions = actions.slice(0, 3);

  if (topActions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 text-center">
        <span className="text-2xl">🎉</span>
        <p className="text-green-700 font-semibold mt-1">All caught up! Everyone is on track.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-heading font-bold text-slate-900">What needs your attention</h2>
      {topActions.map((action, i) => (
        <button key={i} onClick={() => router.push(action.href)}
          className={`w-full text-left bg-gradient-to-r ${action.color} rounded-xl p-4 border hover:shadow-md transition`}
          style={{ minHeight: 44 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-xl flex-shrink-0">{action.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold text-slate-800">{action.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{action.description}</p>
            </div>
            <span className="text-slate-400 text-sm">→</span>
          </div>
        </button>
      ))}
    </div>
  );
}
