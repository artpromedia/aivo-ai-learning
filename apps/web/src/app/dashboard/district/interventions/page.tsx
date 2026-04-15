"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Intervention {
  id: string;
  type: string;
  tier: number;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt: string;
  learnerId: string;
  learnerName: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function DistrictInterventionsPage() {
  const { accessToken } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/district/interventions${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : { interventions: [] })
      .then((data) => setInterventions(data.interventions || []))
      .catch(() => setInterventions([]))
      .finally(() => setLoading(false));
  }, [accessToken, statusFilter]);

  const tierCounts = [1, 2, 3].map((tier) => ({
    tier,
    count: interventions.filter((i) => i.tier === tier).length,
  }));

  return (
    <div className="p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Interventions</h1>
        <p className="text-sm text-slate-500 mt-1">Track academic and behavioral interventions across the district.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {tierCounts.map(({ tier, count }) => (
          <div key={tier} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase">Tier {tier}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 focus:border-violet-400 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-slate-400">{interventions.length} interventions</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 font-semibold">Learner</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Start</th>
                <th className="px-5 py-3 font-semibold">End</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((iv) => (
                <tr key={iv.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/district/learners/${iv.learnerId}`} className="font-medium text-slate-900 hover:text-violet-600">
                      {iv.learnerName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{iv.type}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">Tier {iv.tier}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${STATUS_COLORS[iv.status] || "bg-slate-100 text-slate-500"}`}>
                      {iv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{iv.startDate || "—"}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{iv.endDate || "Ongoing"}</td>
                </tr>
              ))}
              {interventions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No interventions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
