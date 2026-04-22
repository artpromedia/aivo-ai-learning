"use client";
import { useAuth } from "@/providers/auth-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft, Save, Sparkles, Trash2, Plus, AlertCircle, CheckCircle2, Send,
} from "lucide-react";

const PLOP_AREAS = ["academic", "functional", "social", "motor", "communication"] as const;
const SECTIONS = ["plop", "goals", "accommodations", "services", "placement", "review"] as const;
type Section = typeof SECTIONS[number];

interface Profile {
  id: string;
  learnerId: string;
  source: string;
  lifecycleState: "draft" | "in_review" | "finalised" | "archived";
  gradeLevel?: string | null;
  placement?: string | null;
  reviewDate?: string | null;
  createdAt?: string | null;
  accommodations?: any[] | null;
  assistiveTechnology?: any[] | null;
  communicationSystem?: string | null;
  disabilityCategories?: string[] | null;
}
interface PresentLevel { id: string; area: string; narrative: string }
interface Goal {
  id: string; goalText: string; domain?: string | null;
  baseline?: string | null; targetCriteria?: string | null;
}
interface Service {
  id: string; serviceType: string; providerRole?: string | null;
  minutesPerWeek?: number | null; frequency?: string | null;
  location?: string | null; notes?: string | null;
}
interface Bundle { profile: Profile; presentLevels: PresentLevel[]; services: Service[]; goals: Goal[] }

