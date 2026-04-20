"use client";
import { useRouter } from "next/navigation";
import {
  Brain,
  ClipboardList,
  Sparkles,
  ChevronRight,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  priority: number;
  iconWrap: string;
  card: string;
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

export function QuickActions({
  learners,
  pendingReviews,
  hasBrain,
  baselineCompleted,
}: QuickActionsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [];

  for (const l of learners) {
    if (pendingReviews[l.id]) {
      actions.push({
        label: `Review ${l.name}'s Brain Profile`,
        description: "AIVO updated the brain profile and needs your approval.",
        href: `/dashboard/parent/learner/${l.id}/brain-review`,
        Icon: Brain,
        priority: 1,
        iconWrap: "bg-white text-amber-600",
        card: "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300",
      });
    }

    if (!l.functioningLevel) {
      actions.push({
        label: `Complete ${l.name}'s Assessment`,
        description:
          "Help us understand your child by completing the initial assessment (10 min).",
        href: `/dashboard/parent/learner/${l.id}/assessment`,
        Icon: ClipboardList,
        priority: 2,
        iconWrap: "bg-white text-subject-reading",
        card: "from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300",
      });
    } else if (
      baselineCompleted[l.id] &&
      !hasBrain[l.id] &&
      !pendingReviews[l.id]
    ) {
      actions.push({
        label: `${l.name}'s brain is being built!`,
        description: "We'll notify you when it's ready for review.",
        href: `/dashboard/parent/learner/${l.id}`,
        Icon: Sparkles,
        priority: 3,
        iconWrap: "bg-white text-subject-science",
        card: "from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300",
      });
    }
  }

  actions.sort((a, b) => a.priority - b.priority);
  const topActions = actions.slice(0, 3);

  if (topActions.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-5 border-2 border-green-200">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-subject-science shadow-sm shrink-0">
          <PartyPopper size={24} strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div>
          <p className="text-green-800 font-heading font-bold text-base">
            All caught up!
          </p>
          <p className="text-green-700 text-sm font-medium">
            Everyone is on track.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-heading font-bold text-slate-900 flex items-center gap-2">
        <Sparkles
          className="text-primary"
          size={20}
          strokeWidth={2.5}
          aria-hidden="true"
        />
        What needs your attention
      </h2>
      {topActions.map((action, i) => (
        <button
          key={i}
          onClick={() => router.push(action.href)}
          className={`group w-full text-left bg-gradient-to-r ${action.card} rounded-2xl p-4 border-2 hover:shadow-md transition-all`}
          style={{ minHeight: 44 }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${action.iconWrap} flex items-center justify-center shadow-sm shrink-0`}
            >
              <action.Icon size={22} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold text-slate-900">
                {action.label}
              </p>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                {action.description}
              </p>
            </div>
            <ChevronRight
              className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all shrink-0"
              size={20}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </div>
        </button>
      ))}
    </div>
  );
}
