"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function SalesDashboard() {
  const { accessToken } = useAuth();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [accessToken]);

  const pipeline = [
    { stage: "Lead", count: 45, value: "$67,500", color: "bg-slate-200" },
    { stage: "Qualified", count: 28, value: "$42,000", color: "bg-blue-200" },
    { stage: "Demo Scheduled", count: 15, value: "$22,500", color: "bg-purple-200" },
    { stage: "Proposal Sent", count: 8, value: "$12,000", color: "bg-amber-200" },
    { stage: "Negotiation", count: 5, value: "$7,500", color: "bg-orange-200" },
    { stage: "Closed Won", count: 3, value: "$4,500", color: "bg-green-200" },
  ];

  const recentDeals = [
    { name: "Fairfax County Schools", type: "B2B_DISTRICT", seats: 5000, value: "$125,000", stage: "Proposal Sent", daysInStage: 3 },
    { name: "Springfield Elementary", type: "B2B_SCHOOL", seats: 200, value: "$6,000", stage: "Demo Scheduled", daysInStage: 1 },
    { name: "Learning Tree Academy", type: "B2B_SCHOOL", seats: 350, value: "$10,500", stage: "Negotiation", daysInStage: 7 },
    { name: "Metro ISD", type: "B2B_DISTRICT", seats: 12000, value: "$300,000", stage: "Qualified", daysInStage: 5 },
    { name: "Horizon Charter Network", type: "B2B_DISTRICT", seats: 3000, value: "$75,000", stage: "Lead", daysInStage: 2 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("overview")}</h1>
        <p className="text-sm text-slate-500 mt-1">Pipeline management, deal tracking, and revenue forecasting.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tenants", value: stats?.totalTenants ?? "—", icon: "🏢", trend: "+12% MoM" },
          { label: "Active Learners", value: stats?.totalLearners ?? "—", icon: "🎓", trend: "+8% MoM" },
          { label: "Pipeline Value", value: "$155,500", icon: "💰", trend: "+23% QoQ" },
          { label: "Win Rate", value: "32%", icon: "🎯", trend: "+5pp" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs text-green-600 font-semibold">{m.trend}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("overview")}</h2>
        <div className="space-y-3">
          {pipeline.map((stage) => {
            const maxCount = Math.max(...pipeline.map((s) => s.count));
            const pct = (stage.count / maxCount) * 100;
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-700 w-36">{stage.stage}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div className={`h-full rounded-full ${stage.color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 w-10 text-right">{stage.count}</span>
                <span className="text-xs text-slate-400 w-20 text-right">{stage.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-heading font-bold text-lg text-slate-900">Active Deals</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 font-semibold">Account</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Seats</th>
              <th className="px-5 py-3 font-semibold">Value</th>
              <th className="px-5 py-3 font-semibold">Stage</th>
              <th className="px-5 py-3 font-semibold">Days</th>
            </tr>
          </thead>
          <tbody>
            {recentDeals.map((deal) => (
              <tr key={deal.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-medium text-slate-900">{deal.name}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    deal.type === "B2B_DISTRICT" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {deal.type === "B2B_DISTRICT" ? "District" : "School"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{deal.seats.toLocaleString()}</td>
                <td className="px-5 py-3 font-semibold text-slate-900">{deal.value}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 text-xs rounded-full font-semibold bg-purple-100 text-purple-700">{deal.stage}</span>
                </td>
                <td className="px-5 py-3 text-slate-400">{deal.daysInStage}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold mt-2">$48,200</p>
          <p className="text-xs mt-1 opacity-70">+18% from last month</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">Annual Contract Value</p>
          <p className="text-3xl font-bold mt-2">$578,400</p>
          <p className="text-xs mt-1 opacity-70">Target: $750,000</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">Avg Deal Size</p>
          <p className="text-3xl font-bold mt-2">$31,000</p>
          <p className="text-xs mt-1 opacity-70">Enterprise segment</p>
        </div>
      </div>
    </div>
  );
}
