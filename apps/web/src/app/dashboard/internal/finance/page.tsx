"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

export default function FinanceDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [accessToken]);

  const revenueMetrics = [
    { label: "Monthly Recurring Revenue", value: "$48,200", trend: "+18%", icon: "💰" },
    { label: "Annual Run Rate", value: "$578,400", trend: "+22%", icon: "📈" },
    { label: "Avg Revenue per User", value: "$24.50", trend: "+$2.30", icon: "👤" },
    { label: "Churn Rate", value: "3.2%", trend: "-0.8pp", icon: "📉" },
  ];

  const subscriptionBreakdown = [
    { plan: "Free Trial", count: 245, revenue: "$0", pct: 0, color: "bg-slate-300" },
    { plan: "Family ($29/mo)", count: 680, revenue: "$19,720", pct: 41, color: "bg-purple-400" },
    { plan: "Family Plus ($49/mo)", count: 420, revenue: "$20,580", pct: 43, color: "bg-cyan-400" },
    { plan: "Enterprise", count: 12, revenue: "$7,900", pct: 16, color: "bg-amber-400" },
  ];

  const paymentHealth = [
    { metric: "Successful Payments (30d)", value: "1,142", status: "good" },
    { metric: "Failed Payments", value: "23", status: "warning" },
    { metric: "Dunning Recovery Rate", value: "68%", status: "good" },
    { metric: "Refunds Issued", value: "8", status: "neutral" },
    { metric: "Outstanding Invoices", value: "5", status: "warning" },
    { metric: "Average Days to Pay", value: "2.3d", status: "good" },
  ];

  const recentTransactions = [
    { date: "Today", description: "Family Plus — Annual Renewal", amount: "$588.00", status: "completed", method: "Stripe" },
    { date: "Today", description: "Enterprise — Metro ISD Q2", amount: "$18,750.00", status: "completed", method: "Invoice" },
    { date: "Yesterday", description: "Family — Monthly Subscription", amount: "$29.00", status: "completed", method: "Stripe" },
    { date: "Yesterday", description: "Family Plus — Monthly", amount: "$49.00", status: "failed", method: "Stripe" },
    { date: "2d ago", description: "Family — Monthly Subscription", amount: "$29.00", status: "refunded", method: "Stripe" },
    { date: "3d ago", description: "Enterprise — Fairfax Schools", amount: "$25,000.00", status: "pending", method: "Invoice" },
  ];

  const costBreakdown = [
    { category: "AI / LLM API Costs", amount: "$8,400", pct: 42 },
    { category: "Infrastructure (Hetzner)", amount: "$3,200", pct: 16 },
    { category: "Database & Storage", amount: "$1,800", pct: 9 },
    { category: "Payment Processing Fees", amount: "$1,450", pct: 7 },
    { category: "Third-party Services", amount: "$2,100", pct: 10 },
    { category: "Operations / Other", amount: "$3,050", pct: 16 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Finance Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Revenue tracking, subscription analytics, and financial health.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {revenueMetrics.map((m) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Revenue by Plan</h2>
          <div className="space-y-4">
            {subscriptionBreakdown.map((plan) => (
              <div key={plan.plan}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{plan.plan}</span>
                    <span className="text-xs text-slate-400">{plan.count} subscribers</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{plan.revenue}/mo</span>
                </div>
                <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full ${plan.color} transition-all`} style={{ width: `${plan.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Cost Breakdown (Monthly)</h2>
          <div className="space-y-3">
            {costBreakdown.map((cost) => (
              <div key={cost.category} className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700 w-48">{cost.category}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${cost.pct}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-900 w-20 text-right">{cost.amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-semibold text-slate-700">Total Monthly Costs</span>
            <span className="text-sm font-bold text-slate-900">$20,000</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">Gross Margin</span>
            <span className="text-xs font-bold text-green-600">58.5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {paymentHealth.map((ph) => (
          <div key={ph.metric} className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <p className={`text-xl font-bold ${ph.status === "good" ? "text-green-700" : ph.status === "warning" ? "text-amber-700" : "text-slate-700"}`}>
              {ph.value}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">{ph.metric}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-heading font-bold text-lg text-slate-900">Recent Transactions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Method</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                <td className="px-5 py-3 text-slate-400">{tx.date}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{tx.description}</td>
                <td className="px-5 py-3 font-semibold text-slate-900">{tx.amount}</td>
                <td className="px-5 py-3 text-slate-500">{tx.method}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    tx.status === "completed" ? "bg-green-100 text-green-700" :
                    tx.status === "pending" ? "bg-amber-100 text-amber-700" :
                    tx.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{tx.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
