"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("caregiver");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [therapyGoals, setTherapyGoals] = useState<TherapyGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) return;
    setFetchError(false);
    Promise.all([
      fetch("/api/family/collaboration/connected-learners", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : []),
      fetch("/api/family/therapy-goals", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : { goals: [] }).catch(() => ({ goals: [] })),
    ])
      .then(([learnersData, goalsData]) => {
        setLearners(Array.isArray(learnersData) ? learnersData : []);
        setTherapyGoals(Array.isArray(goalsData?.goals) ? goalsData.goals : []);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoadingData(false));
  }, [accessToken, user]);

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
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="animate-pulse text-slate-500" role="status" aria-live="polite">Loading your caseload...</div>
        </div>
      ) : fetchError ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-red-100" role="alert">
          <p className="text-red-600 font-semibold text-lg">Unable to load clients</p>
          <p className="text-sm text-slate-500 mt-2">Please try refreshing the page.</p>
        </div>
      ) : learners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-5xl mb-4" aria-hidden="true">💜</div>
          <p className="text-slate-700 font-heading font-bold text-xl">No clients connected yet</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Parents can invite you to their learner&apos;s care team from the Collaboration page in their dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {learners.map(l => {
            const goals = getGoalsForLearner(l.id);
            const isExpanded = expandedClient === l.id;
            return (
              <div key={l.id}
                className={`bg-white rounded-2xl border transition cursor-pointer ${isExpanded ? "border-pink-300 shadow-md" : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"}`}
                onClick={() => setExpandedClient(isExpanded ? null : l.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedClient(isExpanded ? null : l.id); } }}>
                <div className="p-6">
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
                              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1" role="progressbar" aria-valuenow={g.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.title} progress`}>
                                <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${g.progressPct}%` }} />
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

                  {isExpanded && accessToken && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-3">Brain Profile</p>
                      <BrainVisualization learnerId={l.id} learnerName={l.name} accessToken={accessToken} compact />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
