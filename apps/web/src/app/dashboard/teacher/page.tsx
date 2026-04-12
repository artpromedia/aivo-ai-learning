"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BrainVisualization from "@/components/BrainVisualization";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

interface ClassroomGroup {
  grade: string;
  learners: ConnectedLearner[];
  avgMastery: number;
  atRiskCount: number;
}

export default function TeacherDashboard() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "settings">("overview");
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [atRiskAlerts, setAtRiskAlerts] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;
    setFetchError(false);
    fetch("/api/family/collaboration/connected-learners", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => {
        if (!r.ok) { setFetchError(true); return []; }
        return r.json();
      })
      .then(data => setLearners(Array.isArray(data) ? data : []))
      .catch(() => setFetchError(true))
      .finally(() => setLoadingLearners(false));
  }, [accessToken, user]);

  if (loading || !user) return null;

  const classrooms: ClassroomGroup[] = Object.values(
    learners.reduce((acc: Record<string, ClassroomGroup>, l) => {
      const grade = l.gradeLevel || "Unassigned";
      if (!acc[grade]) acc[grade] = { grade, learners: [], avgMastery: 0, atRiskCount: 0 };
      acc[grade].learners.push(l);
      return acc;
    }, {})
  );

  const totalLearners = learners.length;
  const functioningLevels = learners.reduce((acc: Record<string, number>, l) => {
    const level = l.functioningLevel || "Pending";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-bold">Teacher</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900">Teacher Dashboard</h1>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 ml-auto">
            {(["overview", "reports", "settings"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Learners</p>
                <p className="text-3xl font-bold text-slate-900">{totalLearners}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Grade Groups</p>
                <p className="text-3xl font-bold text-blue-600">{classrooms.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Functioning Levels</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(functioningLevels).map(([level, count]) => (
                    <span key={level} className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 font-medium">
                      {level}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Quick Actions</p>
                <div className="flex flex-col gap-1 mt-1">
                  <button onClick={() => setActiveTab("reports")} className="text-xs text-blue-600 hover:underline text-left font-medium">View Reports</button>
                  <button onClick={() => setActiveTab("settings")} className="text-xs text-blue-600 hover:underline text-left font-medium">Settings</button>
                </div>
              </div>
            </div>

            {loadingLearners ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="animate-pulse text-slate-400">Loading your learners...</div>
              </div>
            ) : fetchError ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
                <p className="text-red-600 font-semibold text-lg">Unable to load learners</p>
                <p className="text-sm text-slate-400 mt-2">Please try refreshing the page.</p>
              </div>
            ) : learners.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-4">📚</div>
                <p className="text-slate-700 font-heading font-bold text-xl">No learners connected yet</p>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Parents can invite you to their learner&apos;s team from the Collaboration page in their dashboard.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {classrooms.map(group => (
                  <div key={group.grade} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                          {group.grade.replace(/[^0-9KkPp]/g, "").toUpperCase() || "?"}
                        </span>
                        <h3 className="font-heading font-bold text-slate-900">Grade {group.grade}</h3>
                        <span className="text-sm text-slate-400">{group.learners.length} learner{group.learners.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.learners.map(l => (
                          <div key={l.id}
                            className={`rounded-xl border transition cursor-pointer ${expandedLearner === l.id ? "border-blue-300 bg-blue-50/30 shadow-md" : "border-slate-100 bg-white hover:shadow-sm hover:border-slate-200"}`}
                            onClick={() => setExpandedLearner(expandedLearner === l.id ? null : l.id)}>
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-slate-900">{l.name}</h4>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-primary font-bold">
                                  {l.functioningLevel || "Pending"}
                                </span>
                              </div>
                              {l.gradeLevel && <p className="text-xs text-slate-500 mb-2">Grade {l.gradeLevel}</p>}
                              {expandedLearner === l.id && accessToken && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <BrainVisualization learnerId={l.id} learnerName={l.name} accessToken={accessToken} compact />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Reports & Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg">📊</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">Weekly Mastery Report</h3>
                      <p className="text-xs text-slate-400">Generated weekly</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Track mastery progress across all your learners by subject and skill area.</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg">⚠️</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">At-Risk Alerts</h3>
                      <p className="text-xs text-slate-400">Updated daily</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Identify learners who may need additional support based on engagement and performance patterns.</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-sm transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg">📈</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">Session Engagement</h3>
                      <p className="text-xs text-slate-400">Generated weekly</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Monitor tutor session frequency, duration, and engagement metrics across your learners.</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg">🎯</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">IEP Progress</h3>
                      <p className="text-xs text-slate-400">Generated monthly</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Track IEP goal progress for learners with individualized education plans.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Learner Summary</h2>
              {learners.length === 0 ? (
                <p className="text-sm text-slate-400">No learners connected. Reports will appear once parents invite you to their learner teams.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Learner</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Grade</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Functioning Level</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold text-xs uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learners.map(l => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-medium text-slate-900">{l.name}</td>
                          <td className="py-3 px-4 text-slate-600">{l.gradeLevel || "—"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                              {l.functioningLevel || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                          </td>
                        </tr>
                      ))}
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
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Profile</h2>
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
                  <p className="text-blue-600 font-semibold">Teacher</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
                    <p className="text-xs text-slate-400">Receive email updates about your learners</p>
                  </div>
                  <button onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-11 h-6 rounded-full transition relative ${emailNotifs ? "bg-blue-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${emailNotifs ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Weekly Digest</p>
                    <p className="text-xs text-slate-400">Weekly summary of all learner progress</p>
                  </div>
                  <button onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`w-11 h-6 rounded-full transition relative ${weeklyDigest ? "bg-blue-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${weeklyDigest ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">At-Risk Alerts</p>
                    <p className="text-xs text-slate-400">Immediate notification when a learner shows at-risk patterns</p>
                  </div>
                  <button onClick={() => setAtRiskAlerts(!atRiskAlerts)}
                    className={`w-11 h-6 rounded-full transition relative ${atRiskAlerts ? "bg-blue-600" : "bg-slate-200"}`}>
                    <span className={`absolute w-5 h-5 rounded-full bg-white shadow top-0.5 transition ${atRiskAlerts ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </label>
              </div>
              {settingsSaved && <p className="text-sm text-green-600 mt-3 font-medium">Settings saved!</p>}
              <button onClick={handleSaveSettings}
                className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