export default function IepDraftEditorPage() {
  const { user, accessToken, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const learnerId = params.id as string;
  const t = useTranslations("iep_authoring");

  const [drafts, setDrafts] = useState<Profile[]>([]);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("plop");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [drafting, setDrafting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const headers = useMemo(() => accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined, [accessToken]);
  const lastSaved = useRef<number>(0);
  // Auto-save buffer is keyed by draft id so switching drafts mid-debounce
  // can never bleed edits from one profile into another.
  const pendingByDraft = useRef<Record<string, Record<string, any>>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fromEvalId = searchParams.get("fromEvaluation") || undefined;

  const refreshDrafts = useCallback(async () => {
    if (!headers) return;
    const r = await fetch(`/api/iep/drafts/learner/${learnerId}`, { headers });
    if (!r.ok) return;
    const list = await r.json();
    setDrafts(list);
    if (list.length > 0 && !activeId) setActiveId(list[0].id);
  }, [headers, learnerId, activeId]);

  const loadBundle = useCallback(async (id: string) => {
    if (!headers) return;
    const r = await fetch(`/api/iep/drafts/${id}`, { headers });
    if (r.ok) setBundle(await r.json());
  }, [headers]);

  useEffect(() => { refreshDrafts(); }, [refreshDrafts]);
  useEffect(() => { if (activeId) loadBundle(activeId); }, [activeId, loadBundle]);

  const createDraft = useCallback(async () => {
    if (!headers) return;
    setCreating(true);
    try {
      const r = await fetch("/api/iep/drafts", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, fromEvaluationId: fromEvalId }),
      });
      if (r.ok) {
        const p = await r.json();
        setDrafts((d) => [p, ...d]);
        setActiveId(p.id);
      }
    } finally { setCreating(false); }
  }, [headers, learnerId, fromEvalId]);

  // Schedule an auto-save (debounced 1s; fires at most every ~5s).
  // Each draft has its own pending-patch bucket so cross-draft edits cannot mix.
  const scheduleSave = useCallback((patch: Record<string, any>) => {
    if (!activeId) return;
    const draftId = activeId;
    const bucket = pendingByDraft.current[draftId] || {};
    pendingByDraft.current[draftId] = { ...bucket, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const wait = Math.max(1000, 5000 - (Date.now() - lastSaved.current));
    saveTimer.current = setTimeout(async () => {
      if (!headers) return;
      const body = pendingByDraft.current[draftId];
      if (!body) return;
      delete pendingByDraft.current[draftId];
      setSaveState("saving");
      try {
        const r = await fetch(`/api/iep/drafts/${draftId}`, {
          method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (r.ok) { setSaveState("saved"); lastSaved.current = Date.now(); }
        else setSaveState("error");
      } catch { setSaveState("error"); }
    }, wait);
  }, [activeId, headers]);

  const updateField = (field: keyof Profile, value: any) => {
    if (!bundle) return;
    setBundle({ ...bundle, profile: { ...bundle.profile, [field]: value } });
    scheduleSave({ [field]: value });
  };

  const savePresentLevel = useCallback(async (area: string, narrative: string) => {
    if (!activeId || !headers) return;
    setSaveState("saving");
    const r = await fetch(`/api/iep/drafts/${activeId}/present-levels/${area}`, {
      method: "PUT", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ narrative }),
    });
    if (r.ok) { setSaveState("saved"); lastSaved.current = Date.now(); }
    else setSaveState("error");
  }, [activeId, headers]);

  const addGoal = async () => {
    if (!activeId || !headers) return;
    const r = await fetch(`/api/iep/drafts/${activeId}/goals`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ goalText: "" }),
    });
    if (r.ok && bundle) setBundle({ ...bundle, goals: [...bundle.goals, await r.json()] });
  };

  const updateGoal = (goalId: string, patch: Partial<Goal>) => {
    if (!bundle) return;
    setBundle({ ...bundle, goals: bundle.goals.map((g) => g.id === goalId ? { ...g, ...patch } : g) });
  };

  const persistGoal = async (goalId: string, patch: Partial<Goal>) => {
    if (!activeId || !headers) return;
    setSaveState("saving");
    const r = await fetch(`/api/iep/drafts/${activeId}/goals/${goalId}`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) { setSaveState("saved"); lastSaved.current = Date.now(); }
    else setSaveState("error");
  };

  const deleteGoal = async (goalId: string) => {
    if (!activeId || !headers) return;
    const r = await fetch(`/api/iep/drafts/${activeId}/goals/${goalId}`, { method: "DELETE", headers });
    if (r.ok && bundle) setBundle({ ...bundle, goals: bundle.goals.filter((g) => g.id !== goalId) });
  };

  // AI turns a short concern into a SMART goal. It fills any empty field —
  // including goalText — but never overwrites a non-empty teacher entry.
  const aiDraftGoal = async (goal: Goal) => {
    if (!headers) return;
    setDrafting(goal.id);
    try {
      const concern = goal.goalText?.trim()
        || goal.baseline?.trim()
        || `Draft a SMART annual IEP goal for ${goal.domain || "this learner"}`;
      const r = await fetch("/api/ai/draft-goal", {
        method: "POST", headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          concern,
          domain: goal.domain || "academic",
          grade_level: bundle?.profile.gradeLevel || undefined,
        }),
      });
      if (!r.ok) return;
      const ai = await r.json();
      // AI must NEVER overwrite teacher-entered values. Only fill blanks.
      const merged: Partial<Goal> = {};
      if (!goal.goalText?.trim() && ai.goal_text) merged.goalText = ai.goal_text;
      if (!goal.domain && ai.domain) merged.domain = ai.domain;
      if (!goal.baseline && ai.baseline) merged.baseline = ai.baseline;
      // SMART target / measurable criteria — combine if AI returns both.
      if (!goal.targetCriteria) {
        const target = [ai.target_criteria, ai.measurable_criteria]
          .filter((s) => s && String(s).trim())
          .join(" — ");
        if (target) merged.targetCriteria = target;
      }
      if (Object.keys(merged).length === 0) return;
      updateGoal(goal.id, merged);
      await persistGoal(goal.id, merged);
    } finally { setDrafting(null); }
  };

  const addService = async () => {
    if (!activeId || !headers) return;
    const r = await fetch(`/api/iep/drafts/${activeId}/services`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: "" }),
    });
    if (r.ok && bundle) setBundle({ ...bundle, services: [...bundle.services, await r.json()] });
  };

  const persistService = async (sId: string, patch: Partial<Service>) => {
    if (!activeId || !headers) return;
    setSaveState("saving");
    const r = await fetch(`/api/iep/drafts/${activeId}/services/${sId}`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) { setSaveState("saved"); lastSaved.current = Date.now(); }
  };

  const updateService = (sId: string, patch: Partial<Service>) => {
    if (!bundle) return;
    setBundle({ ...bundle, services: bundle.services.map((s) => s.id === sId ? { ...s, ...patch } : s) });
  };

  const deleteService = async (sId: string) => {
    if (!activeId || !headers) return;
    const r = await fetch(`/api/iep/drafts/${activeId}/services/${sId}`, { method: "DELETE", headers });
    if (r.ok && bundle) setBundle({ ...bundle, services: bundle.services.filter((s) => s.id !== sId) });
  };

  const transition = async (to: "in_review") => {
    if (!activeId || !headers) return;
    const r = await fetch(`/api/iep/drafts/${activeId}/transition`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    if (r.ok) {
      const u = await r.json();
      setBundle((b) => b ? { ...b, profile: { ...b.profile, ...u } } : b);
    }
  };

  const editable = bundle?.profile.lifecycleState === "draft" || bundle?.profile.lifecycleState === "in_review";

  // Derived: which sections are missing required content (sidebar checklist).
  const missing = useMemo(() => {
    if (!bundle) return new Set<Section>();
    const m = new Set<Section>();
    const plopHas = (PLOP_AREAS as readonly string[]).every((a) =>
      (bundle.presentLevels.find((p) => p.area === a)?.narrative || "").trim().length > 0);
    if (!plopHas) m.add("plop");
    if (bundle.goals.length === 0) m.add("goals");
    if ((bundle.profile.accommodations || []).length === 0) m.add("accommodations");
    if (bundle.services.length === 0) m.add("services");
    if (!bundle.profile.placement) m.add("placement");
    if (!bundle.profile.reviewDate) m.add("review");
    return m;
  }, [bundle]);

  if (loading || !user) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold vi-text-muted hover:vi-text">
        <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" /> {t("back")}
      </button>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold vi-text">{t("title")}</h1>
          <p className="text-sm vi-text-muted mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {bundle && (
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${
              bundle.profile.lifecycleState === "in_review"
                ? "bg-[hsl(var(--visual-reading)/0.14)] text-[hsl(var(--visual-reading))]"
                : "bg-[hsl(var(--visual-sel)/0.18)] text-[hsl(var(--visual-sel))]"
            }`}>{t(`status_${bundle.profile.lifecycleState}`)}</span>
          )}
          <button onClick={createDraft} disabled={creating}
            style={{ minHeight: 44 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--visual-reading))] text-white font-bold text-sm disabled:opacity-50">
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" /> {t("new_draft")}
          </button>
        </div>
      </header>

      {drafts.length === 0 ? (
        <div className="vi-card p-10 text-center">
          <p className="vi-text-muted font-semibold">{t("none_yet")}</p>
          <p className="vi-text-muted text-sm mt-2">{t("none_yet_help")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="vi-card p-3 space-y-1 self-start">
            <p className="text-xs vi-text-muted font-bold uppercase tracking-wide px-2 py-1">{t("drafts")}</p>
            {drafts.map((d) => (
              <button key={d.id} onClick={() => setActiveId(d.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
                  d.id === activeId ? "bg-[hsl(var(--visual-reading)/0.12)] text-[hsl(var(--visual-reading))]" : "vi-text-muted hover:vi-surface-soft"
                }`}>
                <div>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}</div>
                <div className="text-[10px] uppercase tracking-wide vi-text-muted">{t(`status_${d.lifecycleState}`)}</div>
              </button>
            ))}
            <hr className="my-2 vi-border" />
            <p className="text-xs vi-text-muted font-bold uppercase tracking-wide px-2 py-1">{t("checklist")}</p>
            {SECTIONS.map((s) => (
              <div key={s} className="flex items-center gap-2 px-2 py-1 text-xs">
                {missing.has(s)
                  ? <AlertCircle size={14} className="text-[hsl(var(--visual-sel))]" aria-hidden="true" />
                  : <CheckCircle2 size={14} className="text-[hsl(var(--visual-science))]" aria-hidden="true" />}
                <span className="vi-text">{t(`section_${s}`)}</span>
              </div>
            ))}
          </aside>

          {bundle && (
            // Force a fresh subtree for each draft so any uncontrolled inputs
            // cannot retain values from a previously loaded draft.
            <section key={bundle.profile.id} className="space-y-4">
              <nav className="flex flex-wrap gap-1 border-b vi-border">
                {SECTIONS.map((s) => (
                  <button key={s} onClick={() => setSection(s)}
                    className={`px-3 py-2 text-sm font-bold rounded-t-lg ${
                      section === s
                        ? "bg-[hsl(var(--visual-surface))] border vi-border border-b-[hsl(var(--visual-surface))] -mb-[1px] text-[hsl(var(--visual-reading))]"
                        : "vi-text-muted hover:vi-text"
                    }`}>{t(`section_${s}`)}</button>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 text-xs vi-text-muted px-3">
                  <Save size={12} aria-hidden="true" />
                  {saveState === "saving" ? t("saving") : saveState === "saved" ? t("saved") : saveState === "error" ? t("save_error") : ""}
                </span>
              </nav>

              {section === "plop" && (
                <div className="space-y-4">
                  {PLOP_AREAS.map((area) => {
                    const cur = bundle.presentLevels.find((p) => p.area === area);
                    return (
                      <div key={`${bundle.profile.id}-${area}`} className="vi-card p-4 space-y-2">
                        <label className="block text-sm font-bold vi-text">{t(`plop_${area}`)}</label>
                        <textarea
                          defaultValue={cur?.narrative || ""}
                          disabled={!editable}
                          onBlur={(e) => savePresentLevel(area, e.target.value)}
                          rows={4}
                          className="w-full vi-input rounded-lg p-3 text-sm" />
                      </div>
                    );
                  })}
                </div>
              )}

              {section === "goals" && (
                <div className="space-y-4">
                  <button onClick={addGoal} disabled={!editable}
                    style={{ minHeight: 44 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full vi-surface-soft vi-text font-bold text-sm">
                    <Plus size={14} aria-hidden="true" /> {t("add_goal")}
                  </button>
                  {bundle.goals.map((goal) => (
                    <div key={goal.id} className="vi-card p-4 space-y-2">
                      <textarea value={goal.goalText} disabled={!editable}
                        onChange={(e) => updateGoal(goal.id, { goalText: e.target.value })}
                        onBlur={(e) => persistGoal(goal.id, { goalText: e.target.value })}
                        rows={2} placeholder={t("goal_text_placeholder")}
                        className="w-full vi-input rounded-lg p-3 text-sm font-semibold" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input value={goal.domain || ""} disabled={!editable}
                          onChange={(e) => updateGoal(goal.id, { domain: e.target.value })}
                          onBlur={(e) => persistGoal(goal.id, { domain: e.target.value })}
                          placeholder={t("domain_placeholder")}
                          className="vi-input rounded-lg px-3 py-2 text-sm" />
                        <input value={goal.baseline || ""} disabled={!editable}
                          onChange={(e) => updateGoal(goal.id, { baseline: e.target.value })}
                          onBlur={(e) => persistGoal(goal.id, { baseline: e.target.value })}
                          placeholder={t("baseline_placeholder")}
                          className="vi-input rounded-lg px-3 py-2 text-sm" />
                        <input value={goal.targetCriteria || ""} disabled={!editable}
                          onChange={(e) => updateGoal(goal.id, { targetCriteria: e.target.value })}
                          onBlur={(e) => persistGoal(goal.id, { targetCriteria: e.target.value })}
                          placeholder={t("target_placeholder")}
                          className="vi-input rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => aiDraftGoal(goal)} disabled={!editable || drafting === goal.id}
                          style={{ minHeight: 44 }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] font-bold text-xs disabled:opacity-50">
                          <Sparkles size={14} aria-hidden="true" />
                          {drafting === goal.id ? t("ai_drafting") : t("ai_draft_goal")}
                        </button>
                        <button onClick={() => deleteGoal(goal.id)} disabled={!editable}
                          className="ml-auto inline-flex items-center gap-1 text-xs text-[hsl(var(--visual-math))] font-bold">
                          <Trash2 size={14} aria-hidden="true" /> {t("delete")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section === "accommodations" && (
                <div className="vi-card p-4 space-y-2">
                  <label className="block text-sm font-bold vi-text">{t("accommodations_label")}</label>
                  <textarea
                    key={`acc-${bundle.profile.id}`}
                    defaultValue={(bundle.profile.accommodations || []).map((a: any) => typeof a === "string" ? a : a.description || JSON.stringify(a)).join("\n")}
                    disabled={!editable}
                    onBlur={(e) => {
                      const list = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((d) => ({ description: d }));
                      updateField("accommodations", list);
                    }}
                    rows={6}
                    placeholder={t("accommodations_placeholder")}
                    className="w-full vi-input rounded-lg p-3 text-sm" />
                </div>
              )}

              {section === "services" && (
                <div className="space-y-3">
                  <button onClick={addService} disabled={!editable}
                    style={{ minHeight: 44 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full vi-surface-soft vi-text font-bold text-sm">
                    <Plus size={14} aria-hidden="true" /> {t("add_service")}
                  </button>
                  {bundle.services.map((s) => (
                    <div key={s.id} className="vi-card p-4 grid grid-cols-1 md:grid-cols-6 gap-2">
                      <input value={s.serviceType} disabled={!editable}
                        onChange={(e) => updateService(s.id, { serviceType: e.target.value })}
                        onBlur={(e) => persistService(s.id, { serviceType: e.target.value })}
                        placeholder={t("service_type")}
                        className="vi-input rounded-lg px-3 py-2 text-sm md:col-span-2" />
                      <input value={s.providerRole || ""} disabled={!editable}
                        onChange={(e) => updateService(s.id, { providerRole: e.target.value })}
                        onBlur={(e) => persistService(s.id, { providerRole: e.target.value })}
                        placeholder={t("provider_role")}
                        className="vi-input rounded-lg px-3 py-2 text-sm" />
                      <input type="number" value={s.minutesPerWeek ?? ""} disabled={!editable}
                        onChange={(e) => updateService(s.id, { minutesPerWeek: e.target.value ? Number(e.target.value) : null })}
                        onBlur={(e) => persistService(s.id, { minutesPerWeek: e.target.value ? Number(e.target.value) : null })}
                        placeholder={t("minutes_per_week")}
                        className="vi-input rounded-lg px-3 py-2 text-sm" />
                      <input value={s.frequency || ""} disabled={!editable}
                        onChange={(e) => updateService(s.id, { frequency: e.target.value })}
                        onBlur={(e) => persistService(s.id, { frequency: e.target.value })}
                        placeholder={t("frequency")}
                        className="vi-input rounded-lg px-3 py-2 text-sm" />
                      <div className="flex items-center gap-2">
                        <input value={s.location || ""} disabled={!editable}
                          onChange={(e) => updateService(s.id, { location: e.target.value })}
                          onBlur={(e) => persistService(s.id, { location: e.target.value })}
                          placeholder={t("location")}
                          className="vi-input rounded-lg px-3 py-2 text-sm flex-1" />
                        <button onClick={() => deleteService(s.id)} disabled={!editable}
                          className="text-[hsl(var(--visual-math))]" aria-label={t("delete")}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section === "placement" && (
                <div className="vi-card p-4 space-y-2">
                  <label className="block text-sm font-bold vi-text">{t("placement_label")}</label>
                  <input value={bundle.profile.placement || ""} disabled={!editable}
                    onChange={(e) => updateField("placement", e.target.value)}
                    placeholder={t("placement_placeholder")}
                    className="w-full vi-input rounded-lg px-3 py-2 text-sm" />
                  <p className="text-xs vi-text-muted">{t("placement_help")}</p>
                </div>
              )}

              {section === "review" && (
                <div className="vi-card p-4 space-y-2">
                  <label className="block text-sm font-bold vi-text">{t("review_date_label")}</label>
                  <input type="date" disabled={!editable}
                    value={bundle.profile.reviewDate ? new Date(bundle.profile.reviewDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => updateField("reviewDate", e.target.value)}
                    className="vi-input rounded-lg px-3 py-2 text-sm" />
                </div>
              )}

              <div className="flex justify-end gap-3">
                {bundle.profile.lifecycleState === "draft" && (
                  <button onClick={() => transition("in_review")}
                    style={{ minHeight: 44 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[hsl(var(--visual-reading))] text-white font-bold text-sm">
                    <Send size={14} aria-hidden="true" /> {t("send_for_review")}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
