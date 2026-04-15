"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Learner {
  id: string;
  name: string;
  gradeLevel?: string;
  functioningLevel?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  STANDARD: "bg-green-100 text-green-700",
  SUPPORTED: "bg-blue-100 text-blue-700",
  LOW_VERBAL: "bg-amber-100 text-amber-700",
  NON_VERBAL: "bg-orange-100 text-orange-700",
  PRE_SYMBOLIC: "bg-red-100 text-red-700",
};

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, loading } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [learner, setLearner] = useState<Learner | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/users/learners", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find((l: Learner) => l.id === learnerId);
        if (found) setLearner(found);
      })
      .catch(() => {});
  }, [accessToken, learnerId]);

  if (loading || !user) return null;

  const TABS = [
    { key: "hub", label: t("overview"), href: `/dashboard/parent/learner/${learnerId}`, exact: true },
    { key: "progress", label: "Progress", href: `/dashboard/parent/learner/${learnerId}/progress` },
    { key: "brain", label: t("brain_profile"), href: `/dashboard/parent/learner/${learnerId}/brain` },
    { key: "team", label: "Team", href: `/dashboard/parent/learner/${learnerId}/team` },
    { key: "iep", label: t("iep_goals"), href: `/dashboard/parent/learner/${learnerId}/iep` },
    { key: "sensory", label: "Sensory", href: `/dashboard/parent/learner/${learnerId}/sensory` },
    { key: "milestones", label: "Milestones", href: `/dashboard/parent/learner/${learnerId}/milestones` },
    { key: "settings", label: t("settings"), href: `/dashboard/parent/learner/${learnerId}/settings` },
  ];

  const isTabActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const gradebookActive = pathname.includes("/gradebook");
  const collaborationActive = pathname.includes("/collaboration");

  return (
    <div>
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 py-3">
            <button onClick={() => router.push("/dashboard/parent")}
              className="text-slate-400 hover:text-purple-600 transition text-sm font-semibold" style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ← Back
            </button>

            {learner && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {learner.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-heading font-bold text-slate-900 truncate">{learner.name}</h2>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {learner.gradeLevel && <span className="text-[11px] text-slate-500 font-medium">Grade {learner.gradeLevel}</span>}
                    {learner.functioningLevel && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[learner.functioningLevel] || "bg-slate-100 text-slate-600"}`}>
                        {learner.functioningLevel.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-0.5 overflow-x-auto pb-0 -mb-px scrollbar-hide">
            {TABS.map(tab => (
              <Link key={tab.key} href={tab.href}
                className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition flex-shrink-0 ${
                  isTabActive(tab.href, tab.exact)
                    ? "border-purple-500 text-purple-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
                style={{ minHeight: 44 }}>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {children}
      </div>
    </div>
  );
}
