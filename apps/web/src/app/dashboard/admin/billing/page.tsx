"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";

export default function AdminBillingPage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [accessToken]);

  const plans = [
    { name: "Free Trial", price: "$0", period: "14 days", features: ["1 learner", "3 AI tutors", "Basic assessments", "Limited sessions"], color: "from-slate-500 to-slate-600" },
    { name: "Family", price: "$29", period: "/month", features: ["Up to 3 learners", "All 14 AI tutors", "Full assessments", "Brain clone", "Recommendations"], color: "from-purple-500 to-purple-600" },
    { name: "Family Plus", price: "$49", period: "/month", features: ["Up to 6 learners", "All 14 AI tutors", "IEP integration", "Priority support", "Learning team"], color: "from-cyan-500 to-cyan-600" },
    { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited learners", "District management", "SSO/SAML", "Custom branding", "Dedicated support", "API access"], color: "from-amber-500 to-amber-600" },
  ];

  const billingMetrics = [
    { label: "Total Tenants", value: stats?.totalTenants ?? "—", icon: "🏢" },
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "👤" },
    { label: "Active Learners", value: stats?.totalLearners ?? "—", icon: "🎓" },
    { label: "Payment Gateways", value: "2", icon: "💳" },
  ];

  const gateways = [
    { name: "Stripe", status: "active", desc: "Primary payment processor for credit/debit cards", icon: "💳" },
    { name: "M-Pesa", status: "configured", desc: "Mobile money for East Africa markets", icon: "📱" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">Billing & Licensing</h1>
        <p className="text-sm text-slate-500 mt-1">Manage subscription plans, payment gateways, and licensing.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {billingMetrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center">
            <span className="text-2xl">{m.icon}</span>
            <p className="text-2xl font-bold text-slate-900 mt-2">{m.value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${plan.color} p-4 text-white`}>
                <p className="font-heading font-bold text-lg">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-sm opacity-80">{plan.period}</span>}
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-green-500 text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Payment Gateways</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gw) => (
            <div key={gw.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gw.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{gw.name}</p>
                  <p className="text-xs text-slate-400">{gw.desc}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                gw.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}>
                {gw.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Usage Metering</h2>
        <p className="text-sm text-slate-500 mb-4">Track AI API calls, storage, and compute usage per tenant for billing purposes.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "AI API Calls", value: "—", desc: "Total LLM inference requests" },
            { label: "Storage", value: "—", desc: "Brain states, assessments, media" },
            { label: "Sessions", value: "—", desc: "Total learning sessions completed" },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xl font-bold text-slate-900">{m.value}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{m.label}</p>
              <p className="text-xs text-slate-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
