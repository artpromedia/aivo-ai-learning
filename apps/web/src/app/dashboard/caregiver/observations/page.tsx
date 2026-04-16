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

interface Observation {
  id: string;
  learnerId: string;
  category: string;
  notes: string;
  mood: string;
  date: string;
  createdAt: string;
}

const MOOD_OPTIONS = [
  { value: "great", label: "Great", emoji: "\uD83D\uDE04" },
  { value: "good", label: "Good", emoji: "\uD83D\uDE0A" },
  { value: "okay", label: "Okay", emoji: "\uD83D\uDE10" },
  { value: "challenging", label: "Challenging", emoji: "\uD83D\uDE1F" },
  { value: "difficult", label: "Difficult", emoji: "\uD83D\uDE22" },
];

const CATEGORIES = [
  "Behavior",
  "Communication",
  "Social Interaction",
  "Self-Care",
  "Academic",
  "Motor Skills",
  "Sensory",
  "Sleep",
  "Nutrition",
  "General",
];

export default function CaregiverObservationsPage() {
  const { user, accessToken, loading } = useAuth();
  const t = useTranslations("caregiver");
  const [learners, setLearners] = useState<ConnectedLearner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [obsNotes, setObsNotes] = useState("");
  const [obsCategory, setObsCategory] = useState("General");
  const [obsMood, setObsMood] = useState("good");
  const [obsDate, setObsDate] = useState(new Date().toISOString().slice(0, 10));
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
    fetch(`/api/family/observations?learnerId=${selectedLearner}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : { observations: [] })
      .then(data => setObservations(Array.isArray(data?.observations) ? data.observations : Array.isArray(data) ? data : []))
      .catch(() => setObservations([]));
  }, [selectedLearner, accessToken]);

  const handleSubmit = async () => {
    if (!accessToken || !selectedLearner || !obsNotes.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch("/api/family/observations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          learnerId: selectedLearner,
          category: obsCategory,
          notes: obsNotes,
          mood: obsMood,
          date: obsDate,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const newObs = await res.json();
      setObservations(prev => [newObs, ...prev]);
      setObsNotes("");
      setSubmitMsg({ type: "success", text: "Observation recorded successfully" });
    } catch {
      setSubmitMsg({ type: "error", text: "Could not save observation. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-heading font-bold text-slate-900">Observations</h1>

      {loadingData ? (
        <LearnerCardSkeleton count={3} />
      ) : fetchError ? (
        <FetchErrorState title="Unable to load data" onRetry={fetchData} />
      ) : learners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <div className="text-5xl mb-4" aria-hidden="true">📝</div>
          <p className="text-slate-700 font-heading font-bold text-xl">No learners connected yet</p>
          <p className="text-sm text-slate-500 mt-2">Connect with learners to start recording observations.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 flex-wrap">
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

          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-heading font-bold text-slate-900">New Observation</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="obs-category" className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select id="obs-category" value={obsCategory} onChange={e => setObsCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="obs-date" className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input id="obs-date" type="date" value={obsDate} onChange={e => setObsDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <span id="mood-label" className="block text-sm font-semibold text-slate-700 mb-1">Mood</span>
                <div className="flex gap-2" role="radiogroup" aria-labelledby="mood-label">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={obsMood === m.value}
                      onClick={() => setObsMood(m.value)}
                      title={m.label}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${obsMood === m.value ? "bg-green-100 ring-2 ring-green-500" : "bg-slate-50 hover:bg-slate-100"}`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="obs-notes" className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea id="obs-notes" value={obsNotes} onChange={e => setObsNotes(e.target.value)}
                rows={4} placeholder="Describe what you observed..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
            </div>

            {submitMsg && (
              <p className={`text-sm font-medium ${submitMsg.type === "success" ? "text-green-600" : "text-red-600"}`} role="alert">
                {submitMsg.text}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !obsNotes.trim()}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              {submitting ? "Saving..." : "Save Observation"}
            </button>
          </div>

          {observations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-heading font-bold text-slate-900">Recent Observations</h2>
              {observations.map(obs => (
                <div key={obs.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 font-bold">{obs.category}</span>
                      <span className="text-xs text-slate-400">{new Date(obs.date || obs.createdAt).toLocaleDateString()}</span>
                    </div>
                    {obs.mood && (
                      <span className="text-lg" aria-label={`Mood: ${obs.mood}`}>
                        {MOOD_OPTIONS.find(m => m.value === obs.mood)?.emoji || ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{obs.notes}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
