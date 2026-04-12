"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface GoalProgress {
  goalId: string;
  goalText: string;
  domain: string;
  baseline: string;
  targetCriteria: string;
  currentValue: number;
  currentProgress: number;
  progressPercent: number;
  trend: "improving" | "stable" | "declining";
  status: string;
}

interface IepProgress {
  learnerId: string;
  goals: GoalProgress[];
  totalGoals: number;
  activeGoals: number;
  brainStateVersion: number;
}

interface IepDocument {
  id: string;
  fileName: string;
  fileUrl: string | null;
  status: string;
  uploadedAt: string;
}

interface ReportLearner {
  id: string;
  name: string;
  gradeLevel?: string;
  functioningLevel?: string;
}

interface ReportGoal {
  goalId: string;
  goalText: string;
  domain: string;
  status: string;
  baseline: string;
  target?: string;
  targetCriteria: string;
  currentMastery: number;
  progressPercent: number;
  evidence?: string;
  sessionEvidence: { lessonCount: number; tutorCount: number };
}

interface IepReport {
  title: string;
  generatedAt: string;
  learner: ReportLearner;
  goals: ReportGoal[];
  summary: { totalGoals: number; activeGoals: number; metGoals: number; averageProgress: number };
}

export default function IepDashboardPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [progress, setProgress] = useState<IepProgress | null>(null);
  const [documents, setDocuments] = useState<IepDocument[]>([]);
  const [report, setReport] = useState<IepReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<"goals" | "documents" | "report">("goals");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    fetch(`/api/family/iep/${learnerId}/progress`, { headers })
      .then(r => r.json()).then(setProgress)
      .catch((err) => console.error("Failed to fetch IEP progress:", err));
    fetch(`/api/family/iep/${learnerId}/documents`, { headers })
      .then(r => r.json()).then(setDocuments)
      .catch((err) => console.error("Failed to fetch IEP documents:", err));
  }, [accessToken, learnerId]);

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch(`/api/family/iep/${learnerId}/report`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setReport(await res.json());
        setActiveTab("report");
      }
    } catch (err) {
      console.error("Failed to generate IEP report:", err);
    }
    setGeneratingReport(false);
  };

  if (loading || !user) return null;

  const TREND_ICONS: Record<string, string> = { improving: "📈", stable: "➡️", declining: "📉" };
  const TREND_COLORS: Record<string, string> = {
    improving: "text-green-600", stable: "text-slate-500", declining: "text-red-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/parent")}
            className="text-sm text-slate-500 hover:text-primary font-semibold">Back to Dashboard</button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">IEP Goal Tracking</h1>
            <p className="text-slate-500 mt-1">Track progress toward Individualized Education Program goals</p>
          </div>
          <div className="flex gap-3">
            {progress && (
              <div className="text-center px-4 py-2 rounded-xl bg-purple-50">
                <div className="text-2xl font-bold text-primary">{progress.activeGoals}</div>
                <div className="text-xs text-slate-500 font-semibold">Active Goals</div>
              </div>
            )}
            <button onClick={generateReport} disabled={generatingReport}
              className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50 text-sm">
              {generatingReport ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-1">
          {(["goals", "documents", "report"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === tab ? "bg-white border border-b-white text-primary -mb-[1px]" : "text-slate-400 hover:text-slate-600"}`}>
              {tab === "goals" ? "Goals" : tab === "documents" ? "Documents" : "Report"}
            </button>
          ))}
        </div>

        {activeTab === "goals" && (
          <div className="space-y-4">
            {!progress || progress.goals.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-3">🎯</div>
                <p className="text-slate-500 font-semibold">No IEP goals configured yet. Upload an IEP document to get started.</p>
              </div>
            ) : (
              progress.goals.map(goal => (
                <div key={goal.goalId} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {goal.domain && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-primary font-bold">{goal.domain}</span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          goal.status === "active" ? "bg-blue-100 text-blue-700" :
                          goal.status === "met" ? "bg-green-100 text-green-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>{goal.status}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-semibold leading-relaxed">{goal.goalText}</p>
                    </div>
                    <div className={`flex items-center gap-1 ml-4 ${TREND_COLORS[goal.trend]}`}>
                      <span>{TREND_ICONS[goal.trend]}</span>
                      <span className="text-sm font-bold capitalize">{goal.trend}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-400 font-semibold">Baseline</div>
                      <div className="font-bold text-slate-700">{goal.baseline || "N/A"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-400 font-semibold">Current</div>
                      <div className="font-bold text-primary">{goal.currentValue}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-xs text-slate-400 font-semibold">Target</div>
                      <div className="font-bold text-green-600">{goal.targetCriteria || "N/A"}</div>
                    </div>
                  </div>

                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${goal.progressPercent}%`,
                        backgroundColor: goal.trend === "declining" ? "#EF4444" : goal.progressPercent >= 80 ? "#10B981" : "#6C5CE7",
                      }} />
                  </div>
                  <div className="text-right text-xs font-bold mt-1"
                    style={{
                      color: goal.trend === "declining" ? "#EF4444" : goal.progressPercent >= 80 ? "#10B981" : "#6C5CE7",
                    }}>
                    {goal.progressPercent}%
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-3">📄</div>
                <p className="text-slate-500 font-semibold">No IEP documents uploaded yet.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                      IEP
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{doc.fileName}</div>
                      <div className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                    doc.status === "parsed" ? "bg-green-100 text-green-700" :
                    doc.status === "uploaded" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>{doc.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            {!report ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📊</div>
                <p className="text-slate-500 font-semibold">Click "Generate Report" to create an IEP progress report.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-heading font-bold text-slate-900">{report.title}</h2>
                  <p className="text-sm text-slate-400 mt-1">Generated {new Date(report.generatedAt).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-purple-50 text-center">
                    <div className="text-2xl font-bold text-primary">{report.summary.totalGoals}</div>
                    <div className="text-xs text-slate-500 font-semibold">Total Goals</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 text-center">
                    <div className="text-2xl font-bold text-blue-600">{report.summary.activeGoals}</div>
                    <div className="text-xs text-slate-500 font-semibold">Active</div>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 text-center">
                    <div className="text-2xl font-bold text-green-600">{report.summary.metGoals}</div>
                    <div className="text-xs text-slate-500 font-semibold">Met</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-center">
                    <div className="text-2xl font-bold text-amber-600">{report.summary.averageProgress}%</div>
                    <div className="text-xs text-slate-500 font-semibold">Avg Progress</div>
                  </div>
                </div>

                {report.learner && (
                  <div className="p-4 rounded-xl bg-slate-50">
                    <h3 className="font-heading font-bold text-slate-800 mb-2">Learner Profile</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="font-bold text-slate-500">Name:</span> {report.learner.name}</div>
                      <div><span className="font-bold text-slate-500">Grade:</span> {report.learner.gradeLevel || "N/A"}</div>
                      <div><span className="font-bold text-slate-500">Functioning Level:</span> {report.learner.functioningLevel || "N/A"}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-heading font-bold text-lg text-slate-800">Goal-by-Goal Analysis</h3>
                  {report.goals.map((g: ReportGoal, i: number) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        {g.domain && <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-primary font-bold">{g.domain}</span>}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          g.status === "active" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>{g.status}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-semibold mb-2">{g.goalText}</p>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${g.progressPercent}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Baseline: {g.baseline || "N/A"}</span>
                        <span className="font-bold text-primary">{g.progressPercent}%</span>
                        <span>Target: {g.target || "N/A"}</span>
                      </div>
                      {g.evidence && <p className="text-xs text-slate-400 mt-2 italic">{g.evidence}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
