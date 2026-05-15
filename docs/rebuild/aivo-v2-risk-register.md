# AIVO v2 — Risk Register

Severity scale: **low / medium / high / critical**.
Target sprint is the sprint the mitigation must land by, not start in.

## R-01 — `session.user.id` is treated as `learnerId` across the learner surface

| Field | Value |
| --- | --- |
| Description | Many learner pages read `user.id` from the auth provider and pass it as `learnerId` to upstream services. This works today only because a learner's account id happens to equal their learner profile id in most tenants. The assumption breaks for parent and educator accounts and silently mis-routes data for shared accounts. |
| Affected files | `apps/web/src/app/dashboard/learner/LearnerHome/LearnerHome.tsx` (lines 74, 103, 111, 124, 137, 161), `apps/web/src/app/dashboard/learner/profile/page.tsx:47`, `apps/web/src/app/dashboard/learner/assessment/page.tsx:66,83,179`, `apps/web/src/app/dashboard/learner/homework/page.tsx:77`, `apps/web/src/app/dashboard/learner/shop/page.tsx:68,75,90`, `apps/web/src/app/dashboard/learner/leaderboard/page.tsx:93`, `apps/web/src/app/dashboard/learner/quests/[worldSlug]/play/[questId]/page.tsx:140`, `apps/web/src/app/dashboard/learner/challenges/page.tsx:36,53,69`, `apps/web/src/app/dashboard/learner/layout.tsx:110`. |
| Severity | **critical** |
| Mitigation | Introduce a learner-resolution helper in the v2 BFF that turns a session into `(tenantId, learnerId)` using the family/identity graph. Replace every direct `user.id` usage in learner paths with a value returned by the BFF. Add a lint rule that forbids passing `user.id` to a `learnerId` field in a fetch body. |
| Target sprint | Sprint 02 (BFF foundation). |

## R-02 — Hardcoded `tenantId: "current"` in homework helper

| Field | Value |
| --- | --- |
| Description | The homework helper page passes a hardcoded string `"current"` where a real `tenantId` is expected. This is the literal kind of placeholder the rebuild forbids. |
| Affected files | `apps/web/src/app/dashboard/learner/homework/helper/page.tsx:44`. |
| Severity | **high** |
| Mitigation | Resolve `tenantId` from the learner profile via the BFF resolver introduced in R-01. |
| Target sprint | Sprint 02. |

## R-03 — Learner-facing API calls bypass any BFF contract

| Field | Value |
| --- | --- |
| Description | The browser hits upstream services through `next.config.ts` rewrites (`/api/engagement/*`, `/api/brain/*`, `/api/assessments/*`, etc.). There is no `/api/bff/*` boundary, so request and response shapes are owned by each upstream service and can drift silently from the web app. |
| Affected files | `apps/web/next.config.ts:43-69` (rewrites), every `fetch("/api/<svc>/...")` call in `apps/web/src/app/dashboard/learner/**` and `dashboard/parent/**`. |
| Severity | **high** |
| Mitigation | Introduce `apps/web/src/app/api/bff/*` routes with versioned request/response Zod schemas, contract tests, and `paths`-typed clients from `@aivo/api-client`. Migrate learner paths one route at a time; keep the legacy rewrites until the BFF reaches parity. |
| Target sprint | Sprint 02 starts BFF foundations; full parity by Sprint 05. |

## R-04 — Two coexisting parent homework routes for the same data

| Field | Value |
| --- | --- |
| Description | `/dashboard/parent/[learnerId]/homework` and `/dashboard/parent/learner/[id]/homework` both exist and present a parent view of a learner's homework. The duplication will confuse users and tests; one must redirect to the other. |
| Affected files | `apps/web/src/app/dashboard/parent/[learnerId]/homework/page.tsx`, `apps/web/src/app/dashboard/parent/learner/[id]/homework/page.tsx`. |
| Severity | **medium** |
| Mitigation | Pick `/dashboard/parent/learner/[id]/homework` as canonical (it aligns with the rest of the per-learner hub) and redirect `/dashboard/parent/[learnerId]/homework` to it after the v2 parent surface ships. |
| Target sprint | Sprint 03 (parent rebuild). |

## R-05 — Two coexisting recommendation surfaces

