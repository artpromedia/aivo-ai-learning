# Sprint 5 — Parent Dashboard Completion

> **Priority**: 🟡 MEDIUM — Missing UI features that parents expect  
> **Estimated effort**: 4–5 days  
> **Scope**: Progress page, transition planning UI, causal analysis UI, brain snapshot history

---

## Prompt 5.1 — Build Real Progress Page (Replace Redirect Stub)

### Context

`apps/web/src/app/dashboard/parent/learner/[id]/progress/page.tsx` is a 9-line file
that just redirects to `/gradebook`:
```tsx
export default function ProgressPage() {
  const params = useParams();
  const learnerId = params.id as string;
  redirect(`/dashboard/parent/learner/${learnerId}/gradebook`);
}
```

Parents need a dedicated progress overview — not just a gradebook — showing a
holistic view of their child's learning journey over time.

### File to replace

`apps/web/src/app/dashboard/parent/learner/[id]/progress/page.tsx`

### Task

Build a progress dashboard page that shows:

1. **Progress Timeline** — A chronological feed of learning milestones:
   - Lessons completed (subject, topic, date)
   - Mastery thresholds crossed (e.g., "Math reached 70% mastery")
   - IEP goals met
   - Tutor sessions count by week
   - Discovery Adventure completion

2. **Mastery Trends Chart** — A line chart (use a lightweight library or CSS-only
   approach) showing mastery scores per domain over the last 30/60/90 days.
   - Data source: `GET /api/learning/gradebook/:learnerId` (already exists)
   - Show trend direction with color: green=improving, yellow=stable, red=declining.

3. **Weekly Summary Card** — Sessions this week, XP earned, time spent, subjects covered.
   - Data source: `GET /api/learning/sessions?learnerId=...` + aggregate.

4. **Engagement Indicators**:
   - Break usage (how often the child uses BreakCloud)
   - Session duration trends
   - Preferred tutor/subject

5. Follow existing design patterns: use `vi-card`, `vi-text`, `IconWell`, `useTranslations`.

### Acceptance criteria

- Progress page shows real data from existing APIs.
- At minimum: timeline feed, mastery trends, weekly summary.
- Page uses i18n translations (add keys to `en.ts` and `es.ts`).
- No redirect to gradebook — this is a standalone page.
- Responsive layout (mobile-friendly).

---

## Prompt 5.2 — Transition Planning UI

### Context

The database has a complete `transition_plans` table (`packages/db/src/schema/learners.ts`
line 92-109) with fields for vocational interests, independent living, community
participation, self-advocacy, and post-secondary planning. The Compass tutor has
detailed transition planning prompts for learners 14+. **No parent UI exists** for
viewing or managing transition plans.

### Files to create

- `apps/web/src/app/dashboard/parent/learner/[id]/transition/page.tsx`

### API needed

- `GET /api/family/transition/:learnerId` — returns transition plan
- `PUT /api/family/transition/:learnerId` — updates transition plan sections
  (These may need to be created in `family-svc` if not already present.)

### Task

1. Create the page with tabs or sections for each transition domain:
   - **Vocational Interests** — What careers interest the learner? Aptitude assessments.
   - **Independent Living** — Daily living skills progress, self-care milestones.
   - **Community Participation** — Social participation, recreation, volunteering.
   - **Self-Advocacy** — Communication of needs, self-determination goals.
   - **Post-Secondary Planning** — Education/training goals, supported employment.

2. Each section should show:
   - Current goals (from `annual_goals` in the plan)
   - Status/progress indicators
   - An "Add Goal" form
   - Connection to relevant tutor sessions (Compass tutor)

3. Show a banner: "Transition planning is available for learners aged 14 and older"
   if the learner is under 14. If over 14 and no plan exists, show an "Initialize
   Transition Plan" CTA.

4. Add navigation link from the parent sidebar to this page.

### Acceptance criteria

- Page exists at `/dashboard/parent/learner/[id]/transition`.
- Shows 5 transition domains with editable goals.
- Age-gated with appropriate messaging.
- Linked from parent navigation sidebar.

