"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import BrainVisualization from "@/components/BrainVisualization";

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

export default function CaregiverDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [iepGoals, setIepGoals] = useState<IepGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "brain" | "iep">("overview");
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-bold">Caregiver</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center gap-6 mb-8 flex-wrap">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Caregiver Dashboard</h1>
          {learners.length > 1 && (
            <select value={selectedLearner || ""} onChange={e => setSelectedLearner(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white shadow-sm">
              {learners.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 ml-auto">
            {(["overview", "brain", "iep"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {tab === "overview" ? "Overview" : tab === "brain" ? "Brain Profile" : "IEP Goals"}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="animate-pulse text-slate-400">Loading...</div>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
            <p className="text-red-600 font-semibold text-lg">Unable to load data</p>
            <p className="text-sm text-slate-400 mt-2">Please try refreshing the page.</p>
          </div>
        ) : learners.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="text-5xl mb-4">💚</div>
            <p className="text-slate-700 font-heading font-bold text-xl">No learners connected yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Parents can invite you to their learner&apos;s care team from the Collaboration page in their dashboard.</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && activeLearner && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Learner</p>
                    <p className="text-xl font-bold text-slate-900">{activeLearner.name}</p>
                    <p className="text-sm text-slate-500 mt-1">Grade {activeLearner.gradeLevel || "—"}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Functioning Level</p>
                    <p className="text-xl font-bold text-purple-600">{activeLearner.functioningLevel || "Pending"}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">IEP Goals</p>
                    <p className="text-3xl font-bold text-green-600">{learnerGoals.length}</p>
                    <p className="text-xs text-slate-400 mt-1">{activeGoalCount} active across all learners</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Connected Learners</p>
                    <p className="text-3xl font-bold text-slate-900">{learners.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">Brain Profile Overview</h3>
                    {accessToken && (
                      <BrainVisualization learnerId={activeLearner.id} learnerName={activeLearner.name} accessToken={accessToken} compact />
                    )}
                    <button onClick={() => setActiveTab("brain")}
                      className="mt-4 text-sm text-green-600 font-semibold hover:underline">View full brain profile →</button>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">IEP Goal Progress</h3>
                    {learnerGoals.length === 0 ? (
                      <p className="text-sm text-slate-400">No IEP goals recorded for this learner.</p>
                    ) : (
                      <div className="space-y-3">
                        {learnerGoals.slice(0, 4).map(g => (
                          <div key={g.id}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-slate-700 truncate">{g.title}</p>
                              <span className="text-xs text-slate-400 font-medium ml-2">{g.progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${g.progressPct}%` }} />
                            </div>
                          </div>
                        ))}
                        {learnerGoals.length > 4 && (
                          <button onClick={() => setActiveTab("iep")}
                            className="text-sm text-green-600 font-semibold hover:underline">View all {learnerGoals.length} goals →</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {learners.length > 1 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">All Connected Learners</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {learners.map(l => (
                        <div key={l.id}
                          onClick={() => setSelectedLearner(l.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition ${l.id === selectedLearner ? "border-green-400 bg-green-50" : "border-slate-100 hover:border-slate-200 bg-white"}`}>
                          <p className="font-semibold text-slate-900">{l.name}</p>
                          <p className="text-xs text-slate-500 mt-1">Grade {l.gradeLevel || "—"} · {l.functioningLevel || "Pending"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "brain" && activeLearner && accessToken && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="font-heading font-bold text-lg text-slate-900 mb-2">Brain Profile — {activeLearner.name}</h2>
                  <p className="text-sm text-slate-500 mb-6">The Brain Clone captures learning patterns, strengths, sensory preferences, and communication style.</p>
                  <BrainVisualization learnerId={activeLearner.id} learnerName={activeLearner.name} accessToken={accessToken} />
                </div>
              </div>
            )}

            {activeTab === "iep" && activeLearner && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="font-heading font-bold text-lg text-slate-900 mb-2">IEP Goals — {activeLearner.name}</h2>
                  <p className="text-sm text-slate-500 mb-6">Track progress on individualized education plan goals.</p>
                  {learnerGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🎯</div>
                      <p className="text-slate-500 font-medium">No IEP goals recorded for this learner yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Goals will appear here once they are added to the learner&apos;s IEP profile.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learnerGoals.map(g => (
                        <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{g.title}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              g.status === "completed" || g.status === "met" ? "bg-green-100 text-green-700" :
                              g.status === "at_risk" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            }`}>{g.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                              <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${g.progressPct}%` }} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{g.progressPct}%</span>
                          </div>
                          {g.targetDate && (
                            <p className="text-xs text-slate-400 mt-2">Target: {new Date(g.targetDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