| Field | Value |
| --- | --- |
| Description | `/dashboard/parent/learner/[id]/recommendations` and `/dashboard/parent/learner/[id]/recommendations-v2` both exist. The `-v2` suffix indicates a partial migration with no redirect installed. |
| Affected files | `apps/web/src/app/dashboard/parent/learner/[id]/recommendations/page.tsx`, `apps/web/src/app/dashboard/parent/learner/[id]/recommendations-v2/page.tsx`. |
| Severity | **medium** |
| Mitigation | Confirm the `-v2` surface is the intended canonical and either redirect the legacy URL to it or merge their components and remove the suffix. |
| Target sprint | Sprint 03. |

## R-06 — `/dashboard/learner/lesson/[tutorKey]` is keyed on `tutorKey`, not a real lesson run

| Field | Value |
| --- | --- |
| Description | The route name implies "lesson" but the URL is parameterized only by a tutor key. There is no `lessonRunId` in the URL or in the page state, so a lesson cannot be resumed, audited, or referenced. This is the location the v2 personalized lesson must live. |
| Affected files | `apps/web/src/app/dashboard/learner/lesson/[tutorKey]/page.tsx`. |
| Severity | **high** |
| Mitigation | v2 introduces `/dashboard/learner/lesson/[lessonRunId]` (or keeps the URL and threads the run id internally) and ensures every entry point creates a `lessonRunId` before navigation. |
| Target sprint | Sprint 04 (lesson surface rebuild). |

## R-07 — Quest "complete" contract omits `tenantId` and `lessonRunId`

| Field | Value |
| --- | --- |
| Description | `POST /api/engagement/quests/complete` is called with `{ learnerId: user.id, questId, score }`. It does not carry `tenantId`, does not carry `lessonRunId`, and uses the rule-3 violating `learnerId`. |
| Affected files | `apps/web/src/app/dashboard/learner/quests/[worldSlug]/play/[questId]/page.tsx:137-141`. |
| Severity | **medium** |
| Mitigation | When quests are used as a personalized lesson surface, the complete contract must carry `(tenantId, learnerId, lessonRunId, questId, score)`. When they are used as side-content, they at minimum carry `(tenantId, learnerId, questId, score)`. |
| Target sprint | Sprint 04. |

## R-08 — Path mismatch between sprint brief and on-disk layout

| Field | Value |
| --- | --- |
| Description | The sprint brief references `apps/web/src/app/learner`, `apps/web/src/app/parent`, `apps/web/src/app/api/quests`, and `apps/web/src/app/api/learning-path`. None of these directories exist. Learner and parent surfaces live under `apps/web/src/app/dashboard/learner` and `apps/web/src/app/dashboard/parent`; quest and learning-path APIs are reached via the rewrites in `next.config.ts`. |
| Affected files | Sprint brief vs. `apps/web/src/app/dashboard/{learner,parent}/`, `apps/web/next.config.ts`. |
| Severity | **low** |
| Mitigation | The route audit follows the on-disk layout. Subsequent sprints can choose to move surfaces to the brief's locations (with redirects) or update the brief; either choice is acceptable. |
| Target sprint | Decided in Sprint 01. |

## R-09 — `@aivo/learner-context` is named in the sprint brief but does not exist as a workspace package

| Field | Value |
| --- | --- |
| Description | The brief asks for `@aivo/learner-context` to be preserved. The current workspace has `@aivo/learner-surfaces` and `@aivo/learner-ui` instead; the "context" responsibility is spread across services and a few hooks. |
| Affected files | `packages/learner-surfaces/`, `packages/learner-ui/`, none named `learner-context`. |
| Severity | **medium** |
| Mitigation | Decide whether to (a) rename `@aivo/learner-surfaces` to `@aivo/learner-context`, (b) introduce a new `@aivo/learner-context` package that wraps the existing hooks, or (c) treat the brief as aspirational. v2 needs a single library every lesson generator goes through to honor rule 5; pick one before Sprint 02. |
| Target sprint | Sprint 01. |

## R-10 — Mobile lint failures (pre-existing)

| Field | Value |
| --- | --- |
| Description | `pnpm lint` fails because of pre-existing errors in `apps/mobile`. Conditional `useMemo`/`useCallback` (rules-of-hooks violations in `MobileStageRuntime.tsx`) and unescaped entities in `tutor/[tutorSlug].tsx` and `MobileSurfaceRenderer.tsx`. Total: 7 errors, 7 warnings in `apps/mobile`; `apps/web` lint is clean (5 unused-disable warnings only, 0 errors). |
| Affected files | `apps/mobile/src/components/learning/MobileStageRuntime.tsx:70,79,87,95,103`, `apps/mobile/src/components/learning/MobileSurfaceRenderer.tsx:36`, `apps/mobile/app/(learner)/tutor/[tutorSlug].tsx:105`, plus warnings in `apps/mobile/app/(learner)/quests/[worldSlug]/index.tsx`, `apps/mobile/app/(learner)/stage/[sessionId].tsx`, `apps/mobile/src/api/sessionClient.ts`, `apps/mobile/src/components/learning/GeometryCanvas.tsx`. |
| Severity | **medium** |
| Mitigation | Fix conditional-hook violations (lift the hooks above the conditional return) and escape the apostrophes. Out of scope for Sprint 00; the mobile track owns this. |
| Target sprint | Sprint TBD (mobile track). |

