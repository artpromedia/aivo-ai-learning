"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");
  const tc = useTranslations("common");
  const [learner, setLearner] = useState<LearnerDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find((l: any) => l.id === learnerId);
        if (found) setLearner(found);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  if (loadingData) {
    return <div className="text-center py-12 text-slate-400 animate-pulse">{tc("loading")}</div>;
  }

  if (!learner) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-semibold">{t("learner_not_found")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase mb-1">{t("functioning_level")}</p>
          <p className="text-xl font-bold text-purple-600">{learner.functioningLevel || t("pending_assessment")}</p>
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
          className="mt-4 text-sm text-purple-600 font-semibold hover:underline inline-block">{t("view_full_brain")}</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/dashboard/parent/learner/${learnerId}/assessment`}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center">
          <span className="text-2xl">📋</span>
          <p className="text-sm font-semibold text-slate-700 mt-2">{t("assessments")}</p>
        </Link>
        <Link href={`/dashboard/parent/learner/${learnerId}/gradebook`}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center">
          <span className="text-2xl">📊</span>
          <p className="text-sm font-semibold text-slate-700 mt-2">Progress</p>
        </Link>
        <Link href={`/dashboard/parent/learner/${learnerId}/iep`}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center">
          <span className="text-2xl">🎯</span>
          <p className="text-sm font-semibold text-slate-700 mt-2">{t("iep_goals")}</p>
        </Link>
        <Link href={`/dashboard/parent/learner/${learnerId}/recommendations`}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition text-center">
          <span className="text-2xl">💡</span>
          <p className="text-sm font-semibold text-slate-700 mt-2">{t("recommendations")}</p>
        </Link>
      </div>
    </div>
  );
}
