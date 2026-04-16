"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";
import LearnerCardSkeleton from "@/components/states/LearnerCardSkeleton";
import FetchErrorState from "@/components/states/FetchErrorState";
import EmptyLearnerState from "@/components/states/EmptyLearnerState";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

interface ClassroomGroup {
  grade: string;
  learners: ConnectedLearner[];
}

export default function TeacherOverviewPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("teacher");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expandedLearner, setExpandedLearner] = useState<string | null>(null);

  const fetchLearners = useCallback(async () => {
    if (!accessToken || !user) return;
    setFetchError(false);
    setLoadingLearners(true);
    try {
      const r = await fetch("/api/family/collaboration/connected-learners", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!r.ok) { setFetchError(true); return; }
      const data = await r.json();
      setLearners(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingLearners(false);
    }
  }, [accessToken, user]);

  useEffect(() => { fetchLearners(); }, [fetchLearners]);

  if (loading || !user) return null;

  const classrooms: ClassroomGroup[] = Object.values(
    learners.reduce((acc: Record<string, ClassroomGroup>, l) => {
      const grade = l.gradeLevel || "Unassigned";
      if (!acc[grade]) acc[grade] = { grade, learners: [] };
      acc[grade].learners.push(l);
      return acc;
    }, {})
  );

  const totalLearners = learners.length;
  const functioningLevels = learners.reduce((acc: Record<string, number>, l) => {
    const level = l.functioningLevel || "Pending";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-heading font-bold text-slate-900">{t("my_classes")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Learners</p>
          <p className="text-3xl font-bold text-slate-900">{totalLearners}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Grade Groups</p>
          <p className="text-3xl font-bold text-blue-600">{classrooms.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Functioning Levels</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(functioningLevels).map(([level, count]) => (
              <span key={level} className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 font-medium">
                {level}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Quick Actions</p>
          <div className="flex flex-col gap-1 mt-1">
            <a href="/dashboard/teacher/reports" className="text-xs text-blue-600 hover:underline font-medium">View Reports</a>
            <a href="/dashboard/teacher/settings" className="text-xs text-blue-600 hover:underline font-medium">Settings</a>
          </div>
        </div>
      </div>

      {loadingLearners ? (
        <LearnerCardSkeleton count={6} />
      ) : fetchError ? (
        <FetchErrorState title="Unable to load learners" onRetry={fetchLearners} />
      ) : learners.length === 0 ? (
        <EmptyLearnerState icon="\uD83D\uDCDA" />
      ) : (
        <div className="space-y-6">
          {classrooms.map(group => (
            <div key={group.grade} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold" aria-hidden="true">
                    {group.grade.replace(/[^0-9KkPp]/g, "").toUpperCase() || "?"}
                  </span>
                  <h3 className="font-heading font-bold text-slate-900">Grade {group.grade}</h3>
                  <span className="text-sm text-slate-500">{group.learners.length} learner{group.learners.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.learners.map(l => (
                    <div key={l.id}
                      className={`rounded-xl border transition ${expandedLearner === l.id ? "border-blue-300 bg-blue-50/30 shadow-md" : "border-slate-100 bg-white hover:shadow-sm hover:border-slate-200"}`}>
                      <button
                        type="button"
                        onClick={() => setExpandedLearner(expandedLearner === l.id ? null : l.id)}
                        aria-expanded={expandedLearner === l.id}
                        aria-controls={`learner-details-${l.id}`}
                        className="w-full text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{l.name}</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-primary font-bold">
                            {l.functioningLevel || "Pending"}
                          </span>
                        </div>
                        {l.gradeLevel && <p className="text-xs text-slate-500">Grade {l.gradeLevel}</p>}
                      </button>
                      {expandedLearner === l.id && accessToken && (
                        <div id={`learner-details-${l.id}`} className="px-4 pb-4 border-t border-slate-100">
                          <BrainVisualization learnerId={l.id} learnerName={l.name} accessToken={accessToken} compact />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
