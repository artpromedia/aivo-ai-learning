"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";

export default function ParentBrainProfilePage() {
  const { user, accessToken, loading } = useAuth();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [learnerName, setLearnerName] = useState("Learner");
  const [baselineCompleted, setBaselineCompleted] = useState(false);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find((l: any) => l.id === learnerId);
        if (found) setLearnerName(found.name);
      })
      .catch(() => {});

    fetch(`/api/assessments/learner/discovery/${learnerId}/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((status) => {
        if (status?.baselineCompleted) setBaselineCompleted(true);
      })
      .catch(() => {});
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">{t("brain_profile_title", { name: learnerName })}</h1>
        <p className="text-sm text-slate-500">{t("brain_profile_desc")}</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("brain_visualization")}</h2>
        {accessToken ? (
          <BrainVisualization learnerId={learnerId} learnerName={learnerName} accessToken={accessToken} baselineCompleted={baselineCompleted} />
        ) : (
          <p className="text-sm text-slate-400">{t("loading_brain")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-heading font-bold text-slate-900 mb-3">{t("what_is_brain")}</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">●</span>
              <span>{t("brain_feature_adapt")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">●</span>
              <span>{t("brain_feature_track")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">●</span>
              <span>{t("brain_feature_identify")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">●</span>
              <span>{t("brain_feature_iep")}</span>
            </li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-heading font-bold text-slate-900 mb-3">{t("related_pages")}</h3>
          <div className="space-y-2">
            <Link href={`/dashboard/parent/learner/${learnerId}/sensory`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition">
              <span className="text-xl">🎨</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("sensory_profile")}</p>
                <p className="text-xs text-slate-400">{t("sensory_profile_desc")}</p>
              </div>
            </Link>
            <Link href={`/dashboard/parent/learner/${learnerId}/recommendations`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("recommendations")}</p>
                <p className="text-xs text-slate-400">{t("recommendations_desc")}</p>
              </div>
            </Link>
            <Link href={`/dashboard/parent/learner/${learnerId}/iep`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t("iep_goals")}</p>
                <p className="text-xs text-slate-400">{t("iep_goals_desc")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
