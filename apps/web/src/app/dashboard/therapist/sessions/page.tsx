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

type SessionTab = "history" | "log";

export default function TherapistSessionsPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("therapist");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [tab, setTab] = useState<SessionTab>("history");

  const [logNotes, setLogNotes] = useState("");
  const [logCategory, setLogCategory] = useState("speech");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logDuration, setLogDuration] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    fetch(`/api/learning/sessions?learnerId=${selectedLearner}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));
  }, [selectedLearner, accessToken]);

  const handleLogSession = async () => {
    if (!accessToken || !selectedLearner) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch("/api/learning/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          learnerId: selectedLearner,
          tutorSku: `therapy-${logCategory}`,
          topic: logNotes.slice(0, 100) || `${logCategory} session`,
          contentType: "THERAPY_SESSION",
        }),
      });
      if (!res.ok) throw new Error("Failed to log session");
      setSubmitMsg({ type: "success", text: "Session logged successfully" });
      setLogNotes("");
      const updated = await fetch(`/api/learning/sessions?learnerId=${selectedLearner}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.ok ? r.json() : []);
      setSessions(Array.isArray(updated) ? updated : []);
    } catch {
      setSubmitMsg({ type: "error", text: "Failed to log session. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const getLearnerName = (id: string) => learners.find(l => l.id === id)?.name || "Unknown";

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">Session Logs</h1>

      {loadingData ? (
        <LearnerCardSkeleton count={3} />
      ) : fetchError ? (
        <FetchErrorState title="Unable to load data" onRetry={fetchData} />
      ) : learners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-5xl mb-4" aria-hidden="true">📅</div>
          <p className="text-slate-700 font-heading font-bold text-xl">No clients connected yet</p>
          <p className="text-sm text-slate-500 mt-2">Connect with learners to start logging sessions.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <select value={selectedLearner || ""} onChange={e => setSelectedLearner(e.target.value)}
              aria-label="Select client"
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white shadow-sm">
              {learners.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-200 overflow-hidden" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "history"}
                onClick={() => setTab("history")}
                className={`px-4 py-2 text-sm font-semibold transition ${tab === "history" ? "bg-pink-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                History
              </button>
              <button type="button" role="tab" aria-selected={tab === "log"}
                onClick={() => setTab("log")}
                className={`px-4 py-2 text-sm font-semibold transition ${tab === "log" ? "bg-pink-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                Log Session
              </button>
            </div>
          </div>

          {tab === "history" ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500 text-sm">No sessions recorded yet for {getLearnerName(selectedLearner || "")}.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <caption className="sr-only">Session history for {getLearnerName(selectedLearner || "")}</caption>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Date</th>
                      <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Subject</th>
                      <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Type</th>
                      <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Duration</th>
                      <th scope="col" className="text-left px-6 py-3 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/30">
                        <td className="px-6 py-3 text-slate-600">{new Date(s.startedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-slate-900 font-medium">{s.subject}</td>
                        <td className="px-6 py-3 text-slate-600">{s.contentType}</td>
                        <td className="px-6 py-3 text-slate-600">{formatDuration(s.durationSeconds)}</td>
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
          ) : (
            <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 space-y-4 max-w-2xl">
              <h2 className="text-lg font-heading font-bold text-slate-900">Log a Therapy Session</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session-category" className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select id="session-category" value={logCategory} onChange={e => setLogCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                    <option value="speech">Speech &amp; Language</option>
                    <option value="occupational">Occupational Therapy</option>
                    <option value="behavioral">Behavioral Therapy</option>
                    <option value="physical">Physical Therapy</option>
                    <option value="sel">Social-Emotional</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="session-date" className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input id="session-date" type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <div>
                  <label htmlFor="session-duration" className="block text-sm font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input id="session-duration" type="number" min="5" max="180" value={logDuration} onChange={e => setLogDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                </div>
              </div>

              <div>
                <label htmlFor="session-notes" className="block text-sm font-semibold text-slate-700 mb-1">Session Notes</label>
                <textarea id="session-notes" value={logNotes} onChange={e => setLogNotes(e.target.value)}
                  rows={4} placeholder="Document session observations, goals worked on, progress notes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
              </div>

              {submitMsg && (
                <p className={`text-sm font-medium ${submitMsg.type === "success" ? "text-green-600" : "text-red-600"}`} role="alert">
                  {submitMsg.text}
                </p>
              )}

              <button
                type="button"
                onClick={handleLogSession}
                disabled={submitting || !selectedLearner}
                className="px-6 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-sm hover:bg-pink-700 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
              >
                {submitting ? "Saving..." : "Log Session"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
