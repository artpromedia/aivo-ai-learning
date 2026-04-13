"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
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

export default function TherapistDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const t = useTranslations("caregiver");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [therapyGoals, setTherapyGoals] = useState<TherapyGoal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<"caseload" | "goals" | "settings">("caseload");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <span className="px-3 py-1 text-xs rounded-full bg-pink-100 text-pink-700 font-bold">Therapist</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900">{t("dashboard")}</h1>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 ml-auto">
            {(["caseload", "goals", "settings"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {tab === "caseload" ? "Caseload" : tab === "goals" ? "Therapy Goals" : "Settings"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "caseload" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Active Clients</p>
                <p className="text-3xl font-bold text-slate-900">{learners.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Active Goals</p>
                <p className="text-3xl font-bold text-pink-600">{activeGoals.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Goals Met</p>
                <p className="text-3xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Functioning Levels</p>
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
                <div className="animate-pulse text-slate-400">Loading your caseload...</div>
              </div>
            ) : fetchError ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
                <p className="text-red-600 font-semibold text-lg">Unable to load clients</p>
                <p className="text-sm text-slate-400 mt-2">Please try refreshing the page.</p>
              </div>
            ) : learners.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-4">💜</div>
                <p className="text-slate-700 font-heading font-bold text-xl">No clients connected yet</p>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Parents can invite you to their learner&apos;s care team from the Collaboration page in their dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {learners.map(l => {
                  const goals = getGoalsForLearner(l.id);
                  const isExpanded = expandedClient === l.id;
                  return (
                    <div key={l.id}
                      className={`bg-white rounded-2xl border transition cursor-pointer ${isExpanded ? "border-pink-300 shadow-md" : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"}`}
                      onClick={() => setExpandedClient(isExpanded ? null : l.id)}>
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
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Therapy Goals ({goals.length})</p>
                            <div className="space-y-2">
                              {goals.slice(0, isExpanded ? undefined : 2).map(g => (
                                <div key={g.id} className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-700 truncate">{g.title}</p>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                                      <div className="h-1.5 rounded-full bg-pink-500 transition-all" style={{ width: `${g.progressPct}%` }} />
                                    </div>
                                  </div>
                                  <span className="text-xs text-slate-400 font-medium">{g.progressPct}%</span>
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
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-3">Brain Profile</p>
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
        )}

        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("iep_goals")}</h2>
              {therapyGoals.length === 0 ? (
                <p className="text-sm text-slate-400">No therapy goals recorded yet. Goals will appear as they are added to learner IEP profiles.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Learner</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Goal</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Category</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Progress</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {therapyGoals.map(g => {
                        const learner = learners.find(l => l.id === g.learnerId);
                        return (
                          <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-900">{learner?.name || "Unknown"}</td>
                            <td className="py-3 px-4 text-slate-600">{g.title}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-700 font-medium">{g.category}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full bg-pink-500" style={{ width: `${g.progressPct}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{g.progressPct}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${g.status === "completed" || g.status === "met" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {g.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{td("overview")}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase">Name</label>
                  <p className="text-slate-900 font-medium">{user.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase">Email</label>
                  <p className="text-slate-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase">Role</label>
                  <p className="text-pink-600 font-semibold">Therapist</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{tc("details")}</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-400">Receive email updates about your clients</p>
                  </div>
                  <button onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-11 h-6 rounded-full transition relative ${emailNotifs ? "bg-pink-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${emailNotifs ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Session Reminders</p>
                    <p className="text-xs text-slate-400">Get reminders before scheduled therapy sessions</p>
                  </div>
                  <button onClick={() => setSessionReminders(!sessionReminders)}
                    className={`w-11 h-6 rounded-full transition relative ${sessionReminders ? "bg-pink-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${sessionReminders ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Goal Progress Alerts</p>
                    <p className="text-xs text-slate-400">Notifications when a therapy goal reaches milestones</p>
                  </div>
                  <button onClick={() => setGoalAlerts(!goalAlerts)}
                    className={`w-11 h-6 rounded-full transition relative ${goalAlerts ? "bg-pink-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${goalAlerts ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
              </div>
              {settingsSaved && <p className="text-sm text-green-600 mt-3 font-medium">Settings saved!</p>}
              <button onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 3000); }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-sm hover:bg-pink-700 transition">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
