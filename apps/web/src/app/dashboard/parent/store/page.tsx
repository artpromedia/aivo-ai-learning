"use client";
import { Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { useTranslations } from "next-intl";

interface TutorCatalogItem {
  key: string;
  sku: string;
  name: string;
  domain: string;
  color: string;
  tier: string;
  avatar: string;
  price: number;
}

interface Bundle {
  name: string;
  price: number;
  tutors: string[];
}

interface ActiveSub {
  tutorSku: string;
  status: string;
}

function StoreLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-7 w-24 bg-slate-200 rounded-full animate-pulse" />
      </header>
      <main className="max-w-6xl mx-auto px-8 py-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 rounded-2xl border-2 border-slate-100 bg-white">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border-2 border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
                <div>
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-9 w-full bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function TutorStorePageWrapper() {
  return (
    <Suspense fallback={<StoreLoadingSkeleton />}>
      <TutorStoreContent />
    </Suspense>
  );
}

function TutorStoreContent() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("parent");
  const tc = useTranslations("common");
  const highlightTutor = searchParams.get("tutor");
  const [catalog, setCatalog] = useState<TutorCatalogItem[]>([]);
  const [bundles, setBundles] = useState<Record<string, Bundle>>({});
  const [activeSubs, setActiveSubs] = useState<ActiveSub[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [learners, setLearners] = useState<{ id: string; name: string }[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string>("");
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT" && user.role !== "PLATFORM_ADMIN") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    fetch("/api/tutors/catalog").then(r => r.json()).then(data => {
      setCatalog(data.tutors || []);
      setBundles(data.bundles || {});
    }).catch((err: unknown) => { console.error("Failed to load catalog:", err); });
  }, []);

  useEffect(() => {
    if (accessToken && user) {
      fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.json()).then(setLearners).catch((err: unknown) => { console.error("Failed to load learners:", err); });
      fetch(`/api/tutors/active/${user.id}`).then(r => r.json()).then(setActiveSubs).catch((err: unknown) => { console.error("Failed to load subs:", err); });
    }
  }, [accessToken, user]);

  useEffect(() => {
    if (highlightTutor && catalog.length > 0 && !scrolledRef.current) {
      scrolledRef.current = true;
      setTimeout(() => {
        const el = document.getElementById(`tutor-card-${highlightTutor}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-purple-400", "ring-offset-2");
          setTimeout(() => el.classList.remove("ring-4", "ring-purple-400", "ring-offset-2"), 3000);
        }
      }, 300);
    }
  }, [highlightTutor, catalog]);

  const isActive = (sku: string) => activeSubs.some(s => s.tutorSku === sku && s.status === "active");

  const subscribe = async (sku: string) => {
    if (!user) return;
    setSubscribing(sku);
    try {
      const res = await fetch("/api/tutors/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, tutorSku: sku }),
      });
      if (res.ok) {
        setActiveSubs([...activeSubs, { tutorSku: sku, status: "active" }]);
      }
    } catch (err: unknown) { console.error("Subscribe failed:", err); }
    setSubscribing(null);
  };

  const subscribeBundle = async (bundleKey: string) => {
    if (!user) return;
    setSubscribing(bundleKey);
    try {
      const res = await fetch("/api/tutors/subscribe-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, bundleKey }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSubs = (data.results as { status: string; sku: string }[])
          .filter((r) => r.status === "activated")
          .map((r) => ({ tutorSku: r.sku, status: "active" }));
        setActiveSubs([...activeSubs, ...newSubs]);
      }
    } catch (err: unknown) { console.error("Bundle subscribe failed:", err); }
    setSubscribing(null);
    setSelectedBundle(null);
  };

  if (loading || !user) return null;

  const coreTutors = catalog.filter(t => t.tier === "core");
  const expansionTutors = catalog.filter(t => t.tier === "expansion");
  const activeCount = activeSubs.filter(s => s.status === "active").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/parent")} className="text-sm text-slate-500 hover:text-primary font-semibold">
            {t("back_to_dashboard")}
          </button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-bold">
            {t("active_tutors_count", { count: activeCount })}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-slate-900">{t("tutor_store")}</h1>
          <p className="text-slate-500 font-semibold">{t("choose_tutors_or_bundles")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(bundles).filter(([k]) => k !== "individual").map(([key, bundle]) => (
            <button key={key}
              onClick={() => setSelectedBundle(selectedBundle === key ? null : key)}
              className={`p-6 rounded-2xl border-2 text-left transition ${selectedBundle === key ? "border-primary bg-purple-50 shadow-lg" : "border-slate-200 bg-white hover:border-purple-200"}`}>
              <h3 className="font-heading font-bold text-lg text-slate-900">{bundle.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{t("tutors_included", { count: bundle.tutors.length })}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">${(bundle.price / 100).toFixed(2)}</span>
                <span className="text-sm text-slate-400">/month</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {bundle.tutors.map(t => {
                  const tutor = TUTORS[t as TutorKey];
                  return tutor ? (
                    <span key={t} className="inline-block w-6 h-6 rounded-full overflow-hidden border" style={{ borderColor: tutor.color }}>
                      <Image src={tutor.avatar} alt={tutor.name} width={24} height={24} className="object-cover object-top" />
                    </span>
                  ) : null;
                })}
              </div>
              {selectedBundle === key && (
                <button onClick={(e) => { e.stopPropagation(); subscribeBundle(key); }}
                  disabled={subscribing === key}
                  className="mt-4 w-full px-4 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50">
                  {subscribing === key ? t("activating") : t("subscribe_to_bundle")}
                </button>
              )}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">{t("core_tutors")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {coreTutors.map(t => {
              const active = isActive(t.sku);
              return (
                <div key={t.key} id={`tutor-card-${t.key}`} className={`bg-white rounded-2xl p-5 border-2 transition ${active ? "border-green-300 shadow-md" : "border-slate-100 hover:border-purple-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow" style={{ borderColor: t.color }}>
                      <Image src={t.avatar} alt={t.name} fill className="object-cover object-top" sizes="56px" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold" style={{ color: t.color }}>{t.name}</h3>
                      <p className="text-xs text-slate-500">{t.domain}</p>
                    </div>
                  </div>
                  {active ? (
                    <div className="px-4 py-2 text-center rounded-full bg-green-50 text-green-700 font-bold text-sm">
                      {tc("active")}
                    </div>
                  ) : (
                    <button onClick={() => subscribe(t.sku)} disabled={subscribing === t.sku}
                      className="w-full px-4 py-2 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50">
                      {subscribing === t.sku ? "..." : `$${(t.price / 100).toFixed(2)}/mo`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {expansionTutors.length > 0 && (
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-1">{t("expansion_tutors")}</h2>
            <p className="text-sm text-slate-400 mb-4">{t("expansion_tutors_desc")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {expansionTutors.map(t => {
                const active = isActive(t.sku);
                return (
                  <div key={t.key} id={`tutor-card-${t.key}`} className={`bg-white rounded-2xl p-5 border-2 transition ${active ? "border-green-300 shadow-md" : "border-slate-100 hover:border-amber-200"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow" style={{ borderColor: t.color }}>
                        <Image src={t.avatar} alt={t.name} fill className="object-cover object-top" sizes="56px" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold" style={{ color: t.color }}>{t.name}</h3>
                        <p className="text-xs text-slate-500">{t.domain}</p>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600">{tc("more").toUpperCase()}</span>
                      </div>
                    </div>
                    {active ? (
                      <div className="px-4 py-2 text-center rounded-full bg-green-50 text-green-700 font-bold text-sm">
                        {tc("active")}
                      </div>
                    ) : (
                      <button onClick={() => subscribe(t.sku)} disabled={subscribing === t.sku}
                        className="w-full px-4 py-2 rounded-full bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition disabled:opacity-50">
                        {subscribing === t.sku ? "..." : `$${(t.price / 100).toFixed(2)}/mo`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
