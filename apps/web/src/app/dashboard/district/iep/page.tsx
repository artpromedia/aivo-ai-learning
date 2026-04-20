"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconWell, StatIconWell } from "@/components/discovery/_vi";
import { ClipboardList, Clock, AlertTriangle } from "lucide-react";

interface IepSummary {
  active: number;
  dueForReview: number;
  overdue: number;
}

interface IepLearner {
  iepId: string;
  status: string;
  startDate: string;
  reviewDate: string;
  disabilityCategory?: string;
  placement?: string;
  goals?: any[];
  learnerId: string;
  learnerName: string;
  gradeLevel?: string;
  functioningLevel?: string;
}

export default function DistrictIepPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<IepSummary | null>(null);
  const [iepLearners, setIepLearners] = useState<IepLearner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    Promise.all([
      fetch("/api/district/iep/summary", { headers }).then((r) => r.ok ? r.json() : null),
      fetch("/api/district/iep/learners", { headers }).then((r) => r.ok ? r.json() : { iepLearners: [] }),
    ])
      .then(([s, l]) => {
        setSummary(s);
        setIepLearners(l.iepLearners || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const today = new Date().toISOString().split("T")[0];

  const getReviewStatus = (reviewDate: string) => {
    if (!reviewDate) return { label: "No date", cls: "vi-surface-soft vi-text-muted" };
    if (reviewDate < today) return { label: "Overdue", cls: "bg-[hsl(var(--visual-math)/0.12)] text-[hsl(var(--visual-math))]" };
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    if (reviewDate <= thirtyDays) return { label: "Due soon", cls: "bg-[hsl(var(--visual-sel)/0.18)] text-[hsl(var(--visual-sel))]" };
    return { label: "On track", cls: "bg-[hsl(var(--visual-science)/0.14)] text-[hsl(var(--visual-science))]" };
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center gap-4">
        <IconWell color="science">
          <ClipboardList size={28} strokeWidth={2.5} aria-hidden="true" />
        </IconWell>
        <div>
          <h1 className="text-2xl font-heading font-bold vi-text">IEP Management</h1>
          <p className="text-sm vi-text-muted mt-1">Track individualized education programs, review dates, and compliance status.</p>
        </div>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="vi-card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <StatIconWell color="primary">
                    <ClipboardList size={22} strokeWidth={2.5} aria-hidden="true" />
                  </StatIconWell>
                  <span className="text-xs vi-text-muted font-medium uppercase">Active IEPs</span>
                </div>
                <p className="text-3xl font-bold vi-text">{summary.active}</p>
              </div>
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <StatIconWell color="amber">
                    <Clock size={22} strokeWidth={2.5} aria-hidden="true" />
                  </StatIconWell>
                  <span className="text-xs text-amber-600 font-medium uppercase">Due for Review (30d)</span>
                </div>
                <p className="text-3xl font-bold text-[hsl(var(--visual-sel))]">{summary.dueForReview}</p>
              </div>
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <StatIconWell color="red">
                    <AlertTriangle size={22} strokeWidth={2.5} aria-hidden="true" />
                  </StatIconWell>
                  <span className="text-xs text-red-600 font-medium uppercase">Overdue</span>
                </div>
                <p className="text-3xl font-bold text-[hsl(var(--visual-math))]">{summary.overdue}</p>
              </div>
            </div>
          )}

          <div className="vi-card overflow-hidden">
            <div className="p-5 border-b vi-border">
              <h2 className="text-lg font-heading font-semibold vi-text">IEP Records</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left vi-text-muted vi-bg/50 border-b vi-border">
                  <th className="px-5 py-3 font-semibold">Learner</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold">Disability</th>
                  <th className="px-5 py-3 font-semibold">Placement</th>
                  <th className="px-5 py-3 font-semibold">Review Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Goals</th>
                </tr>
              </thead>
              <tbody>
                {iepLearners.map((il) => {
                  const reviewStatus = getReviewStatus(il.reviewDate);
                  return (
                    <tr key={il.iepId} className="border-b vi-border hover:vi-surface-soft transition">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/district/learners/${il.learnerId}`} className="font-medium vi-text hover:text-[hsl(var(--visual-primary))]">
                          {il.learnerName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 vi-text-muted">{il.gradeLevel || "—"}</td>
                      <td className="px-5 py-3 vi-text-muted text-xs">{il.disabilityCategory || "—"}</td>
                      <td className="px-5 py-3 vi-text-muted text-xs">{il.placement || "—"}</td>
                      <td className="px-5 py-3 vi-text-muted text-xs">{il.reviewDate || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${reviewStatus.cls}`}>
                          {reviewStatus.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 vi-text-muted text-xs">{il.goals?.length || 0}</td>
                    </tr>
                  );
                })}
                {iepLearners.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center vi-text-muted">No IEP records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
