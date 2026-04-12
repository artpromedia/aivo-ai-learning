"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Recommendation {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  payload: Record<string, unknown> | null;
  parentNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface Conflict {
  domain: string;
  description: string;
  conflictingRecommendations: Recommendation[];
}

const TYPE_LABELS: Record<string, string> = {
  brain_profile_review: "Brain Profile Review",
  path_adjustment: "Learning Path Adjustment",
  accommodation_add: "Add Accommodation",
  accommodation_remove: "Remove Accommodation",
  goal_suggestion: "Goal Suggestion",
  curriculum_shift: "Curriculum Shift",
  rebaseline: "Re-Baseline Assessment",
  brain_upgrade: "Brain Upgrade",
  regression_alert: "Regression Alert",
  tutor_suggestion: "Tutor Suggestion",
  functioning_level_change: "Functioning Level Change",
  iep_goal_met: "IEP Goal Met",
  iep_refresh: "IEP Refresh",
};

const TYPE_COLORS: Record<string, string> = {
  regression_alert: "bg-red-50 border-red-200 text-red-700",
  brain_upgrade: "bg-green-50 border-green-200 text-green-700",
  iep_goal_met: "bg-green-50 border-green-200 text-green-700",
  accommodation_add: "bg-blue-50 border-blue-200 text-blue-700",
  goal_suggestion: "bg-purple-50 border-purple-200 text-purple-700",
};

export default function RecommendationsPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const learnerId = params.id as string;

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!accessToken || !learnerId) return;
    try {
      const [recsRes, conflictsRes] = await Promise.all([
        fetch(`/api/family/recommendations/${learnerId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`/api/family/recommendations/${learnerId}/conflicts`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);
      if (recsRes.ok) setRecs(await recsRes.json());
      if (conflictsRes.ok) {
        const data = await conflictsRes.json();
        setConflicts(data.conflicts || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    }
  };

  useEffect(() => { fetchData(); }, [accessToken, learnerId]);

  const respondToRec = async (recId: string, action: string) => {
    try {
      const res = await fetch(`/api/family/recommendations/${learnerId}/${recId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ action, notes: responseNotes }),
      });
      if (res.ok) {
        setRespondingTo(null);
        setResponseNotes("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to respond to recommendation:", err);
    }
  };

  if (loading || !user) return null;

  const pendingRecs = recs.filter(r => r.status === "PENDING");
  const resolvedRecs = recs.filter(r => r.status !== "PENDING");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50">
      <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/parent")}
            className="text-sm text-slate-500 hover:text-primary font-semibold">Back to Dashboard</button>
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Recommendation Inbox</h1>
          <p className="text-slate-500 mt-1">Review and respond to Brain recommendations for your learner</p>
        </div>

        {conflicts.length > 0 && (
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <h3 className="font-heading font-bold text-amber-800 mb-2">Conflicts Detected</h3>
            <p className="text-sm text-amber-700 mb-3">Multiple recommendations are pending in the same area. Review carefully.</p>
            {conflicts.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-100/50 mb-2 text-sm text-amber-800">
                <span className="font-bold">{c.domain}:</span> {c.description}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === "pending" ? "bg-white border border-b-white text-primary -mb-[1px]" : "text-slate-400 hover:text-slate-600"}`}>
            Pending ({pendingRecs.length})
          </button>
          <button onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === "history" ? "bg-white border border-b-white text-primary -mb-[1px]" : "text-slate-400 hover:text-slate-600"}`}>
            History ({resolvedRecs.length})
          </button>
        </div>

        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingRecs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-slate-500 font-semibold">No pending recommendations. All caught up!</p>
              </div>
            ) : (
              pendingRecs.map(rec => (
                <div key={rec.id} className={`rounded-2xl p-5 border shadow-sm ${TYPE_COLORS[rec.type] || "bg-white border-slate-100"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                        {TYPE_LABELS[rec.type] || rec.type}
                      </span>
                      <h3 className="font-heading font-bold text-lg mt-1">{rec.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                  {rec.description && <p className="text-sm mb-4 opacity-80">{rec.description}</p>}

                  {respondingTo === rec.id ? (
                    <div className="space-y-3 mt-3 p-3 rounded-xl bg-white/50">
                      <textarea value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-body resize-none h-20" />
                      <div className="flex gap-2">
                        <button onClick={() => respondToRec(rec.id, "APPROVED")}
                          className="px-4 py-2 rounded-full bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition">
                          Approve
                        </button>
                        <button onClick={() => respondToRec(rec.id, "ADJUSTED")}
                          className="px-4 py-2 rounded-full bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition">
                          Adjust
                        </button>
                        <button onClick={() => respondToRec(rec.id, "DECLINED")}
                          className="px-4 py-2 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition">
                          Decline
                        </button>
                        <button onClick={() => setRespondingTo(null)}
                          className="px-4 py-2 rounded-full bg-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-300 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setRespondingTo(rec.id)}
                      className="px-5 py-2 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary-dark transition">
                      Respond
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            {resolvedRecs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-slate-500 font-semibold">No resolved recommendations yet.</p>
              </div>
            ) : (
              resolvedRecs.map(rec => (
                <div key={rec.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">{TYPE_LABELS[rec.type] || rec.type}</span>
                    <div className="font-heading font-bold text-slate-800">{rec.title}</div>
                    {rec.parentNotes && <p className="text-xs text-slate-400 mt-1">Note: {rec.parentNotes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                      rec.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      rec.status === "DECLINED" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{rec.status}</span>
                    <span className="text-xs text-slate-400">
                      {rec.resolvedAt ? new Date(rec.resolvedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
