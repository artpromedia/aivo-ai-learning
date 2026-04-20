"use client";
import { useRouter } from "next/navigation";
import {
  Flame,
  Star,
  Brain,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  Target,
  TrendingUp,
} from "lucide-react";

interface LearnerSummaryCardProps {
  learner: {
    id: string;
    name: string;
    functioningLevel?: string;
    gradeLevel?: string;
    curriculumFramework?: string;
  };
  streak?: { currentStreak: number; longestStreak: number };
  badgeCount?: number;
  hasBrain?: boolean;
  pendingReview?: boolean;
  baselineCompleted?: boolean;
  pendingRecommendations?: number;
}

const LEVEL_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  SUPPORTED: "Supported",
  LOW_VERBAL: "Low Verbal",
  NON_VERBAL: "Non-Verbal",
  PRE_SYMBOLIC: "Emerging",
};

const LEVEL_STYLES: Record<string, string> = {
  STANDARD: "bg-green-50 text-green-700 border-green-200",
  SUPPORTED: "bg-blue-50 text-blue-700 border-blue-200",
  LOW_VERBAL: "bg-amber-50 text-amber-700 border-amber-200",
  NON_VERBAL: "bg-orange-50 text-orange-700 border-orange-200",
  PRE_SYMBOLIC: "bg-pink-50 text-pink-700 border-pink-200",
};

export function LearnerSummaryCard({
  learner,
  streak,
  badgeCount = 0,
  hasBrain = false,
  pendingReview = false,
  baselineCompleted = false,
  pendingRecommendations = 0,
}: LearnerSummaryCardProps) {
  const router = useRouter();

  type Status = {
    type: "action" | "attention" | "good";
    label: string;
    Icon: typeof CheckCircle2;
    container: string;
    iconWrap: string;
  };

  let status: Status = {
    type: "good",
    label: "On track",
    Icon: CheckCircle2,
    container: "bg-green-50 text-green-700 border-green-200",
    iconWrap: "bg-white text-green-600",
  };

  if (pendingReview) {
    status = {
      type: "action",
      label: "Brain review needed",
      Icon: AlertCircle,
      container: "bg-pink-50 text-pink-700 border-pink-200",
      iconWrap: "bg-white text-pink-600",
    };
  } else if (pendingRecommendations > 0) {
    status = {
      type: "attention",
      label: `${pendingRecommendations} recommendation${pendingRecommendations > 1 ? "s" : ""} pending`,
      Icon: AlertCircle,
      container: "bg-amber-50 text-amber-800 border-amber-200",
      iconWrap: "bg-white text-amber-600",
    };
  } else if (!baselineCompleted && !hasBrain) {
    status = {
      type: "attention",
      label: "Assessment needed",
      Icon: ClipboardList,
      container: "bg-amber-50 text-amber-800 border-amber-200",
      iconWrap: "bg-white text-amber-600",
    };
  }

  const goToLearner = () => router.push(`/dashboard/parent/learner/${learner.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") goToLearner();
      }}
      onClick={goToLearner}
      className="group bg-white rounded-3xl border-2 border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-200 hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-200"
    >
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              {learner.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-slate-900 leading-tight">
                {learner.name}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {learner.gradeLevel && (
                  <span className="text-xs font-semibold text-slate-500">
                    Grade {learner.gradeLevel}
                  </span>
                )}
                {learner.functioningLevel && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${LEVEL_STYLES[learner.functioningLevel] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    <Target size={10} strokeWidth={3} aria-hidden="true" />
                    {LEVEL_LABELS[learner.functioningLevel] ||
                      learner.functioningLevel.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight
            className="text-slate-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
            size={20}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </div>

        {(streak?.currentStreak || badgeCount > 0) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {streak && streak.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                <Flame size={14} strokeWidth={2.5} aria-hidden="true" />
                {streak.currentStreak}-day streak
              </span>
            )}
            {badgeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                <Star size={14} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
                {badgeCount} badge{badgeCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm border ${status.container}`}
        >
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${status.iconWrap}`}
          >
            <status.Icon size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="font-bold">{status.label}</span>
        </div>

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <fieldset
          className="flex gap-2 mt-4 flex-wrap border-0 p-0 m-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/progress`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-purple-50 text-purple-700 font-bold hover:bg-purple-100 transition border border-purple-100"
            style={{ minHeight: 44 }}
          >
            <TrendingUp size={14} strokeWidth={2.5} aria-hidden="true" />
            View Progress
          </button>
          {hasBrain && (
            <button
              onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/brain`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-green-50 text-green-700 font-bold hover:bg-green-100 transition border border-green-100"
              style={{ minHeight: 44 }}
            >
              <Brain size={14} strokeWidth={2.5} aria-hidden="true" />
              Open Brain
            </button>
          )}
          {pendingReview && (
            <button
              onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/brain-review`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition border-2 border-amber-200"
              style={{ minHeight: 44 }}
            >
              <AlertCircle size={14} strokeWidth={2.5} aria-hidden="true" />
              Review Brain
            </button>
          )}
          {!baselineCompleted && !hasBrain && (
            <button
              onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/assessment`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 transition border border-cyan-100"
              style={{ minHeight: 44 }}
            >
              <ClipboardList size={14} strokeWidth={2.5} aria-hidden="true" />
              Start Assessment
            </button>
          )}
        </fieldset>
      </div>
    </div>
  );
}
