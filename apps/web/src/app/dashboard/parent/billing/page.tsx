"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  priceLabel?: string;
  learnerLimit?: number;
  learnerMinimum?: number;
  features: string[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
}

interface Subscription {
  tenantId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  learners: number;
  tutorSessions: number;
  aiTokens: number;
  storageBytes: number;
}

export default function ParentBillingPage() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !user) return;

    fetch("/api/billing/plans")
      .then(r => r.ok ? r.json() : { plans: [], addons: [] })
      .then(d => { setPlans(d.plans || []); setAddons(d.addons || []); })
      .catch(() => {});

    fetch(`/api/billing/subscription/${user.tenantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : null).then(d => d && setSubscription(d)).catch(() => {});

    fetch(`/api/billing/usage/${user.tenantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : null).then(d => d && setUsage(d.usage || null)).catch(() => {});

    fetch(`/api/billing/invoices/${user.tenantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : { invoices: [] }).then(d => setInvoices(d.invoices || [])).catch(() => {});
  }, [accessToken, user]);

  const handleUpgrade = async (planId: string) => {
    if (planId === "district") return;
    setUpgradeLoading(planId);
    setUpgradeMsg("");
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ tenantId: user?.tenantId, planId }),
      });
      if (res.ok) {
        setUpgradeMsg(`Switched to ${plans.find(p => p.id === planId)?.name || planId} plan.`);
        setSubscription(prev => prev ? { ...prev, plan: planId } : prev);
      }
    } catch {}
    setUpgradeLoading(null);
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelMsg("");
    try {
      const res = await fetch(`/api/billing/subscription/${user?.tenantId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setCancelMsg("Your subscription will end at the current billing period.");
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
        setShowCancelModal(false);
      }
    } catch {}
    setCancelLoading(false);
  };

  if (loading || !user) return null;

  const currentPlan = plans.find(p => p.id === subscription?.plan);
  const parentPlans = plans.filter(p => p.id !== "district");
  const districtPlan = plans.find(p => p.id === "district");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">Dashboard</Link>
          <Link href="/dashboard/parent/settings" className="text-sm text-slate-500 font-semibold hover:text-primary">Settings</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">Logout</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">Subscription & Billing</h1>

        {upgradeMsg && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{upgradeMsg}</p>}
        {cancelMsg && <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">{cancelMsg}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">Current Plan</h3>
            <p className="text-2xl font-heading font-bold text-slate-900">{currentPlan?.name || "Free Trial"}</p>
            <p className="text-sm text-primary font-bold mt-1">
              {currentPlan && currentPlan.price > 0
                ? (currentPlan.priceLabel || `$${currentPlan.price}/mo`)
                : "Free"}
            </p>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-600 mt-2 font-medium">Cancels at period end</p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">Billing Period</h3>
            <p className="text-sm text-slate-700">
              {subscription ? new Date(subscription.currentPeriodStart).toLocaleDateString() : "--"} -
              {subscription ? " " + new Date(subscription.currentPeriodEnd).toLocaleDateString() : " --"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {subscription?.status === "active" ? "Active" : subscription?.status || "N/A"}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">This Period Usage</h3>
            {usage ? (
              <div className="text-sm text-slate-700 space-y-1 mt-1">
                <p>{usage.learners} learner{usage.learners !== 1 ? "s" : ""}</p>
                <p>{usage.tutorSessions} tutor sessions</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading...</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">Choose Your Plan</h2>
          <p className="text-sm text-slate-500 mb-6">All paid plans include ELA, Math, and 2 core AI tutors. Add more tutors anytime for $7.99/mo each.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {parentPlans.map(plan => {
              const isCurrent = subscription?.plan === plan.id;
              const isFree = plan.id === "free";
              const highlighted = plan.id === "family";
              return (
                <div key={plan.id} className={`relative rounded-2xl p-6 border-2 transition flex flex-col ${isCurrent ? "border-primary bg-purple-50 shadow-md" : highlighted ? "border-primary/40 bg-white shadow-sm" : "border-slate-200 bg-white"}`}>
                  {highlighted && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-primary text-white">Best Value</span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-green-600 text-white">Current</span>
                  )}
                  <h3 className="font-heading font-bold text-lg text-slate-900">{plan.name}</h3>
                  <div className="mt-2 mb-1">
                    {isFree ? (
                      <p className="text-3xl font-bold text-slate-900">Free</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-primary">${plan.price}<span className="text-base text-slate-400 font-normal">/mo</span></p>
                        <p className="text-xs text-slate-500 mt-0.5">per learner</p>
                      </>
                    )}
                  </div>
                  {plan.learnerMinimum && (
                    <p className="text-xs text-amber-600 font-medium mb-2">Requires {plan.learnerMinimum}+ learners</p>
                  )}
                  <ul className="mt-3 space-y-2 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => !isCurrent && handleUpgrade(plan.id)}
                    disabled={isCurrent || upgradeLoading === plan.id}
                    className={`w-full mt-5 py-2.5 rounded-xl text-sm font-bold transition ${isCurrent ? "bg-slate-100 text-slate-400 cursor-default" : highlighted ? "bg-primary text-white hover:bg-primary-dark shadow-sm" : "bg-slate-900 text-white hover:bg-slate-800"} disabled:opacity-50`}
                  >
                    {isCurrent ? "Current Plan" : upgradeLoading === plan.id ? "Switching..." : isFree ? "Downgrade to Free" : "Subscribe"}
                  </button>
                </div>
              );
            })}
          </div>

          {districtPlan && (
            <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">{districtPlan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">All 14 AI tutors, admin dashboard, IEP tracking, research access, and dedicated onboarding.</p>
              </div>
              <a href="mailto:sales@aivo.com" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition flex-shrink-0">
                Contact Sales
              </a>
            </div>
          )}
        </div>

        {addons.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">Add-On Tutors</h2>
            <p className="text-sm text-slate-500 mb-4">Want access to more AI tutors beyond your plan? Add any tutor individually.</p>
            {addons.map(addon => (
              <div key={addon.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{addon.name}</p>
                  <p className="text-xs text-slate-500">{addon.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold text-primary">${addon.price}<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                  <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition">
                    Add Tutor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">Invoice History</h2>
          {invoices.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-2">${inv.amount}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">{inv.status}</span>
                    </td>
                    <td className="py-2">
                      <a href={inv.url} className="text-primary text-xs hover:underline">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">No invoices yet. Your first invoice will appear after your first billing cycle.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">Cancel Subscription</h2>
          <p className="text-sm text-slate-500 mb-4">
            {subscription?.cancelAtPeriodEnd
              ? "Your subscription is scheduled to cancel at the end of the current billing period."
              : "Cancel your subscription. You'll keep access until the end of your current billing period, then revert to the Free Trial (ELA tutor only)."}
          </p>
          {!subscription?.cancelAtPeriodEnd ? (
            !showCancelModal ? (
              <button onClick={() => setShowCancelModal(true)}
                className="px-6 py-2.5 rounded-lg border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 transition text-sm">
                Cancel Subscription
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
                <p className="text-sm text-red-700 font-medium">Are you sure you want to cancel? You'll keep access until {subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "the end of the billing period"}, then revert to the free plan with ELA tutor only.</p>
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={cancelLoading}
                    className="px-4 py-2 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50">
                    {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                  <button onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-xs rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition">
                    Keep Subscription
                  </button>
                </div>
              </div>
            )
          ) : (
            <span className="px-4 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 font-medium">Subscription will cancel at period end</span>
          )}
        </div>
      </main>
    </div>
  );
}
