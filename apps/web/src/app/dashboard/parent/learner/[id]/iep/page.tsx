"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Target, FileText, BarChart3, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { IconWell } from "@/components/discovery/_vi";

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
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [progress, setProgress] = useState<IepProgress | null>(null);
  const [documents, setDocuments] = useState<IepDocument[]>([]);
  const [report, setReport] = useState<IepReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<"goals" | "documents" | "motor" | "report">("goals");
  const [motorProgress, setMotorProgress] = useState<null | {
    totalMotorGoals: number;
    averageMastery: number;
    categories: { id: string; label: string; goalCount: number; averageMastery: number; trend: "improving" | "stable" | "declining" }[];
  }>(null);
  const td = useTranslations("dape");

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    const headers = { Authorization: `Bearer ${accessToken}` };

    fetch(`/api/family/iep/${learnerId}/progress`, { headers })
      .then(r => r.json()).then(setProgress)
      .catch((err) => console.error("Failed to fetch IEP progress:", err));
    fetch(`/api/family/iep/${learnerId}/documents`, { headers })
      .then(r => r.json()).then(setDocuments)
      .catch((err) => console.error("Failed to fetch IEP documents:", err));
    fetch(`/api/family/iep/${learnerId}/dape/progress`, { headers })
      .then(r => r.ok ? r.json() : null).then((d) => { if (d) setMotorProgress(d); })
      .catch((err) => console.error("Failed to fetch DAPE progress:", err));
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

  const TREND_ICONS: Record<string, React.ReactNode> = {
    improving: <TrendingUp className="w-4 h-4" />,
    stable: <Minus className="w-4 h-4" />,
    declining: <TrendingDown className="w-4 h-4" />,
  };
  const TREND_COLORS: Record<string, string> = {
    improving: "text-[hsl(var(--visual-science))]",
    stable: "vi-text-muted",
    declining: "text-[hsl(var(--visual-math))]",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold vi-text">{t("iep_tracking")}</h1>
          <p className="vi-text-muted mt-1">{t("iep_tracking_desc")}</p>
        </div>
        <div className="flex gap-3">
          {progress && (
            <div className="text-center px-4 py-2 rounded-xl bg-[hsl(var(--visual-primary)/0.12)]">
              <div className="text-2xl font-bold text-[hsl(var(--visual-primary))]">{progress.activeGoals}</div>
              <div className="text-xs vi-text-muted font-semibold">{t("active_goals")}</div>
            </div>
          )}
          <button onClick={generateReport} disabled={generatingReport}
            style={{ minHeight: 44 }}
            className="px-5 py-2.5 rounded-full bg-[hsl(var(--visual-primary))] text-white font-bold hover:bg-[hsl(var(--visual-primary)/0.9)] transition disabled:opacity-50 text-sm">
            {generatingReport ? t("generating") : t("generate_report")}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b vi-border pb-1">
        {(["goals", "documents", "motor", "report"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === tab ? "bg-[hsl(var(--visual-surface))] border vi-border border-b-[hsl(var(--visual-surface))] text-[hsl(var(--visual-primary))] -mb-[1px]" : "vi-text-muted hover:vi-text"}`}>
            {tab === "goals" ? t("goals") : tab === "documents" ? t("documents") : tab === "motor" ? td("motor_progress") : t("report")}
          </button>
        ))}
      </div>

      {activeTab === "goals" && (
        <div className="space-y-4">
          {!progress || progress.goals.length === 0 ? (
            <div className="vi-card p-12 text-center">
              <div className="flex justify-center mb-3"><IconWell color="science"><Target className="w-7 h-7" /></IconWell></div>
              <p className="vi-text-muted font-semibold">{t("no_iep_goals")}</p>
            </div>
          ) : (
            progress.goals.map(goal => (
              <div key={goal.goalId} className="vi-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {goal.domain && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] font-bold">{goal.domain}</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                        goal.status === "active" ? "bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" :
                        goal.status === "met" ? "bg-[hsl(var(--visual-science)/0.12)] text-[hsl(var(--visual-science))]" :
                        "vi-surface-soft vi-text-muted"
                      }`}>{goal.status}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold leading-relaxed">{goal.goalText}</p>
                  </div>
                  <div className={`flex items-center gap-1 ml-4 ${TREND_COLORS[goal.trend]}`}>
                    {TREND_ICONS[goal.trend]}
                    <span className="text-sm font-bold capitalize">{goal.trend}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div className="p-2 rounded-lg vi-surface-soft">
                    <div className="text-xs vi-text-muted font-semibold">{t("baseline")}</div>
                    <div className="font-bold text-slate-800">{goal.baseline || t("na")}</div>
                  </div>
                  <div className="p-2 rounded-lg vi-surface-soft">
                    <div className="text-xs vi-text-muted font-semibold">{t("current_label") || "Current"}</div>
                    <div className="font-bold text-[hsl(var(--visual-primary))]">{goal.currentValue}%</div>
                  </div>
                  <div className="p-2 rounded-lg vi-surface-soft">
                    <div className="text-xs vi-text-muted font-semibold">{t("target")}</div>
                    <div className="font-bold text-[hsl(var(--visual-science))]">{goal.targetCriteria || t("na")}</div>
                  </div>
                </div>

                <div className="h-4 bg-[hsl(var(--visual-surface-soft))] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${goal.progressPercent}%`,
                      backgroundColor: goal.trend === "declining" ? "hsl(var(--visual-math))" : goal.progressPercent >= 80 ? "hsl(var(--visual-science))" : "hsl(var(--visual-primary))",
                    }} />
                </div>
                <div className="text-right text-xs font-bold mt-1"
                  style={{
                    color: goal.trend === "declining" ? "hsl(var(--visual-math))" : goal.progressPercent >= 80 ? "hsl(var(--visual-science))" : "hsl(var(--visual-primary))",
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
            <div className="vi-card p-12 text-center">
              <div className="flex justify-center mb-3"><IconWell color="reading"><FileText className="w-7 h-7" /></IconWell></div>
              <p className="vi-text-muted font-semibold">{t("no_iep_documents")}</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="vi-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconWell color="reading" size="sm"><FileText className="w-5 h-5" /></IconWell>
                  <div>
                    <div className="font-bold text-slate-800">{doc.fileName}</div>
                    <div className="text-xs vi-text-muted">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                  doc.status === "parsed" ? "bg-[hsl(var(--visual-science)/0.12)] text-[hsl(var(--visual-science))]" :
                  doc.status === "uploaded" ? "bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" :
                  "vi-surface-soft vi-text-muted"
                }`}>{doc.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "motor" && (
        <div className="space-y-4">
          {!motorProgress || motorProgress.totalMotorGoals === 0 ? (
            <div className="vi-card p-12 text-center">
              <div className="flex justify-center mb-3"><IconWell color="science"><Activity className="w-7 h-7" /></IconWell></div>
              <p className="vi-text-muted font-semibold">{td("no_motor_goals")}</p>
              <p className="vi-text-muted text-sm mt-2">{td("no_motor_goals_help")}</p>
            </div>
          ) : (
            <>
              <div className="vi-card p-6">
                <h2 className="text-lg font-heading font-bold vi-text mb-1">{td("motor_progress_overview")}</h2>
                <p className="vi-text-muted text-sm mb-4">{td("motor_progress_desc")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[hsl(var(--visual-primary)/0.12)] text-center">
                    <div className="text-2xl font-bold text-[hsl(var(--visual-primary))]">{motorProgress.totalMotorGoals}</div>
                    <div className="text-xs vi-text-muted font-semibold">{td("total_motor_goals")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--visual-science)/0.12)] text-center">
                    <div className="text-2xl font-bold text-[hsl(var(--visual-science))]">{motorProgress.averageMastery}%</div>
                    <div className="text-xs vi-text-muted font-semibold">{td("avg_mastery")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--visual-reading)/0.12)] text-center">
                    <div className="text-2xl font-bold text-[hsl(var(--visual-reading))]">{motorProgress.categories.length}</div>
                    <div className="text-xs vi-text-muted font-semibold">{td("skill_areas")}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--visual-sel)/0.16)] text-center">
                    <div className="text-2xl font-bold text-[hsl(var(--visual-sel))]">{motorProgress.categories.filter(c => c.trend === "improving").length}</div>
                    <div className="text-xs vi-text-muted font-semibold">{td("improving")}</div>
                  </div>
                </div>
              </div>
              {motorProgress.categories.map((c) => (
                <div key={c.id} className="vi-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-800">{c.label}</p>
                      <p className="text-xs vi-text-muted">{td("n_goals", { count: c.goalCount })}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${TREND_COLORS[c.trend]}`}>
                      {TREND_ICONS[c.trend]}
                      <span className="text-sm font-bold capitalize">{td(`trend_${c.trend}`)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-[hsl(var(--visual-surface-soft))] rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${c.averageMastery}%`,
                        backgroundColor: c.trend === "declining" ? "hsl(var(--visual-math))" : c.averageMastery >= 70 ? "hsl(var(--visual-science))" : "hsl(var(--visual-primary))",
                      }} />
                  </div>
                  <div className="text-right text-xs font-bold mt-1 vi-text-muted">{c.averageMastery}%</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === "report" && (
        <div className="vi-card p-8">
          {!report ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3"><IconWell color="primary"><BarChart3 className="w-7 h-7" /></IconWell></div>
              <p className="vi-text-muted font-semibold">{t("generate_report_prompt")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b vi-border pb-4">
                <h2 className="text-2xl font-heading font-bold vi-text">{report.title}</h2>
                <p className="text-sm vi-text-muted mt-1">{t("generated_at", { date: new Date(report.generatedAt).toLocaleString() })}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-[hsl(var(--visual-primary)/0.12)] text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--visual-primary))]">{report.summary.totalGoals}</div>
                  <div className="text-xs vi-text-muted font-semibold">{t("total_goals_label")}</div>
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--visual-reading)/0.12)] text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--visual-reading))]">{report.summary.activeGoals}</div>
                  <div className="text-xs vi-text-muted font-semibold">{t("active_tab_label")}</div>
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--visual-science)/0.12)] text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--visual-science))]">{report.summary.metGoals}</div>
                  <div className="text-xs vi-text-muted font-semibold">{t("met_label")}</div>
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--visual-sel)/0.16)] text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--visual-sel))]">{report.summary.averageProgress}%</div>
                  <div className="text-xs vi-text-muted font-semibold">{t("avg_progress")}</div>
                </div>
              </div>

              {report.learner && (
                <div className="p-4 rounded-xl vi-surface-soft border vi-border">
                  <h3 className="font-heading font-bold text-slate-800 mb-2">{t("learner_profile_title")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-bold vi-text-muted">{t("full_name")}:</span> {report.learner.name}</div>
                    <div><span className="font-bold vi-text-muted">{t("grade")}:</span> {report.learner.gradeLevel || t("na")}</div>
                    <div><span className="font-bold vi-text-muted">{t("functioning_level")}:</span> {report.learner.functioningLevel || t("na")}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-heading font-bold text-lg text-slate-800">{t("goal_analysis")}</h3>
                {report.goals.map((g: ReportGoal, i: number) => (
                  <div key={i} className="p-4 rounded-xl border vi-border">
                    <div className="flex items-center gap-2 mb-2">
                      {g.domain && <span className="px-2 py-0.5 text-xs rounded-full bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] font-bold">{g.domain}</span>}
                      <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                        g.status === "active" ? "bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" : "bg-[hsl(var(--visual-science)/0.12)] text-[hsl(var(--visual-science))]"
                      }`}>{g.status}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-semibold mb-2">{g.goalText}</p>
                    <div className="h-3 bg-[hsl(var(--visual-surface-soft))] rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-[hsl(var(--visual-primary))] transition-all" style={{ width: `${g.progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs vi-text-muted">
                      <span>{t("baseline")}: {g.baseline || t("na")}</span>
                      <span className="font-bold text-[hsl(var(--visual-primary))]">{g.progressPercent}%</span>
                      <span>{t("target")}: {g.target || t("na")}</span>
                    </div>
                    {g.evidence && <p className="text-xs vi-text-muted mt-2 italic">{g.evidence}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
