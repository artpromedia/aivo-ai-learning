"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Assignment {
  id: string;
  subject: string;
  status: string;
  detectedSubject: string;
  problemCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  READY: { label: "Ready", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completed", color: "bg-purple-100 text-purple-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
};

const SUBJECT_ICONS: Record<string, string> = {
  math: "🔢", ela: "📖", science: "🔬", history: "🏛️", coding: "💻", other: "📝",
};

export default function LearnerHomeworkPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/tutors/homework/learner/${learnerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(data => setAssignments(data.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken, learnerId]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900">{t("homework_history")}</h1>
        <p className="text-slate-500 text-sm mt-1">{t("homework_desc")}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-semibold">{t("no_homework")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(hw => {
            const subjectLower = hw.subject?.toLowerCase() || "other";
            const status = STATUS_LABELS[hw.status] || STATUS_LABELS.READY;
            return (
              <div key={hw.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-50">
                  {SUBJECT_ICONS[subjectLower] || SUBJECT_ICONS.other}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 capitalize">{subjectLower} {t("homework_label")}</p>
                  <p className="text-sm text-slate-400">
                    {t("problems_count", { count: hw.problemCount })} · {new Date(hw.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
