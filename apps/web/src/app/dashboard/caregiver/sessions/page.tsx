"use client";
import { useAuth } from "@/providers/auth-provider";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import LearnerCardSkeleton from "@/components/states/LearnerCardSkeleton";
import FetchErrorState from "@/components/states/FetchErrorState";

interface ConnectedLearner {
  id: string;
  name: string;
  functioningLevel: string;
  gradeLevel: string;
}

interface SessionEntry {
  id: string;
  learnerId: string;
  subject: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  xpEarned?: number;
  tutorSku: string;
  contentType: string;
}

export default function CaregiverSessionsPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("caregiver");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken || !user) return;
    setFetchError(false);
    setLoadingData(true);
    try {
      const learnersData = await fetch("/api/family/collaboration/connected-learners", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : []);
      const parsed = Array.isArray(learnersData) ? learnersData : [];
      setLearners(parsed);
      if (parsed.length > 0 && !selectedLearner) setSelectedLearner(parsed[0].id);
    } catch {
      setFetchError(true);
    } finally {
      setLoadingData(false);
    }
  }, [accessToken, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedLearner || !accessToken) return;
    setLoadingSessions(true);
    fetch(`/api/learning/sessions?learnerId=${selectedLearner}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [selectedLearner, accessToken]);

  if (loading || !user) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const completedCount = sessions.filter(s => s.status === "COMPLETED").length;
  const totalXp = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / sessions.length / 60)
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-6 flex-wrap">
        <h1 className="text-3xl font-heading font-bold text-slate-900">Session History</h1>
        {learners.length > 1 && (
          <select value={selectedLearner || ""} onChange={e => setSelectedLearner(e.target.value)}
            aria-label="Select learner"
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white shadow-sm">
            {learners.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
      </div>

      {loadingData ? (
        <LearnerCardSkeleton count={3} />
      ) : fetchError ? (
        <FetchErrorState title="Unable to load data" onRetry={fetchData} />
      ) : learners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-5xl mb-4" aria-hidden="true">📅</div>
          <p className="text-slate-700 font-heading font-bold text-xl">No learners connected yet</p>
          <p className="text-sm text-slate-500 mt-2">Connect with learners to view their session history.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Completed Sessions</p>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total XP Earned</p>
              <p className="text-3xl font-bold text-slate-900">{totalXp}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Duration</p>
              <p className="text-3xl font-bold text-slate-900">{avgDuration > 0 ? `${avgDuration}m` : "—"}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loadingSessions ? (
              <div className="p-12 text-center">
                <div className="animate-pulse text-slate-400" role="status">Loading sessions...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-500 text-sm">No learning sessions recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <caption className="sr-only">Learning session history</caption>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Date</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Subject</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Duration</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">XP</th>
                    <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <td className="px-6 py-3 text-slate-600">{new Date(s.startedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-slate-900 font-medium">{s.subject}</td>
                      <td className="px-6 py-3 text-slate-600">{formatDuration(s.durationSeconds)}</td>
                      <td className="px-6 py-3 text-slate-600">{s.xpEarned || 0}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${s.status === "COMPLETED" ? "bg-green-50 text-green-700" : s.status === "CONTENT_READY" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
