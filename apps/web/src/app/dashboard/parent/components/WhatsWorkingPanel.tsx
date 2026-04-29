"use client";
/**
 * "What's working" panel for the parent dashboard.
 *
 * Strategic backdrop: today's parent dashboard reports counts ("12
 * lessons completed"). That's the wrong question. Parents need
 * pattern recognition they can take to an IEP meeting:
 *   • which times of day produce the best learning,
 *   • which subject + modality combinations are spiking frustration,
 *   • which modality clicks for the learner overall.
 *
 * This component is a thin renderer over the GET
 * `/api/family/whats-working/:learnerId` route. The route fetches
 * real session-outcome rows from the `ef_session_outcomes` ledger and
 * runs them through the pure analytics module — *no* synthetic data.
 */
import { useEffect, useState } from "react";
import { Sparkles, Clock, AlertTriangle, Eye, TrendingUp } from "lucide-react";

type Modality = "visual" | "auditory" | "kinesthetic" | "reading";
type TimeOfDay =
  | "early-morning"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening";

interface TimeOfDayInsight {
  timeOfDay: TimeOfDay;
  sessions: number;
  meanAccuracy: number;
  meanFrustration: number;
  meanAttentionMinutes: number;
  score: number;
}
interface FrustrationHotspot {
  subject: string;
  modality: Modality | "unknown";
  sessions: number;
  meanFrustration: number;
}
interface ModalityFitInsight {
  modality: Modality;
  sessions: number;
  meanAccuracy: number;
  meanAttentionMinutes: number;
}
interface WhatsWorkingInsights {
  totalSessions: number;
  windowDays: number;
  bestWindow: TimeOfDayInsight | null;
  timeOfDay: TimeOfDayInsight[];
  hotspots: FrustrationHotspot[];
  modalityFit: ModalityFitInsight[];
}

const TIME_LABEL: Record<TimeOfDay, string> = {
  "early-morning": "Early morning",
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

const MODALITY_LABEL: Record<Modality, string> = {
  visual: "Visual",
  auditory: "Auditory",
  kinesthetic: "Hands-on",
  reading: "Reading",
};

interface Props {
  learnerId: string;
  learnerName: string;
  accessToken: string | null;
  /** Override base URL for tests / SSR previews. */
  apiBase?: string;
}

export function WhatsWorkingPanel({
  learnerId,
  learnerName,
  accessToken,
  apiBase = "",
}: Props) {
  const [data, setData] = useState<WhatsWorkingInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !learnerId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${apiBase}/api/family/whats-working/${learnerId}?windowDays=30`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as WhatsWorkingInsights;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [learnerId, accessToken, apiBase]);

  if (loading) {
    return (
      <div className="vi-card p-5">
        <div className="text-sm vi-text-muted">Loading what's working for {learnerName}…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="vi-card p-5">
        <div className="flex items-center gap-2 text-sm vi-text-muted">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Couldn't load patterns ({error}).</span>
        </div>
      </div>
    );
  }
  if (!data || data.totalSessions === 0) {
    return (
      <div className="vi-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} aria-hidden="true" />
          <h3 className="text-base font-heading font-bold">What's working — {learnerName}</h3>
        </div>
        <p className="text-sm vi-text-muted">
          No sessions in the last 30 days yet. Patterns will appear here as {learnerName} learns.
        </p>
      </div>
    );
  }

  const topModality = data.modalityFit[0];

  return (
    <section
      className="vi-card p-5 lg:p-6"
      aria-label={`What's working for ${learnerName}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} aria-hidden="true" />
        <h3 className="text-base font-heading font-bold">
          What's working — {learnerName}
        </h3>
        <span className="ml-auto text-xs vi-text-muted">
          {data.totalSessions} sessions · last {data.windowDays} days
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Best window */}
        <div className="rounded-md border p-3">
          <div className="flex items-center gap-2 text-xs vi-text-muted">
            <Clock size={14} aria-hidden="true" />
            <span>Best learning window</span>
          </div>
          {data.bestWindow ? (
            <div className="mt-1">
              <div className="text-lg font-bold">
                {TIME_LABEL[data.bestWindow.timeOfDay]}
              </div>
              <div className="text-xs vi-text-muted">
                {Math.round(data.bestWindow.meanAccuracy * 100)}% accuracy ·{" "}
                {Math.round(data.bestWindow.meanAttentionMinutes)} min attention
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm vi-text-muted">
              Need a few more sessions to call a pattern.
            </div>
          )}
        </div>

        {/* Top modality */}
        <div className="rounded-md border p-3">
          <div className="flex items-center gap-2 text-xs vi-text-muted">
            <Eye size={14} aria-hidden="true" />
            <span>Modality that clicks</span>
          </div>
          {topModality ? (
            <div className="mt-1">
              <div className="text-lg font-bold">
                {MODALITY_LABEL[topModality.modality]}
              </div>
              <div className="text-xs vi-text-muted">
                {Math.round(topModality.meanAccuracy * 100)}% accuracy across{" "}
                {topModality.sessions} session{topModality.sessions === 1 ? "" : "s"}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm vi-text-muted">
              No modality data yet.
            </div>
          )}
        </div>

        {/* Hotspot */}
        <div className="rounded-md border p-3">
          <div className="flex items-center gap-2 text-xs vi-text-muted">
            <TrendingUp size={14} aria-hidden="true" />
            <span>Where frustration spikes</span>
          </div>
          {data.hotspots.length > 0 ? (
            <div className="mt-1">
              <div className="text-lg font-bold capitalize">
                {data.hotspots[0].subject} ·{" "}
                {data.hotspots[0].modality === "unknown"
                  ? "mixed"
                  : MODALITY_LABEL[data.hotspots[0].modality]}
              </div>
              <div className="text-xs vi-text-muted">
                {Math.round(data.hotspots[0].meanFrustration * 100)}% frustration
                across {data.hotspots[0].sessions} session
                {data.hotspots[0].sessions === 1 ? "" : "s"}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm vi-text-muted">
              No frustration patterns to flag — nice.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
