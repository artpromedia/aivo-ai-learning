"use client";
import { useRouter } from "next/navigation";

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

const LEVEL_COLORS: Record<string, string> = {
  STANDARD: "bg-green-100 text-green-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
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

  let statusType: "action" | "attention" | "good" = "good";
  let statusLabel = "On track";
  let statusEmoji = "🟢";

  if (pendingReview) {
    statusType = "action";
    statusLabel = "Brain review needed";
    statusEmoji = "🔴";
  } else if (pendingRecommendations > 0) {
    statusType = "attention";
    statusLabel = `${pendingRecommendations} recommendation${pendingRecommendations > 1 ? "s" : ""} pending`;
    statusEmoji = "🟡";
  } else if (!baselineCompleted && !hasBrain) {
    statusType = "attention";
    statusLabel = "Assessment needed";
    statusEmoji = "🟡";
  }

  return (
    <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/dashboard/parent/learner/${learner.id}`); }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer"
      onClick={() => router.push(`/dashboard/parent/learner/${learner.id}`)}>
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {learner.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-slate-900">{learner.name}</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {learner.gradeLevel && <span className="text-xs text-slate-500">Grade {learner.gradeLevel}</span>}
                {learner.functioningLevel && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[learner.functioningLevel] || "bg-slate-100 text-slate-600"}`}>
                    {LEVEL_LABELS[learner.functioningLevel] || learner.functioningLevel.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm">
          {streak && streak.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-orange-600 font-semibold">
              🔥 {streak.currentStreak}-day streak
            </span>
          )}
          {badgeCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              ⭐ {badgeCount} badge{badgeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
          statusType === "action" ? "bg-red-50 text-red-700" :
          statusType === "attention" ? "bg-amber-50 text-amber-700" :
          "bg-green-50 text-green-700"
        }`}>
          <span>{statusEmoji}</span>
          <span className="font-semibold">{statusLabel}</span>
        </div>

        <div role="group" className="flex gap-2 mt-4 flex-wrap" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          <button onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/progress`)}
            className="px-4 py-2 text-sm rounded-full bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 transition" style={{ minHeight: 44 }}>
            View Progress
          </button>
          {hasBrain && (
            <button onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/brain`)}
              className="px-4 py-2 text-sm rounded-full bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition" style={{ minHeight: 44 }}>
              Open Brain
            </button>
          )}
          {pendingReview && (
            <button onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/brain-review`)}
              className="px-4 py-2 text-sm rounded-full bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition border border-amber-200" style={{ minHeight: 44 }}>
              Review Brain
            </button>
          )}
          {!baselineCompleted && !hasBrain && (
            <button onClick={() => router.push(`/dashboard/parent/learner/${learner.id}/assessment`)}
              className="px-4 py-2 text-sm rounded-full bg-cyan-50 text-cyan-700 font-semibold hover:bg-cyan-100 transition" style={{ minHeight: 44 }}>
              Start Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
