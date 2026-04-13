"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function CustomerCareDashboard() {
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

  const ticketMetrics = {
    open: 23,
    inProgress: 15,
    awaitingResponse: 8,
    resolved: 142,
    avgFirstResponse: "2.4h",
    avgResolution: "18h",
    csat: 94,
    nps: 72,
  };

  const recentTickets = [
    { id: "T-1042", subject: "Brain clone not completing after baseline", priority: "high", status: "in_progress", user: "Sarah M.", age: "3h", category: "Technical" },
    { id: "T-1041", subject: "Can't access learner dashboard after approval", priority: "high", status: "open", user: "James K.", age: "5h", category: "Access" },
    { id: "T-1040", subject: "How to add a second learner profile", priority: "medium", status: "awaiting_response", user: "Maria L.", age: "1d", category: "How-to" },
    { id: "T-1039", subject: "Subscription billing date question", priority: "low", status: "awaiting_response", user: "David P.", age: "1d", category: "Billing" },
    { id: "T-1038", subject: "Tutor session frozen mid-lesson", priority: "high", status: "in_progress", user: "Angela W.", age: "6h", category: "Technical" },
    { id: "T-1037", subject: "Request to export child's data", priority: "medium", status: "in_progress", user: "Tom R.", age: "2d", category: "Compliance" },
    { id: "T-1036", subject: "IEP upload not processing", priority: "medium", status: "open", user: "Linda C.", age: "4h", category: "Technical" },
  ];

  const categoryBreakdown = [
    { category: "Technical", count: 45, pct: 32 },
    { category: "How-to / Onboarding", count: 38, pct: 27 },
    { category: "Billing", count: 25, pct: 18 },
    { category: "Access / Auth", count: 18, pct: 13 },
    { category: "Compliance / Data", count: 8, pct: 6 },
    { category: "Feature Request", count: 6, pct: 4 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("overview")}</h1>
        <p className="text-sm text-slate-500 mt-1">Ticket management, customer satisfaction, and response metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open Tickets", value: ticketMetrics.open, icon: "📬", color: "from-red-500 to-red-600" },
          { label: "In Progress", value: ticketMetrics.inProgress, icon: "🔄", color: "from-amber-500 to-amber-600" },
          { label: "Resolved (30d)", value: ticketMetrics.resolved, icon: "✅", color: "from-green-500 to-green-600" },
          { label: "CSAT Score", value: `${ticketMetrics.csat}%`, icon: "⭐", color: "from-purple-500 to-purple-600" },
        ].map((m) => (
          <div key={m.label} className={`bg-gradient-to-br ${m.color} rounded-2xl p-5 text-white`}>
            <span className="text-2xl">{m.icon}</span>
            <p className="text-3xl font-bold mt-2">{m.value}</p>
            <p className="text-sm opacity-80 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{ticketMetrics.avgFirstResponse}</p>
          <p className="text-xs text-slate-500 font-semibold">Avg First Response</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{ticketMetrics.avgResolution}</p>
          <p className="text-xs text-slate-500 font-semibold">Avg Resolution Time</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{ticketMetrics.nps}</p>
          <p className="text-xs text-slate-500 font-semibold">NPS Score</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-900">{ticketMetrics.awaitingResponse}</p>
          <p className="text-xs text-slate-500 font-semibold">Awaiting Response</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-slate-900">{tc("details")}</h2>
          <span className="text-xs text-slate-400">{recentTickets.length} showing</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 font-semibold">ID</th>
              <th className="px-5 py-3 font-semibold">Subject</th>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">{tc("status")}</th>
              <th className="px-5 py-3 font-semibold">Age</th>
            </tr>
          </thead>
          <tbody>
            {recentTickets.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 font-mono text-xs text-slate-400">{t.id}</td>
                <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">{t.subject}</td>
                <td className="px-5 py-3 text-slate-500">{t.user}</td>
                <td className="px-5 py-3"><span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-semibold">{t.category}</span></td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>{t.priority}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    t.status === "open" ? "bg-blue-100 text-blue-700" : t.status === "in_progress" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                  }`}>{t.status.replace(/_/g, " ")}</span>
                </td>
                <td className="px-5 py-3 text-slate-400">{t.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Ticket Categories</h2>
        <div className="space-y-3">
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-700 w-44">{cat.category}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${cat.pct}%` }} />
              </div>
              <span className="text-sm font-bold text-slate-700 w-10 text-right">{cat.count}</span>
              <span className="text-xs text-slate-400 w-10 text-right">{cat.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
