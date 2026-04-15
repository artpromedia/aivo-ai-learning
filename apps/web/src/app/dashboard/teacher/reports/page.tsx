"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

export default function TeacherReportsPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("teacher");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);

  useEffect(() => {
    if (!accessToken || !user) return;
    fetch("/api/family/collaboration/connected-learners", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setLearners(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [accessToken, user]);

  if (loading || !user) return null;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">{t("progress_reports")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg" aria-hidden="true">📊</span>
            <div>
              <h3 className="font-semibold text-slate-900">Weekly Mastery Report</h3>
              <p className="text-xs text-slate-500">Generated weekly</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Track mastery progress across all your learners by subject and skill area.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg" aria-hidden="true">⚠️</span>
            <div>
              <h3 className="font-semibold text-slate-900">At-Risk Alerts</h3>
              <p className="text-xs text-slate-500">Updated daily</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Identify learners who may need additional support based on engagement and performance patterns.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-lg" aria-hidden="true">📈</span>
            <div>
              <h3 className="font-semibold text-slate-900">Session Engagement</h3>
              <p className="text-xs text-slate-500">Generated weekly</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Monitor tutor session frequency, duration, and engagement metrics across your learners.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg" aria-hidden="true">🎯</span>
            <div>
              <h3 className="font-semibold text-slate-900">IEP Progress</h3>
              <p className="text-xs text-slate-500">Generated monthly</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Track IEP goal progress for learners with individualized education plans.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">{t("student_overview")}</h2>
        {learners.length === 0 ? (
          <p className="text-sm text-slate-500">No learners connected. Reports will appear once parents invite you to their learner teams.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase">Learner</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase">Grade</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase">Functioning Level</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {learners.map(l => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{l.name}</td>
                    <td className="py-3 px-4 text-slate-600">{l.gradeLevel || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                        {l.functioningLevel || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
