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

interface IepGoal {
  id: string;
  learnerId: string;
  title: string;
  progressPct: number;
  targetDate?: string;
  status: string;
}

export default function CaregiverOverviewPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("caregiver");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [iepGoals, setIepGoals] = useState<IepGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) return;
    setFetchError(false);
    Promise.all([
      fetch("/api/family/collaboration/connected-learners", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : []),
      fetch("/api/family/iep-goals", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : { goals: [] }).catch(() => ({ goals: [] })),
    ])
      .then(([learnersData, goalsData]) => {
        const parsed = Array.isArray(learnersData) ? learnersData : [];
        setLearners(parsed);
        setIepGoals(Array.isArray(goalsData?.goals) ? goalsData.goals : []);
        if (parsed.length > 0 && !selectedLearner) setSelectedLearner(parsed[0].id);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoadingData(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  const activeLearner = learners.find(l => l.id === selectedLearner);
  const learnerGoals = iepGoals.filter(g => g.learnerId === selectedLearner);
  const activeGoalCount = iepGoals.filter(g => g.status === "active" || g.status === "in_progress").length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-6 flex-wrap">
        <h1 className="text-3xl font-heading font-bold text-slate-900">{t("dashboard")}</h1>
        {learners.length > 1 && (
          <select value={selectedLearner || ""} onChange={e => setSelectedLearner(e.target.value)}
            aria-label="Select learner"
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white shadow-sm">
            {learners.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
      </div>

      {loadingData ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="animate-pulse text-slate-500" role="status" aria-live="polite">Loading...</div>
        </div>
      ) : fetchError ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-red-100" role="alert">
          <p className="text-red-600 font-semibold text-lg">Unable to load data</p>
          <p className="text-sm text-slate-500 mt-2">Please try refreshing the page.</p>
        </div>
      ) : learners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-5xl mb-4" aria-hidden="true">💚</div>
          <p className="text-slate-700 font-heading font-bold text-xl">No learners connected yet</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Parents can invite you to their learner&apos;s care team from the Collaboration page in their dashboard.</p>
        </div>
      ) : activeLearner && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Learner</p>
              <p className="text-xl font-bold text-slate-900">{activeLearner.name}</p>
              <p className="text-sm text-slate-500 mt-1">Grade {activeLearner.gradeLevel || "—"}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Functioning Level</p>
              <p className="text-xl font-bold text-purple-600">{activeLearner.functioningLevel || "Pending"}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">IEP Goals</p>
              <p className="text-3xl font-bold text-green-600">{learnerGoals.length}</p>
              <p className="text-xs text-slate-500 mt-1">{activeGoalCount} active across all learners</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Connected Learners</p>
              <p className="text-3xl font-bold text-slate-900">{learners.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("progress_tracking")}</h3>
              {accessToken && (
                <BrainVisualization learnerId={activeLearner.id} learnerName={activeLearner.name} accessToken={accessToken} compact />
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("iep_goals")}</h3>
              {learnerGoals.length === 0 ? (
                <p className="text-sm text-slate-500">No IEP goals recorded for this learner.</p>
              ) : (
                <div className="space-y-3">
                  {learnerGoals.slice(0, 4).map(g => (
                    <div key={g.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{g.title}</p>
                        <span className="text-xs text-slate-500 font-medium ml-2">{g.progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2" role="progressbar" aria-valuenow={g.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.title} progress`}>
                        <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${g.progressPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {learners.length > 1 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("my_learners")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {learners.map(l => (
                  <button key={l.id}
                    onClick={() => setSelectedLearner(l.id)}
                    className={`p-4 rounded-xl border-2 text-left transition ${l.id === selectedLearner ? "border-green-400 bg-green-50" : "border-slate-100 hover:border-slate-200 bg-white"}`}>
                    <p className="font-semibold text-slate-900">{l.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Grade {l.gradeLevel || "—"} · {l.functioningLevel || "Pending"}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