## R-11 — `pnpm typecheck` script does not exist

| Field | Value |
| --- | --- |
| Description | The root `package.json` has no `typecheck` script, and `turbo.json` has no `typecheck` task. Type checking happens implicitly via `pnpm build` (each package's `prepare`/`build` runs `tsc`). `npx tsc --noEmit -p apps/web` was run manually for Sprint 00 and passed with no errors. |
| Affected files | `package.json`, `turbo.json`. |
| Severity | **low** |
| Mitigation | Add a `typecheck` script that runs `tsc --noEmit` across the workspace via turbo, so the rebuild's per-sprint gates can rely on a single command. |
| Target sprint | Sprint 01. |

## R-12 — `legacy-feature-porting-map.md` duplicates and predates the new matrix

| Field | Value |
| --- | --- |
| Description | A pre-existing `docs/legacy-feature-porting-map.md` covers similar ground to the new keep/drop/rebuild matrix. The two may drift. |
| Affected files | `docs/legacy-feature-porting-map.md`, `docs/rebuild/aivo-v2-keep-drop-rebuild-matrix.md`. |
| Severity | **low** |
| Mitigation | The v2 matrix takes precedence. Either reconcile both files or mark the legacy file as historical. |
| Target sprint | Sprint 01. |

## R-13 — Showcase / canvas-preview surfaces render learner-shaped UI

| Field | Value |
| --- | --- |
| Description | `apps/web/src/app/showcase` and `apps/web/src/app/canvas-preview/learner-home` render learner-like UI with static data for design review. If they leak into production routing or are accidentally swapped into the learner surface, they would violate rule 1 (no placeholder learner-facing interactions) and rule 10 (no demo fallbacks). |
| Affected files | `apps/web/src/app/showcase/**`, `apps/web/src/app/canvas-preview/**`. |
| Severity | **low** |
| Mitigation | Confirm production routing excludes these paths, document them as design-review-only, and add a CI gate that fails if any production learner page imports from showcase or canvas-preview. |
| Target sprint | Sprint 02 (when the BFF lint rules land). |

## R-14 — Direct browser → service rewrites are widely cached and tested in their existing shape

| Field | Value |
| --- | --- |
| Description | Migrating to `/api/bff/*` will require careful regression testing because many existing learner and parent pages, integration tests, and analytics depend on the current request shapes. A naive flip will produce silent breakage. |
| Affected files | `apps/web/next.config.ts`, every `fetch("/api/<svc>/...")` site, integration tests under `tests/integration`, e2e tests under `e2e/`. |
| Severity | **high** |
| Mitigation | The strangler order is: (1) add BFF route in parallel; (2) move calls one surface at a time; (3) prove parity with contract tests; (4) remove rewrite only when zero callers remain. Do not remove a rewrite in the same sprint that adds its BFF replacement. |
| Target sprint | Sprint 02 onward (cross-cutting). |

## R-15 — AI lesson generation has no run-time persistence model surfaced to the web

| Field | Value |
| --- | --- |
| Description | v2 requires every generated lesson to be backed by a `lessonRunId` so it can be resumed, audited, and reviewed. Today's tutor / ai-svc / stage-runtime stack supports session ids, but there is no single `lessonRunId` exposed to the learner web surface. |
| Affected files | `services/ai-svc`, `services/tutor-svc`, `packages/stage-runtime`, `apps/web/src/app/dashboard/learner/lesson/[tutorKey]/page.tsx`. |
| Severity | **high** |
| Mitigation | Define the `LessonRun` contract: id, tenantId, learnerId, generator inputs (brain profile snapshot, IEP snapshot, baseline snapshot, mastery snapshot), generator outputs (plan, items), state machine (queued / running / completed / aborted). Expose it through the BFF. |
| Target sprint | Sprint 04 (lesson surface rebuild). |

## R-16 — Database migration risk: no v2 schema has been written yet

| Field | Value |
| --- | --- |
| Description | The rebuild may add new tables for `LessonRun`, learner-context snapshots, and personalized-lesson telemetry. None of these schemas exist yet. Migration infrastructure in `packages/db` is intact, but the order of schema and code changes must be planned to avoid downtime. |
| Affected files | `packages/db/`, migrations directory inside `@aivo/db`. |
| Severity | **medium** |
| Mitigation | Each sprint that introduces new persistence ships an expand → backfill → contract migration sequence. Code reads the new column with a fallback during expand, switches during backfill, and removes the fallback during contract. |
| Target sprint | Sprint 04. |

## R-17 — Legacy routes will be linked by analytics, comms, and external integrations

| Field | Value |
| --- | --- |
| Description | Even after a v2 URL exists, external systems (parent emails, push notifications, LMS launches, SIS callbacks) may continue to link to legacy URLs. Removing legacy routes too soon will break inbound traffic. |
| Affected files | Every legacy learner or parent route; `services/comms-svc`, `services/integrations-svc`, LTI 1.3 launch handler. |
| Severity | **medium** |
| Mitigation | No legacy route is deleted in a sprint that adds its replacement; deletion happens in a dedicated cleanup sprint after redirects have been live for at least two weeks of production traffic. Tracked under global rule 9. |
| Target sprint | Sprint 06+ (cleanup). |

## R-18 — Quest route inconsistency

| Field | Value |
| --- | --- |
| Description | Quests live behind three URL shapes: `/dashboard/learner/quests/[worldSlug]`, `/dashboard/learner/quests/[worldSlug]/play`, and `/dashboard/learner/quests/[worldSlug]/play/[questId]`. The middle segment is unused except as a container. |
| Affected files | `apps/web/src/app/dashboard/learner/quests/[worldSlug]/`. |
| Severity | **low** |
| Mitigation | Either collapse `play` into a direct chapter URL or document the segment as a deliberate container. Decided in the quest-rebuild sprint. |
| Target sprint | Sprint 04. |

## R-19 — Tenant resolution gap in many learner-facing calls

| Field | Value |
| --- | --- |
| Description | Most learner-side `fetch` calls do not include `tenantId` at all and rely on upstream services to derive it from the bearer token. This is fragile for cross-tenant accounts (educators with multiple tenant memberships) and prevents the front end from enforcing rule 4 before a request is made. |
| Affected files | All `fetch("/api/engagement/...")`, `fetch("/api/brain/...")`, `fetch("/api/assessments/...")` calls under `apps/web/src/app/dashboard/learner/`. |
| Severity | **high** |
| Mitigation | The BFF requires `tenantId` on the request schema; the learner-resolution helper supplies it from the resolved profile, not from the token. |
| Target sprint | Sprint 02. |

## R-20 — Tests skip many integration suites unless DB/JWT env is set

| Field | Value |
| --- | --- |
| Description | `pnpm test` passed 79/79 packages but several services skip large blocks of integration tests when DATABASE_URL / JWT keys are absent (e.g. `@aivo/admin-svc` skipped 17, `@aivo/identity-svc` skipped 16). The green status is real for the unit layer; it does not prove the integration layer. |
| Affected files | `services/*/test/*`, `tests/integration/`. |
| Severity | **medium** |
| Mitigation | Each sprint that introduces a new BFF route ships its own integration test with a real Postgres fixture, so coverage of the v2 surface is provable independent of the legacy skip behavior. |
| Target sprint | Sprint 02 onward. |

---

## Codebase Health Check — Sprint 00

These results were captured on the rebuild branch with all changes confined to `docs/rebuild/`.

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm install` | OK | Two ignored build scripts (`dtrace-provider@0.8.8`, `unrs-resolver@1.11.1`) — informational; not blocking. |
| `pnpm lint` | FAIL | Fails because `@aivo/mobile` has 7 lint errors and 7 warnings. `@aivo/web` lint is clean (5 unused-disable warnings, 0 errors). All non-mobile lint tasks succeeded. See **R-10**. |
| `pnpm typecheck` | N/A | No `typecheck` script defined. See **R-11**. `npx tsc --noEmit -p apps/web` was run manually and produced no errors. |
| `pnpm test` | OK | 79 of 79 packages green. Many integration tests skip when DB/JWT env vars are absent. See **R-20**. |
| `pnpm build` | Not run in Sprint 00 | Build is heavy and not required for an audit-only sprint. Failed lint indicates at least the mobile build may surface secondary issues. Tracked under **R-10**. |
