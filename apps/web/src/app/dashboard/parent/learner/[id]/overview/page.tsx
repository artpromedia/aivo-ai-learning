"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";

interface LearnerDetail {
  id: string;
  name: string;
  gradeLevel: string;
  functioningLevel: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
}

export default function ParentLearnerOverviewPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");
  const tc = useTranslations("common");
  const [learner, setLearner] = useState<LearnerDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "PARENT") router.push("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((l: any) => l.id === learnerId);
        if (found) setLearner(found);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  const navLinks = [
    { href: `/dashboard/parent/learner/${learnerId}/overview`, label: t("overview"), active: true },
    { href: `/dashboard/parent/learner/${learnerId}/brain`, label: t("brain_profile") },
    { href: `/dashboard/parent/learner/${learnerId}/assessment`, label: t("assessments") },
    { href: `/dashboard/parent/learner/${learnerId}/gradebook`, label: t("gradebook") },
    { href: `/dashboard/parent/learner/${learnerId}/iep`, label: t("iep_goals") },
    { href: `/dashboard/parent/learner/${learnerId}/collaboration`, label: t("learning_team") },
    { href: `/dashboard/parent/learner/${learnerId}/recommendations`, label: t("recommendations") },
    { href: `/dashboard/parent/learner/${learnerId}/sensory`, label: t("sensory_profile") },
    { href: `/dashboard/parent/learner/${learnerId}/tutors`, label: t("tutors") },
    { href: `/dashboard/parent/learner/${learnerId}/settings`, label: t("settings") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        <div className="flex items-center gap-4">
          <Link href="/dashboard/parent" className="text-sm text-primary font-semibold hover:underline">{t("dashboard")}</Link>
          <span className="text-sm font-semibold text-slate-600">{user.name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-6">
        <Link href="/dashboard/parent" className="text-sm text-primary hover:underline font-semibold mb-4 inline-block">← {t("back_to_dashboard")}</Link>

        {loadingData ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 animate-pulse text-slate-400">{tc("loading")}</div>
        ) : !learner ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-red-100">
            <p className="text-red-600 font-semibold">{t("learner_not_found")}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">🧑‍🎓</div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900">{learner.name}</h1>
                <p className="text-sm text-slate-500">{t("grade_label", { grade: learner.gradeLevel || "—" })} · {learner.functioningLevel || tc("pending")}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${link.active ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("functioning_level")}</p>
                  <p className="text-xl font-bold text-primary">{learner.functioningLevel || t("pending_assessment")}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("grade")}</p>
                  <p className="text-xl font-bold text-slate-900">{learner.gradeLevel || "—"}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("member_since")}</p>
                  <p className="text-xl font-bold text-slate-900">{new Date(learner.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("brain_preview")}</h2>
                {accessToken && (
                  <BrainVisualization learnerId={learnerId} learnerName={learner.name} accessToken={accessToken} compact />
                )}
                <Link href={`/dashboard/parent/learner/${learnerId}/brain`}
                  className="mt-4 text-sm text-primary font-semibold hover:underline inline-block">{t("view_full_brain")}</Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href={`/dashboard/parent/learner/${learnerId}/assessment`}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition text-center">
                  <span className="text-2xl">📋</span>
                  <p className="text-sm font-semibold text-slate-700 mt-2">{t("assessments")}</p>
                </Link>
                <Link href={`/dashboard/parent/learner/${learnerId}/gradebook`}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition text-center">
                  <span className="text-2xl">📊</span>
                  <p className="text-sm font-semibold text-slate-700 mt-2">{t("gradebook")}</p>
                </Link>
                <Link href={`/dashboard/parent/learner/${learnerId}/iep`}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition text-center">
                  <span className="text-2xl">🎯</span>
                  <p className="text-sm font-semibold text-slate-700 mt-2">{t("iep_goals")}</p>
                </Link>
                <Link href={`/dashboard/parent/learner/${learnerId}/recommendations`}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition text-center">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm font-semibold text-slate-700 mt-2">{t("recommendations")}</p>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
