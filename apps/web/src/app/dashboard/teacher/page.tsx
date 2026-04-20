"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import BrainVisualization from "@/components/BrainVisualization";
import { useTranslations } from "next-intl";
import LearnerCardSkeleton from "@/components/states/LearnerCardSkeleton";
import FetchErrorState from "@/components/states/FetchErrorState";
import EmptyLearnerState from "@/components/states/EmptyLearnerState";
import {
  Users,
  GraduationCap,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Settings,
  Target,
} from "lucide-react";

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

const LEVEL_STYLES: Record<string, string> = {
  STANDARD: "bg-green-50 text-green-700 border-green-200",
  SUPPORTED: "bg-blue-50 text-blue-700 border-blue-200",
  LOW_VERBAL: "bg-amber-50 text-amber-700 border-amber-200",
  NON_VERBAL: "bg-orange-50 text-orange-700 border-orange-200",
  PRE_SYMBOLIC: "bg-pink-50 text-pink-700 border-pink-200",
};

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
      if (!r.ok) {
        setFetchError(true);
        return;
      }
      const data = await r.json();
      setLearners(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingLearners(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    fetchLearners();
  }, [fetchLearners]);

  if (loading || !user) return null;

  const classrooms: ClassroomGroup[] = Object.values(
    learners.reduce((acc: Record<string, ClassroomGroup>, l) => {
      const grade = l.gradeLevel || "Unassigned";
      if (!acc[grade]) acc[grade] = { grade, learners: [] };
      acc[grade].learners.push(l);
      return acc;
    }, {}),
  );

  const totalLearners = learners.length;
  const functioningLevels = learners.reduce((acc: Record<string, number>, l) => {
    const level = l.functioningLevel || "Pending";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-subject-reading-soft text-subject-reading flex items-center justify-center shadow-sm shrink-0">
          <GraduationCap size={28} strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 leading-tight">
            {t("my_classes")}
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Your classroom at a glance.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-subject-reading-soft to-white rounded-3xl p-5 border-2 border-blue-100 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-subject-reading mb-3">
            <Users size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-3xl font-black text-subject-reading leading-none">
            {totalLearners}
          </p>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mt-1.5">
            Total Learners
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl p-5 border-2 border-purple-100 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary mb-3">
            <Layers size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-3xl font-black text-primary leading-none">
            {classrooms.length}
          </p>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mt-1.5">
            Grade Groups
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-primary flex items-center justify-center mb-3">
            <Target size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">
            Functioning Levels
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(functioningLevels).map(([level, count]) => (
              <span
                key={level}
                className={`px-2 py-0.5 text-[11px] rounded-full font-bold border ${LEVEL_STYLES[level] || "bg-slate-50 text-slate-700 border-slate-200"}`}
              >
                {level}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-slate-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Sparkles size={22} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">
            Quick Actions
          </p>
          <div className="flex flex-col gap-1.5">
            <a
              href="/dashboard/teacher/reports"
              className="inline-flex items-center gap-1.5 text-sm text-subject-reading hover:underline font-bold"
            >
              <FileText size={14} strokeWidth={2.5} aria-hidden="true" />
              View Reports
            </a>
            <a
              href="/dashboard/teacher/settings"
              className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:underline font-bold"
            >
              <Settings size={14} strokeWidth={2.5} aria-hidden="true" />
              Settings
            </a>
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
          {classrooms.map((group) => (
            <div
              key={group.grade}
              className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-2xl bg-subject-reading-soft text-subject-reading flex items-center justify-center text-sm font-black"
                    aria-hidden="true"
                  >
                    {group.grade.replace(/[^0-9KkPp]/g, "").toUpperCase() || "?"}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-slate-900">
                      Grade {group.grade}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      {group.learners.length} learner
                      {group.learners.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.learners.map((l) => {
                    const isOpen = expandedLearner === l.id;
                    return (
                      <div
                        key={l.id}
                        className={`rounded-2xl border-2 transition-all ${
                          isOpen
                            ? "border-subject-reading bg-blue-50/40 shadow-md"
                            : "border-slate-100 bg-white hover:shadow-sm hover:border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedLearner(isOpen ? null : l.id)}
                          aria-expanded={isOpen}
                          aria-controls={`learner-details-${l.id}`}
                          className="w-full text-left p-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                              {l.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 truncate">
                                {l.name}
                              </h4>
                              {l.gradeLevel && (
                                <p className="text-xs text-slate-500 font-semibold">
                                  Grade {l.gradeLevel}
                                </p>
                              )}
                            </div>
                            {isOpen ? (
                              <ChevronUp
                                size={18}
                                strokeWidth={2.5}
                                className="text-subject-reading shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                size={18}
                                strokeWidth={2.5}
                                className="text-slate-400 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] rounded-full font-bold border ${LEVEL_STYLES[l.functioningLevel] || "bg-purple-50 text-primary border-purple-200"}`}
                          >
                            <Target
                              size={10}
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                            {l.functioningLevel || "Pending"}
                          </span>
                        </button>
                        {isOpen && accessToken && (
                          <div
                            id={`learner-details-${l.id}`}
                            className="px-4 pb-4 border-t border-blue-100"
                          >
                            <BrainVisualization
                              learnerId={l.id}
                              learnerName={l.name}
                              accessToken={accessToken}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
