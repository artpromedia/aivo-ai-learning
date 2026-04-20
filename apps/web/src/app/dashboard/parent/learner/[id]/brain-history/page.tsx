"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Brain, Clock, ChevronDown, ChevronRight } from "lucide-react";

interface Snapshot {
  id: string;
  brain_state_id?: string;
  learner_id: string;
  version: number;
  trigger: string | null;
  created_at: string;
  snapshot?: any;
}

const TRIGGER_LABEL: Record<string, string> = {
  parent_approval: "Parent approved baseline",
  parent_amend: "Parent amended profile",
  parent_decline: "Parent declined recommendation",
  rollback: "Rolled back to earlier version",
  regression_check: "Regression check",
  engagement_update: "Engagement profile updated",
  initial_clone: "Initial brain created",
};

export default function BrainHistoryPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id: learnerId } = useParams() as { id: string };

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !accessToken) return;
    const ctl = new AbortController();
    fetch(`/api/brain/${learnerId}/history`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: ctl.signal })
      .then(r => r.ok ? r.json() : [])
      .then(d => setSnapshots(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [user, accessToken, learnerId]);

  async function toggle(snap: Snapshot) {
    if (expanded === snap.id) {
      setExpanded(null);
      return;
    }
    setExpanded(snap.id);
    if (!details[snap.id] && accessToken) {
      const res = await fetch(`/api/brain/snapshots/detail/${snap.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => ({ ...prev, [snap.id]: data }));
      }
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="vi-bg min-h-screen">
      <header className="bg-[hsl(var(--visual-surface)/0.95)] backdrop-blur border-b vi-border px-8 py-4 flex items-center justify-between">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={100} height={30} style={{ height: "auto" }} />
        <button onClick={() => router.push(`/dashboard/parent/learner/${learnerId}`)} className="text-sm vi-text-muted hover:text-[hsl(var(--visual-primary))] font-semibold">
          ← Back to learner
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold vi-text">Brain History</h1>
          <p className="vi-text-muted">Every change we&apos;ve recorded to your child&apos;s learning profile</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-[hsl(var(--visual-primary)/0.2)] border-t-[hsl(var(--visual-primary))] rounded-full animate-spin mx-auto" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="vi-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] flex items-center justify-center">
              <Brain size={28} />
            </div>
            <p className="font-semibold vi-text">No history yet</p>
            <p className="text-sm vi-text-muted mt-1">Brain snapshots appear here whenever the profile changes.</p>
          </div>
        ) : (
          <ol className="relative border-l-2 vi-border ml-3 space-y-4">
            {snapshots.map(snap => {
              const open = expanded === snap.id;
              const detail = details[snap.id];
              const stateData = detail?.snapshot ?? snap.snapshot;
              return (
                <li key={snap.id} className="ml-6">
                  <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--visual-primary))] text-white">
                    <Brain size={10} />
                  </span>
                  <button
                    onClick={() => toggle(snap)}
                    aria-expanded={open}
                    aria-controls={`snap-detail-${snap.id}`}
                    className="w-full text-left vi-card p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">
                          v{snap.version} · {TRIGGER_LABEL[snap.trigger || ""] || snap.trigger || "Update"}
                        </p>
                        <p className="text-xs vi-text-muted flex items-center gap-1 mt-1">
                          <Clock size={12} /> {new Date(snap.created_at).toLocaleString()}
                        </p>
                      </div>
                      {open ? <ChevronDown size={18} className="vi-text-muted" /> : <ChevronRight size={18} className="vi-text-muted" />}
                    </div>
                    {open && (
                      <div id={`snap-detail-${snap.id}`} className="mt-4 pt-4 border-t vi-border space-y-2 text-sm">
                        {!detail && <p className="vi-text-muted text-xs">Loading detail…</p>}
                        {stateData && (
                          <>
                            {stateData.functioning_level_profile?.level && (
                              <Row label="Functioning level" value={stateData.functioning_level_profile.level} />
                            )}
                            {stateData.curriculum_alignment?.grade_band && (
                              <Row label="Grade band" value={stateData.curriculum_alignment.grade_band} />
                            )}
                            {stateData.mastery_levels && (
                              <Row
                                label="Tracked skills"
                                value={`${Object.keys(stateData.mastery_levels).length} skills`}
                              />
                            )}
                            {stateData.active_accommodations?.length > 0 && (
                              <Row
                                label="Accommodations"
                                value={stateData.active_accommodations.slice(0, 4).join(", ")}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="vi-text-muted">{label}</span>
      <span className="font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}
