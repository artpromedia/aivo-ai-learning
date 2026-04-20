"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";
import LearnerCardSkeleton from "@/components/states/LearnerCardSkeleton";
import FetchErrorState from "@/components/states/FetchErrorState";
import EmptyLearnerState from "@/components/states/EmptyLearnerState";
import {
  HeartPulse,
  Users,
  Target,
  CheckCircle2,
  Layers,
  ChevronUp,
  ChevronDown,
  Brain,
  Sparkles,
} from "lucide-react";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

interface TherapyGoal {
  id: string;
  learnerId: string;
  title: string;
  category: string;
  progressPct: number;
  targetDate?: string;
  status: string;
}

const LEVEL_STYLES: Record<string, string> = {
  STANDARD: "bg-green-50 text-green-700 border-green-200",
  SUPPORTED: "bg-blue-50 text-blue-700 border-blue-200",
  LOW_VERBAL: "bg-amber-50 text-amber-700 border-amber-200",
  NON_VERBAL: "bg-orange-50 text-orange-700 border-orange-200",
  PRE_SYMBOLIC: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function TherapistCaseloadPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("therapist");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [therapyGoals, setTherapyGoals] = useState<TherapyGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken || !user) return;
    setFetchError(false);
    setLoadingData(true);
    try {
      const [learnersData, goalsData] = await Promise.all([
        fetch("/api/family/collaboration/connected-learners", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/family/therapy-goals", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((r) => (r.ok ? r.json() : { goals: [] }))
          .catch(() => ({ goals: [] })),
      ]);
      setLearners(Array.isArray(learnersData) ? learnersData : []);
      setTherapyGoals(Array.isArray(goalsData?.goals) ? goalsData.goals : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingData(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !user) return null;

  const getGoalsForLearner = (learnerId: string) =>
    therapyGoals.filter((g) => g.learnerId === learnerId);
  const activeGoals = therapyGoals.filter(
    (g) => g.status === "active" || g.status === "in_progress",
  );
  const completedGoals = therapyGoals.filter(
    (g) => g.status === "completed" || g.status === "met",
  );

  const levelDistribution = learners.reduce(
    (acc: Record<string, number>, l) => {
      const level = l.functioningLevel || "Pending";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-subject-math-soft text-subject-math flex items-center justify-center shadow-sm shrink-0">
          <HeartPulse size={28} strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 leading-tight">
            {t("dashboard")}
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Your caseload at a glance.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-subject-math-soft to-white rounded-3xl p-5 border-2 border-pink-100 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-subject-math mb-3">
            <Users size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-3xl font-black text-subject-math leading-none">
            {learners.length}
          </p>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mt-1.5">
            Active Clients
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl p-5 border-2 border-purple-100 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-3">
            <Target size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-3xl font-black text-primary leading-none">
            {activeGoals.length}
          </p>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mt-1.5">
            Active Goals
          </p>
        </div>

        <div className="bg-gradient-to-br from-subject-science-soft to-white rounded-3xl p-5 border-2 border-green-100 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-subject-science mb-3">
            <CheckCircle2 size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-3xl font-black text-subject-science leading-none">
            {completedGoals.length}
          </p>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mt-1.5">
            Goals Met
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-primary flex items-center justify-center mb-3">
            <Layers size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">
            Functioning Levels
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(levelDistribution).map(([level, count]) => (
              <span
                key={level}
                className={`px-2 py-0.5 text-[11px] rounded-full font-bold border ${LEVEL_STYLES[level] || "bg-slate-50 text-slate-700 border-slate-200"}`}
              >
                {level}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loadingData ? (
        <LearnerCardSkeleton count={4} />
      ) : fetchError ? (
        <FetchErrorState title="Unable to load clients" onRetry={fetchData} />
      ) : learners.length === 0 ? (
        <EmptyLearnerState
          icon="\uD83D\uDC9C"
          title="No clients connected yet"
          description="Parents can invite you to their learner's care team from the Collaboration page in their dashboard."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learners.map((l) => {
            const goals = getGoalsForLearner(l.id);
            const isExpanded = expandedClient === l.id;
            return (
              <div
                key={l.id}
                className={`bg-white rounded-3xl border-2 transition-all ${
                  isExpanded
                    ? "border-subject-math shadow-lg"
                    : "border-slate-100 shadow-sm hover:shadow-md hover:border-pink-200 hover:-translate-y-0.5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedClient(isExpanded ? null : l.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`client-details-${l.id}`}
                  className="w-full text-left p-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 rounded-3xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center font-black text-base shrink-0">
                      {l.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-heading font-bold text-slate-900 leading-tight">
                        {l.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {l.gradeLevel && (
                          <span className="text-xs font-semibold text-slate-500">
                            Grade {l.gradeLevel}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full font-bold border ${LEVEL_STYLES[l.functioningLevel] || "bg-purple-50 text-primary border-purple-200"}`}
                        >
                          <Target size={10} strokeWidth={3} aria-hidden="true" />
                          {l.functioningLevel || "Pending"}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp
                        size={20}
                        strokeWidth={2.5}
                        className="text-subject-math shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronDown
                        size={20}
                        strokeWidth={2.5}
                        className="text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {goals.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Sparkles
                          size={12}
                          strokeWidth={2.5}
                          className="text-subject-math"
                          aria-hidden="true"
                        />
                        Therapy Goals ({goals.length})
                      </p>
                      <div className="space-y-3">
                        {goals.slice(0, isExpanded ? undefined : 2).map((g) => (
                          <div key={g.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {g.title}
                              </p>
                              <div
                                className="w-full bg-slate-100 rounded-full h-3 mt-1.5 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={g.progressPct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${g.title} progress`}
                              >
                                <div
                                  className="h-full rounded-full bg-subject-math transition-all"
                                  style={{ width: `${g.progressPct}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-subject-math font-black shrink-0">
                              {g.progressPct}%
                            </span>
                          </div>
                        ))}
                        {!isExpanded && goals.length > 2 && (
                          <p className="text-xs text-subject-math font-bold">
                            +{goals.length - 2} more goals
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {isExpanded && accessToken && (
                  <div
                    id={`client-details-${l.id}`}
                    className="px-6 pb-6 border-t border-pink-100"
                  >
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-4 mb-3 flex items-center gap-1.5">
                      <Brain
                        size={12}
                        strokeWidth={2.5}
                        className="text-primary"
                        aria-hidden="true"
                      />
                      Brain Profile
                    </p>
                    <BrainVisualization
                      learnerId={l.id}
                      learnerName={l.name}
                      accessToken={accessToken}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
