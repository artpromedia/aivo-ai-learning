"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { useTranslations } from "next-intl";

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

const PLAN_INCLUDED_TUTORS: Record<string, TutorKey[]> = {
  free: ["sage"],
  single: ["sage", "nova", "spark", "chrono"],
  family: ["sage", "nova", "spark", "chrono"],
};

export default function ParentBillingPage() {
  const { user, accessToken, logout, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("parent");
  const tc = useTranslations("common");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTutorAddons, setActiveTutorAddons] = useState<string[]>([]);
  const [addonLoading, setAddonLoading] = useState<string | null>(null);
  const [addonMsg, setAddonMsg] = useState("");
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
      .then(r => r.ok ? r.json() : { plans: [] })
      .then(d => setPlans(d.plans || []))
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

    fetch(`/api/billing/addons/${user.tenantId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.ok ? r.json() : { addons: [] }).then(d => {
      setActiveTutorAddons((d.addons || []).map((a: any) => a.tutorId));
    }).catch(() => {});
  }, [accessToken, user]);

  const handleAddTutor = async (tutorId: string) => {
    setAddonLoading(tutorId);
    setAddonMsg("");
    try {
      const res = await fetch("/api/billing/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ tenantId: user?.tenantId, tutorId }),
      });
      if (res.ok) {
        setActiveTutorAddons(prev => [...prev, tutorId]);
        const tutor = TUTORS[tutorId as TutorKey];
        setAddonMsg(t("tutor_added_msg", { name: tutor?.name || tutorId }));
      } else {
        const data = await res.json();
        setAddonMsg(data.error || t("failed_add_tutor"));
      }
    } catch {
      setAddonMsg(t("network_error"));
    }
    setAddonLoading(null);
  };

  const handleRemoveTutor = async (tutorId: string) => {
    setAddonLoading(tutorId);
    setAddonMsg("");
    try {
      const res = await fetch(`/api/billing/addons/${user?.tenantId}/${tutorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setActiveTutorAddons(prev => prev.filter(t => t !== tutorId));
        const tutor = TUTORS[tutorId as TutorKey];
        setAddonMsg(t("tutor_removed_msg", { name: tutor?.name || tutorId }));
      } else {
        const data = await res.json();
        setAddonMsg(data.error || t("failed_remove_tutor"));
      }
    } catch {
      setAddonMsg(t("network_error"));
    }
    setAddonLoading(null);
  };

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
        setUpgradeMsg(t("switched_plan", { name: plans.find(p => p.id === planId)?.name || planId }));
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
        setCancelMsg(t("cancel_will_end"));
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
  const includedTutors: TutorKey[] = PLAN_INCLUDED_TUTORS[subscription?.plan || "free"] || ["sage"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">{t("dashboard")}</Link>
          <Link href="/dashboard/parent/settings" className="text-sm text-slate-500 font-semibold hover:text-primary">{t("settings")}</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500 font-semibold transition">{t("logout")}</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("billing_page_title")}</h1>

        {upgradeMsg && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{upgradeMsg}</p>}
        {cancelMsg && <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">{cancelMsg}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("current_plan")}</h3>
            <p className="text-2xl font-heading font-bold text-slate-900">{currentPlan?.name || t("free_trial")}</p>
            <p className="text-sm text-primary font-bold mt-1">
              {currentPlan && currentPlan.price > 0
                ? (currentPlan.priceLabel || `$${currentPlan.price}/mo`)
                : t("free")}
            </p>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-600 mt-2 font-medium">{t("cancels_at_period_end")}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("billing_period")}</h3>
            <p className="text-sm text-slate-700">
              {subscription ? new Date(subscription.currentPeriodStart).toLocaleDateString() : "--"} -
              {subscription ? " " + new Date(subscription.currentPeriodEnd).toLocaleDateString() : " --"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {subscription?.status === "active" ? tc("active") : subscription?.status || t("na")}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("this_period_usage")}</h3>
            {usage ? (
              <div className="text-sm text-slate-700 space-y-1 mt-1">
                <p>{usage.learners} {usage.learners !== 1 ? "learners" : "learner"}</p>
                <p>{usage.tutorSessions} {t("sessions").toLowerCase()}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{tc("loading")}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">{t("choose_your_plan")}</h2>
          <p className="text-sm text-slate-500 mb-6">{t("plan_description")}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {parentPlans.map(plan => {
              const isCurrent = subscription?.plan === plan.id;
              const isFree = plan.id === "free";
              const highlighted = plan.id === "family";
              return (
                <div key={plan.id} className={`relative rounded-2xl p-6 border-2 transition flex flex-col ${isCurrent ? "border-primary bg-purple-50 shadow-md" : highlighted ? "border-primary/40 bg-white shadow-sm" : "border-slate-200 bg-white"}`}>
                  {highlighted && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-primary text-white">{t("best_value")}</span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-green-600 text-white">{t("current")}</span>
                  )}
                  <h3 className="font-heading font-bold text-lg text-slate-900">{plan.name}</h3>
                  <div className="mt-2 mb-1">
                    {isFree ? (
                      <p className="text-3xl font-bold text-slate-900">{t("free")}</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-primary">${plan.price}<span className="text-base text-slate-400 font-normal">/mo</span></p>
                        <p className="text-xs text-slate-500 mt-0.5">{t("per_learner")}</p>
                      </>
                    )}
                  </div>
                  {plan.learnerMinimum && (
                    <p className="text-xs text-amber-600 font-medium mb-2">{t("requires_learners", { count: plan.learnerMinimum })}</p>
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
                    {isCurrent ? t("current_plan_label") : upgradeLoading === plan.id ? t("switching") : isFree ? t("downgrade_to_free") : t("subscribe")}
                  </button>
                </div>
              );
            })}
          </div>

          {districtPlan && (
            <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900">{districtPlan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{t("district_plan_desc")}</p>
              </div>
              <a href="mailto:sales@aivo.com" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition flex-shrink-0">
                {t("contact_sales")}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">{t("addon_tutors_title")}</h2>
          <p className="text-sm text-slate-500 mb-4">
            {t("addon_tutors_desc", { count: includedTutors.length })}
          </p>
          {addonMsg && (
            <p className={`text-sm p-3 rounded-lg mb-4 ${addonMsg.includes("added") || addonMsg.includes("agregado") ? "text-green-600 bg-green-50" : addonMsg.includes("removed") || addonMsg.includes("eliminado") ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50"}`}>
              {addonMsg}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(TUTORS) as [TutorKey, typeof TUTORS[TutorKey]][]).map(([key, tutor]) => {
              const isIncluded = includedTutors.includes(key);
              const isAddon = activeTutorAddons.includes(key);
              const isProcessing = addonLoading === key;

              return (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition ${isIncluded ? "bg-slate-50 border-slate-100" : isAddon ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                  <Image src={tutor.avatar} alt={tutor.name} width={40} height={40} className="rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{tutor.name}</p>
                    <p className="text-xs text-slate-500 truncate">{tutor.domain}</p>
                  </div>
                  {isIncluded ? (
                    <span className="px-3 py-1 text-xs rounded-full bg-slate-200 text-slate-600 font-medium flex-shrink-0">{t("included")}</span>
                  ) : isAddon ? (
                    <button
                      onClick={() => handleRemoveTutor(key)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition flex-shrink-0 disabled:opacity-50"
                    >
                      {isProcessing ? "..." : tc("remove")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddTutor(key)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition flex-shrink-0 disabled:opacity-50"
                    >
                      {isProcessing ? "..." : "+ $4.99/mo"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {activeTutorAddons.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{t("addon_tutors_summary", { count: activeTutorAddons.length })}</span> &middot; <span className="text-primary font-bold">${(activeTutorAddons.length * 4.99).toFixed(2)}/mo</span> {t("added_to_subscription")}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-4">{t("invoice_history")}</h2>
          {invoices.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b">
                  <th className="pb-2">{tc("date")}</th>
                  <th className="pb-2">{tc("total")}</th>
                  <th className="pb-2">{tc("status")}</th>
                  <th className="pb-2">{t("invoice_history")}</th>
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
                      <a href={inv.url} className="text-primary text-xs hover:underline">{tc("download")}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">{t("no_invoices")}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">{t("cancel_subscription")}</h2>
          <p className="text-sm text-slate-500 mb-4">
            {subscription?.cancelAtPeriodEnd
              ? t("cancel_scheduled")
              : t("cancel_description")}
          </p>
          {!subscription?.cancelAtPeriodEnd ? (
            !showCancelModal ? (
              <button onClick={() => setShowCancelModal(true)}
                className="px-6 py-2.5 rounded-lg border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 transition text-sm">
                {t("cancel_subscription")}
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
                <p className="text-sm text-red-700 font-medium">{t("cancel_confirm_message", { date: subscription ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "" })}</p>
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={cancelLoading}
                    className="px-4 py-2 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50">
                    {cancelLoading ? t("cancelling") : t("confirm_cancellation")}
                  </button>
                  <button onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-xs rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition">
                    {t("keep_subscription")}
                  </button>
                </div>
              </div>
            )
          ) : (
            <span className="px-4 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 font-medium">{t("subscription_will_cancel")}</span>
          )}
        </div>
      </main>
    </div>
  );
}