---

## Prompt 5.3 — Causal Analysis UI for Parents

### Context

The `causal_analyses` table (`packages/db/src/schema/brain.ts` line 93-107) stores
regression detections with hypotheses, correlated factors, and confidence scores.
The brain analysis service generates these when mastery drops are detected.
Parents can log events in `parent_reported_events`. **No UI connects these two** —
parents can't see why mastery dropped or what events correlated with changes.

### Files to create

- `apps/web/src/app/dashboard/parent/learner/[id]/insights/page.tsx`

### APIs needed

- `GET /api/brain/:learnerId/analyses` — returns causal analyses
- `GET /api/brain/:learnerId/events` — returns parent-reported events
  (These likely exist or need minor additions in brain-svc routes.)

### Task

1. Create an "Insights" page showing:

   **Regression Alerts** (from `causal_analyses`):
   - Domain, mastery drop amount, previous → current mastery
   - AI hypothesis in plain language (from `hypothesis` field)
   - Confidence indicator (high/medium/low)
   - Correlated factors listed
   - Resolution status (DETECTED / INVESTIGATING / RESOLVED)
   - Reassurance note (from the LLM analysis — "Mastery fluctuations are normal")

   **Event Timeline** (from `parent_reported_events`):
   - Show events alongside mastery changes
   - Visual correlation: "Mastery dropped 2 days after reported event: 'Bad week at school'"
   - "Log an Event" button to add new parent-reported events

   **AI Summary** (from `POST /api/brain/:learnerId/ai-summary`):
   - Strengths, support areas, recommendations
   - Neurodiversity-affirming language (already enforced by the prompt)

2. Use a visual timeline layout where events and mastery changes are plotted together.

3. Add navigation link from parent sidebar.

### Acceptance criteria

- Page exists at `/dashboard/parent/learner/[id]/insights`.
- Shows causal analyses with plain-language hypotheses.
- Event timeline with event logging form.
- AI summary section.
- Linked from parent navigation sidebar.

---

## Prompt 5.4 — Brain Snapshot History View

### Context

The `brain_state_snapshots` table stores version history of the Brain Clone with typed
triggers (initial_clone, parent_approved, mastery_threshold, rebaseline, etc.). **No UI
exists** for parents to view how the Brain has evolved over time.

### Files to create

- `apps/web/src/app/dashboard/parent/learner/[id]/brain-history/page.tsx`

### API needed

- `GET /api/brain/:learnerId/snapshots` — returns all snapshots ordered by version

### Task

1. Create a timeline view of Brain snapshots:
   - Each entry shows: version number, trigger type (human-readable label), date
   - Expandable detail: mastery levels at that point, accommodations active, tutors active
   - Visual diff between consecutive versions: "Math mastery: 45% → 62%",
     "Added accommodation: text_to_speech"

2. Use the trigger enum labels:
   - `initial_clone` → "Initial Brain Created"
   - `parent_approved` → "Parent Approved Changes"
   - `parent_amended` → "Parent Modified Brain"
   - `mastery_threshold` → "Mastery Milestone Reached"
   - `rebaseline` → "Re-Assessment Completed"
   - `main_brain_upgrade` → "Brain Model Upgraded"

3. For each snapshot, show a mini brain visualization (reuse `BrainVisualization`
   component in compact mode).

4. Add a link from the main Brain Profile page to this history.

### Acceptance criteria

- Page exists at `/dashboard/parent/learner/[id]/brain-history`.
- Shows all snapshots in reverse-chronological order.
- Diff between versions highlights changes.
- Linked from Brain Profile page.

---

## Definition of Done for Sprint 5

- [ ] Real progress page with timeline, trends, and weekly summary
- [ ] Transition planning UI with 5 domains (age-gated)
- [ ] Insights page with causal analysis and event correlation
- [ ] Brain snapshot history with version diffs
- [ ] All 4 pages use i18n, follow design system, are responsive
- [ ] Navigation links added to parent sidebar
