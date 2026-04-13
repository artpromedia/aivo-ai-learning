"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface RoleCount {
  role: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalTenants: number;
  roleCounts: RoleCount[];
}

interface Learner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
  createdAt: string;
}

function getRoleCount(roleCounts: RoleCount[], role: string): number {
  return roleCounts.find((r) => r.role === role)?.count ?? 0;
}

const FL_LEVELS = ["STANDARD", "SUPPORTED", "LOW_VERBAL", "NON_VERBAL", "PRE_SYMBOLIC"];
const FL_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  SUPPORTED: "Supported",
  LOW_VERBAL: "Low Verbal",
  NON_VERBAL: "Non-Verbal",
  PRE_SYMBOLIC: "Pre-Symbolic",
};

export default function DistrictAnalyticsPage() {
  const { accessToken } = useAuth();
  const t = useTranslations("districtAdmin");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<Stats | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      fetch("/api/admin/stats", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/learners", { headers }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([s, l]) => {
        setStats(s);
        setLearners(Array.isArray(l) ? l : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const flDistribution = FL_LEVELS.map((fl) => ({
    level: fl,
    label: FL_LABELS[fl],
    count: learners.filter((l) => l.functioningLevel === fl).length,
  }));

  const maxFL = Math.max(1, ...flDistribution.map((d) => d.count));
  const rc = stats?.roleCounts ?? [];

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("analytics")}</h1>
        <p className="text-sm text-slate-500 mt-1">District-wide performance metrics, functioning level distribution, and role breakdown.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total Learners" value={stats?.totalLearners ?? learners.length} icon="🎓" />
            <StatCard label="Teachers" value={getRoleCount(rc, "TEACHER")} icon="👩‍🏫" />
            <StatCard label="Therapists" value={getRoleCount(rc, "THERAPIST")} icon="🧠" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">{tc("total")}</h2>
            <div className="flex items-end gap-4 h-48">
              {flDistribution.map((d) => (
                <div key={d.level} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{d.count}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-violet-400 transition-all"
                    style={{ height: `${Math.max(8, (d.count / maxFL) * 100)}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium text-center">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-heading font-semibold text-slate-900 mb-3">Role Distribution</h2>
              <div className="space-y-3">
                {rc.map((r) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{r.role.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${Math.min(100, (r.count / Math.max(1, stats?.totalUsers ?? 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-8 text-right">{r.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-heading font-semibold text-slate-900 mb-3">Quick Insights</h2>
              <div className="space-y-4">
                <InsightCard icon="📊" title="Enrollment Growth" description="Track new student enrollments over time to identify trends." />
                <InsightCard icon="🏆" title="Mastery Tracking" description="Monitor domain mastery across all learners in your district." />
                <InsightCard icon="🔔" title="Intervention Alerts" description="Get notified when learners need additional support or accommodations." />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400 font-medium uppercase">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InsightCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
