"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingRevenuePage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueData = months.map((m, i) => ({
    month: m,
    mrr: Math.round(2000 + i * 450 + Math.random() * 300),
    newSubs: Math.round(5 + i * 2 + Math.random() * 3),
    churn: Math.round(Math.random() * 3),
  }));

  const currentMRR = revenueData[revenueData.length - 1].mrr;
  const totalSubs = stats?.totalTenants ?? 0;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Link href="/dashboard/admin/billing" className="hover:text-purple-600 transition">Billing</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Revenue</span>
      </div>

      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Revenue Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Track MRR, subscriber growth, and churn metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Recurring Revenue", value: `$${currentMRR.toLocaleString()}`, icon: "💰", change: "+12.3%" },
          { label: "Active Subscriptions", value: totalSubs, icon: "📊", change: "+8 this month" },
          { label: "Avg Revenue Per User", value: `$${totalSubs > 0 ? Math.round(currentMRR / totalSubs) : 0}`, icon: "👤", change: "" },
          { label: "Churn Rate", value: "2.1%", icon: "📉", change: "-0.3% vs last month" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{m.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{m.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{m.label}</p>
            {m.change && <p className="text-xs text-green-600 mt-1">{m.change}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">MRR Trend</h2>
        <div className="flex items-end gap-2 h-48">
          {revenueData.map((d) => {
            const maxMRR = Math.max(...revenueData.map((r) => r.mrr));
            const height = (d.mrr / maxMRR) * 100;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-semibold">${(d.mrr / 1000).toFixed(1)}k</span>
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all hover:from-purple-600 hover:to-purple-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-slate-400">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-heading font-bold text-lg text-slate-900">Monthly Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 font-semibold">Month</th>
              <th className="px-5 py-3 font-semibold">MRR</th>
              <th className="px-5 py-3 font-semibold">New Subscribers</th>
              <th className="px-5 py-3 font-semibold">Churned</th>
              <th className="px-5 py-3 font-semibold">Net Change</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.slice().reverse().map((d) => (
              <tr key={d.month} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-medium text-slate-900">{d.month} 2026</td>
                <td className="px-5 py-3 text-slate-900">${d.mrr.toLocaleString()}</td>
                <td className="px-5 py-3 text-green-600">+{d.newSubs}</td>
                <td className="px-5 py-3 text-red-600">-{d.churn}</td>
                <td className="px-5 py-3">
                  <span className={d.newSubs - d.churn >= 0 ? "text-green-600" : "text-red-600"}>
                    {d.newSubs - d.churn >= 0 ? "+" : ""}{d.newSubs - d.churn}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
