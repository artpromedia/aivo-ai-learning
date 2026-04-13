"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { useTranslations } from "next-intl";

export default function ParentLearnerTutorsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");
  const tc = useTranslations("common");
  const [learnerName, setLearnerName] = useState("Learner");
  const [activeTutors, setActiveTutors] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;

    Promise.all([
      fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : []),
      fetch(`/api/tutors/active/${user?.id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([learnersData, tutorData]) => {
        const list = Array.isArray(learnersData) ? learnersData : [];
        const found = list.find((l: any) => l.id === learnerId);
        if (found) setLearnerName(found.name);
        const subs = Array.isArray(tutorData) ? tutorData : [];
        setActiveTutors(subs.map((s: any) => s.tutorSku || ""));
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, learnerId, user]);

  if (loading || !user) return null;

  const tutorEntries = Object.entries(TUTORS) as [TutorKey, typeof TUTORS[TutorKey]][];
  const isActive = (key: string) => activeTutors.some(sku => sku.toLowerCase().includes(key.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">{t("dashboard")}</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-6">
        <Link href={`/dashboard/parent/learner/${learnerId}/overview`}
          className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← {learnerName}</Link>

        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">{t("tutors_title", { name: learnerName })}</h1>
        <p className="text-sm text-slate-500 mb-6">{t("tutors_manage_desc")} {t("visit_store")} <Link href="/dashboard/parent/store" className="text-primary hover:underline font-semibold">{t("tutor_store_link")}</Link> {t("to_add_more")}</p>

        {loadingData ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 animate-pulse text-slate-400">{t("loading_tutors")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorEntries.map(([key, tutor]) => {
              const active = isActive(key);
              return (
                <div key={key} className={`rounded-2xl border-2 overflow-hidden transition ${active ? "border-primary/30 bg-white shadow-sm" : "border-slate-200 bg-slate-50/50 opacity-60"}`}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Image src={tutor.avatar} alt={tutor.name} width={48} height={48} className="rounded-xl" />
                      <div>
                        <h3 className="font-heading font-bold text-slate-900">{tutor.name}</h3>
                        <p className="text-xs text-slate-500">{tutor.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${tutor.tier === "core" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {tutor.tier}
                      </span>
                      {active ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">{tc("active")}</span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-slate-200 text-slate-500 font-semibold">{t("not_subscribed")}</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1" style={{ backgroundColor: tutor.color }} />
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-5 rounded-2xl bg-purple-50 border border-purple-100">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">{t("want_more_tutors")}</span> {t("visit_store")}{" "}
            <Link href="/dashboard/parent/store" className="text-primary font-bold hover:underline">{t("tutor_store_link")}</Link>{" "}
            {tc("or")}{" "}
            <Link href="/dashboard/parent/billing" className="text-primary font-bold hover:underline">{t("billing_link")}</Link>{" "}
            {t("manage_addons_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
