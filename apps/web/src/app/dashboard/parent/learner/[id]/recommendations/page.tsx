"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { IconWell } from "@/components/discovery/_vi";

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
  regression_alert: "bg-[hsl(var(--visual-math)/0.06)] border-[hsl(var(--visual-math)/0.3)] text-[hsl(var(--visual-math))]",
  brain_upgrade: "bg-[hsl(var(--visual-science)/0.06)] border-[hsl(var(--visual-science)/0.3)] text-[hsl(var(--visual-science))]",
  iep_goal_met: "bg-[hsl(var(--visual-science)/0.06)] border-[hsl(var(--visual-science)/0.3)] text-[hsl(var(--visual-science))]",
  accommodation_add: "bg-[hsl(var(--visual-reading)/0.06)] border-[hsl(var(--visual-reading)/0.3)] text-[hsl(var(--visual-reading))]",
  goal_suggestion: "bg-[hsl(var(--visual-primary)/0.06)] border-[hsl(var(--visual-primary)/0.3)] text-[hsl(var(--visual-primary))]",
};

export default function RecommendationsPage() {
  const { user, accessToken, loading } = useAuth();
  const params = useParams();
  const learnerId = params.id as string;
  const t = useTranslations("parent");
  const tCommon = useTranslations("common");

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState("");

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold vi-text">{t("recommendation_inbox")}</h1>
        <p className="vi-text-muted mt-1">{t("recommendation_desc")}</p>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-2xl p-5 border bg-[hsl(var(--visual-sel)/0.08)] border-[hsl(var(--visual-sel)/0.3)]">
          <h3 className="font-heading font-bold text-[hsl(var(--visual-sel))] mb-2">{t("conflicts_detected")}</h3>
          <p className="text-sm text-[hsl(var(--visual-sel))] mb-3">{t("conflicts_desc")}</p>
          {conflicts.map((c, i) => (
            <div key={i} className="p-3 rounded-xl bg-[hsl(var(--visual-sel)/0.12)] mb-2 text-sm text-[hsl(var(--visual-sel))]">
              <span className="font-bold">{c.domain}:</span> {c.description}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b vi-border pb-1">
        <button onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === "pending" ? "bg-white border vi-border border-b-white text-[hsl(var(--visual-primary))] -mb-[1px]" : "vi-text-muted hover:vi-text"}`}>
          {t("pending_count", { count: pendingRecs.length })}
        </button>
        <button onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition ${activeTab === "history" ? "bg-white border vi-border border-b-white text-[hsl(var(--visual-primary))] -mb-[1px]" : "vi-text-muted hover:vi-text"}`}>
          {t("history_count", { count: resolvedRecs.length })}
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingRecs.length === 0 ? (
            <div className="vi-card p-12 text-center">
              <div className="flex justify-center mb-3">
                <IconWell color="science" size="lg"><CheckCircle2 className="w-10 h-10" /></IconWell>
              </div>
              <p className="vi-text-muted font-semibold">{t("no_pending")}</p>
            </div>
          ) : (
            pendingRecs.map(rec => (
              <div key={rec.id} className={`rounded-2xl p-5 border shadow-sm ${TYPE_COLORS[rec.type] || "vi-card"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                      {TYPE_LABELS[rec.type] || rec.type}
                    </span>
                    <h3 className="font-heading font-bold text-lg mt-1">{rec.title}</h3>
                  </div>
                  <span className="text-xs vi-text-muted">{new Date(rec.createdAt).toLocaleDateString()}</span>
                </div>
                {rec.description && <p className="text-sm mb-4 opacity-80">{rec.description}</p>}

                {respondingTo === rec.id ? (
                  <div className="space-y-3 mt-3 p-3 rounded-xl bg-white/50">
                    <textarea value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder={t("add_notes")}
                      className="w-full px-4 py-2.5 rounded-xl border vi-border outline-none text-sm font-body resize-none h-20" />
                    <div className="flex gap-2">
                      <button onClick={() => respondToRec(rec.id, "APPROVED")}
                        className="px-4 py-2 rounded-full bg-[hsl(var(--visual-science))] text-white font-bold text-sm hover:bg-[hsl(var(--visual-science)/0.9)] transition"
                        style={{ minHeight: 44 }}>
                        {t("approve")}
                      </button>
                      <button onClick={() => respondToRec(rec.id, "ADJUSTED")}
                        className="px-4 py-2 rounded-full bg-[hsl(var(--visual-sel))] text-white font-bold text-sm hover:bg-[hsl(var(--visual-sel)/0.9)] transition"
                        style={{ minHeight: 44 }}>
                        {t("adjust")}
                      </button>
                      <button onClick={() => respondToRec(rec.id, "DECLINED")}
                        className="px-4 py-2 rounded-full bg-[hsl(var(--visual-math))] text-white font-bold text-sm hover:bg-[hsl(var(--visual-math)/0.9)] transition"
                        style={{ minHeight: 44 }}>
                        {t("decline")}
                      </button>
                      <button onClick={() => setRespondingTo(null)}
                        className="px-4 py-2 rounded-full bg-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-300 transition"
                        style={{ minHeight: 44 }}>
                        {tCommon("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setRespondingTo(rec.id)}
                    className="px-5 py-2 rounded-full bg-[hsl(var(--visual-primary))] text-white font-heading font-black uppercase tracking-wider text-sm hover:bg-[hsl(var(--visual-primary)/0.9)] transition"
                    style={{ minHeight: 44 }}>
                    {t("respond")}
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
            <div className="vi-card p-12 text-center">
              <div className="flex justify-center mb-3">
                <IconWell color="primary" size="lg"><ClipboardList className="w-10 h-10" /></IconWell>
              </div>
              <p className="vi-text-muted font-semibold">{t("no_resolved")}</p>
            </div>
          ) : (
            resolvedRecs.map(rec => (
              <div key={rec.id} className="vi-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs vi-text-muted font-bold uppercase">{TYPE_LABELS[rec.type] || rec.type}</span>
                  <div className="font-heading font-bold text-slate-800">{rec.title}</div>
                  {rec.parentNotes && <p className="text-xs vi-text-muted mt-1">{t("note_label")}: {rec.parentNotes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                    rec.status === "APPROVED" ? "bg-[hsl(var(--visual-science)/0.12)] text-[hsl(var(--visual-science))]" :
                    rec.status === "DECLINED" ? "bg-[hsl(var(--visual-math)/0.12)] text-[hsl(var(--visual-math))]" :
                    "bg-[hsl(var(--visual-sel)/0.16)] text-[hsl(var(--visual-sel))]"
                  }`}>{rec.status}</span>
                  <span className="text-xs vi-text-muted">
                    {rec.resolvedAt ? new Date(rec.resolvedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
