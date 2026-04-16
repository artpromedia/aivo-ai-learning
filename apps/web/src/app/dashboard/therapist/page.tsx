"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";
import LearnerCardSkeleton from "@/components/states/LearnerCardSkeleton";
import FetchErrorState from "@/components/states/FetchErrorState";
import EmptyLearnerState from "@/components/states/EmptyLearnerState";

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
        }).then(r => r.ok ? r.json() : []),
        fetch("/api/family/therapy-goals", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then(r => r.ok ? r.json() : { goals: [] }).catch(() => ({ goals: [] })),
      ]);
      setLearners(Array.isArray(learnersData) ? learnersData : []);
      setTherapyGoals(Array.isArray(goalsData?.goals) ? goalsData.goals : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingData(false);
    }
  }, [accessToken, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !user) return null;

  const getGoalsForLearner = (learnerId: string) => therapyGoals.filter(g => g.learnerId === learnerId);
  const activeGoals = therapyGoals.filter(g => g.status === "active" || g.status === "in_progress");
  const completedGoals = therapyGoals.filter(g => g.status === "completed" || g.status === "met");

  const levelDistribution = learners.reduce((acc: Record<string, number>, l) => {
    const level = l.functioningLevel || "Pending";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">{t("dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Active Clients</p>
          <p className="text-3xl font-bold text-slate-900">{learners.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Active Goals</p>
          <p className="text-3xl font-bold text-pink-600">{activeGoals.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Goals Met</p>
          <p className="text-3xl font-bold text-green-600">{completedGoals.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Functioning Levels</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(levelDistribution).map(([level, count]) => (
              <span key={level} className="px-2 py-0.5 text-xs rounded-full bg-pink-50 text-pink-700 font-medium">
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
        <EmptyLearnerState icon="\uD83D\uDC9C" title="No clients connected yet" description="Parents can invite you to their learner's care team from the Collaboration page in their dashboard." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learners.map(l => {
            const goals = getGoalsForLearner(l.id);
            const isExpanded = expandedClient === l.id;
            return (
              <div key={l.id}
                className={`bg-white rounded-2xl border transition ${isExpanded ? "border-pink-300 shadow-md" : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => setExpandedClient(isExpanded ? null : l.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`client-details-${l.id}`}
                  className="w-full text-left p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-heading font-bold text-slate-900">{l.name}</h3>
                    <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-primary font-bold">
                      {l.functioningLevel || "Pending"}
                    </span>
                  </div>
                  {l.gradeLevel && <p className="text-sm text-slate-500 font-semibold mb-3">Grade {l.gradeLevel}</p>}

                  {goals.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Therapy Goals ({goals.length})</p>
                      <div className="space-y-2">
                        {goals.slice(0, isExpanded ? undefined : 2).map(g => (
                          <div key={g.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700 truncate">{g.title}</p>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-1" role="progressbar" aria-valuenow={g.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.title} progress`}>
                                <div className="h-2.5 rounded-full bg-pink-500 transition-all" style={{ width: `${g.progressPct}%` }} />
                              </div>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{g.progressPct}%</span>
                          </div>
                        ))}
                        {!isExpanded && goals.length > 2 && (
                          <p className="text-xs text-pink-600 font-medium">+{goals.length - 2} more goals</p>
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {isExpanded && accessToken && (
                  <div id={`client-details-${l.id}`} className="px-6 pb-6 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-3 mt-4">Brain Profile</p>
                    <BrainVisualization learnerId={l.id} learnerName={l.name} accessToken={accessToken} compact />
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
