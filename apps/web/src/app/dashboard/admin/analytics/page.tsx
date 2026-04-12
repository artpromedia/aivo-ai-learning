"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface EngagementMetrics {
  totalSessions: number;
  totalDuration: number;
  completionRate: number;
  avgSessionLength: number;
}

interface MasteryMetrics {
  subjects: { subject: string; avgMastery: number; growth: number }[];
}

interface Cohort {
  level: string;
  count: number;
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [mastery, setMastery] = useState<MasteryMetrics | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      fetch("/api/research/metrics/engagement", { headers })
        .then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/research/metrics/mastery", { headers })
        .then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/research/cohorts", { headers })
        .then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([eng, mast, coh]) => {
      if (eng) {
        setEngagement({
          totalSessions: eng.totalSessions ?? 0,
          totalDuration: 0,
          completionRate: eng.completionRate ?? 0,
          avgSessionLength: eng.avgSessionDurationMin ?? 0,
        });
      }
      if (mast?.subjectBreakdown) {
        const subjects = Object.entries(mast.subjectBreakdown).map(([subject, data]: [string, any]) => ({
          subject: subject.charAt(0).toUpperCase() + subject.slice(1),
          avgMastery: Math.round((data.avgMastery ?? 0) * 100),
          growth: Math.round((data.growth ?? 0) * 100),
        }));
        setMastery({ subjects });
      }
      if (coh?.cohorts) {
        setCohorts(coh.cohorts.map((c: any) => ({ level: c.name || c.id, count: c.count })));
      }
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const LEVEL_COLORS: Record<string, string> = {
    STANDARD: "#22C55E",
    SUPPORTED: "#3B82F6",
    LOW_VERBAL: "#F59E0B",
    NON_VERBAL: "#F97316",
    PRE_SYMBOLIC: "#EF4444",
  };

  const totalCohort = cohorts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Analytics & Research</h1>
          <p className="text-sm text-slate-500 mt-1">Platform-wide engagement metrics, mastery growth, and research data.</p>
        </div>
        <button
          onClick={() => {
            if (accessToken) {
              window.open(`/api/research/export/anonymized`, "_blank");
            }
          }}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
        >
          Export Anonymized Data
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 animate-pulse">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Sessions", value: engagement?.totalSessions ?? "—", icon: "📚" },
              { label: "Avg Session Length", value: engagement?.avgSessionLength ? `${Math.round(engagement.avgSessionLength)}min` : "—", icon: "⏱️" },
              { label: "Completion Rate", value: engagement?.completionRate ? `${Math.round(engagement.completionRate * 100)}%` : "—", icon: "✅" },
              { label: "Total Duration", value: engagement?.totalDuration ? `${Math.round(engagement.totalDuration / 60)}h` : "—", icon: "📊" },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{m.icon}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Functioning Level Distribution</h2>
              {cohorts.length > 0 ? (
                <div className="space-y-4">
                  {cohorts.map((c) => {
                    const pct = totalCohort > 0 ? Math.round((c.count / totalCohort) * 100) : 0;
                    const color = LEVEL_COLORS[c.level] || "#94A3B8";
                    return (
                      <div key={c.level}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">{c.level.replace(/_/g, " ")}</span>
                          <span className="text-sm font-bold text-slate-900">{c.count} ({pct}%)</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No cohort data available</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Mastery by Subject</h2>
              {mastery?.subjects && mastery.subjects.length > 0 ? (
                <div className="space-y-4">
                  {mastery.subjects.map((s) => (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700">{s.subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{Math.round(s.avgMastery)}%</span>
                          {s.growth > 0 && <span className="text-xs text-green-600">+{s.growth}%</span>}
                        </div>
                      </div>
                      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: `${s.avgMastery}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No mastery data available yet</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <h2 className="font-heading font-bold text-lg mb-2">Research Data Export</h2>
            <p className="text-sm text-slate-400 mb-4">Export anonymized learner data for research purposes. All data is de-identified per FERPA/COPPA requirements.</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-semibold">Anonymized Profiles</p>
                <p className="text-xs text-slate-400 mt-1">Functioning levels, mastery scores, engagement patterns</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-semibold">Session Analytics</p>
                <p className="text-xs text-slate-400 mt-1">Duration, completion, difficulty progression</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-semibold">Intervention Outcomes</p>
                <p className="text-xs text-slate-400 mt-1">Accommodation effectiveness, mastery growth</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
