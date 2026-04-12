"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

interface Learner {
  id: string;
  name: string;
  functioningLevel: string | null;
  gradeLevel: string | null;
  createdAt: string;
}

interface Cohort {
  level: string;
  count: number;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  STANDARD: { label: "Standard", color: "text-green-700", bg: "bg-green-100", desc: "General education curriculum" },
  SUPPORTED: { label: "Supported", color: "text-blue-700", bg: "bg-blue-100", desc: "Modified with accommodations" },
  LOW_VERBAL: { label: "Low Verbal", color: "text-amber-700", bg: "bg-amber-100", desc: "Visual/picture-based supports" },
  NON_VERBAL: { label: "Non-Verbal", color: "text-orange-700", bg: "bg-orange-100", desc: "AAC & switch scanning" },
  PRE_SYMBOLIC: { label: "Pre-Symbolic", color: "text-red-700", bg: "bg-red-100", desc: "Sensory-based engagement" },
};

export default function AdminLearnersPage() {
  const { accessToken } = useAuth();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("ALL");

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      fetch("/api/admin/learners?limit=200", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => r.ok ? r.json() : []),
      fetch("/api/research/cohorts", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
    ]).then(([learnerData, cohortData]) => {
      setLearners(Array.isArray(learnerData) ? learnerData : []);
      setCohorts(Array.isArray(cohortData) ? cohortData : []);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = levelFilter === "ALL"
    ? learners
    : learners.filter((l) => l.functioningLevel === levelFilter);

  const levelCounts = Object.keys(LEVEL_CONFIG).reduce((acc, level) => {
    acc[level] = learners.filter((l) => l.functioningLevel === level).length;
    return acc;
  }, {} as Record<string, number>);

  const totalLearners = learners.length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Learner Management</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage all learner profiles across the platform.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
          const count = levelCounts[level] || 0;
          const pct = totalLearners > 0 ? Math.round((count / totalLearners) * 100) : 0;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(levelFilter === level ? "ALL" : level)}
              className={`p-4 rounded-2xl border transition text-left ${
                levelFilter === level ? "border-purple-300 bg-purple-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${config.bg} ${config.color}`}>{config.label}</span>
                <span className="text-lg font-bold text-slate-900">{count}</span>
              </div>
              <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${config.bg.replace("100", "400")}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{config.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-slate-900">
            {levelFilter === "ALL" ? "All Learners" : `${LEVEL_CONFIG[levelFilter]?.label} Learners`}
          </h2>
          <p className="text-sm text-slate-400">{filtered.length} learners</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 animate-pulse">Loading learners...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Functioning Level</th>
                <th className="px-5 py-3 font-semibold">Grade</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const lc = LEVEL_CONFIG[l.functioningLevel || ""] || { label: "N/A", color: "text-slate-500", bg: "bg-slate-100" };
                return (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">{l.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${lc.bg} ${lc.color}`}>{lc.label}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{l.gradeLevel || "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No learners found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
