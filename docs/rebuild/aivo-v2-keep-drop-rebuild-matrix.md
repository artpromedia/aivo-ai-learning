# AIVO v2 — Keep / Drop / Rebuild Matrix

The dispositions are:

- **KEEP** — kept as-is; v2 mounts on top of the existing implementation.
- **KEEP_AND_EXTEND** — kept, but a later sprint adds capabilities.
- **REBUILD** — replaced by a v2 implementation. Legacy file stays
  until the v2 swap.
- **DROP** — removed once the rebuild reaches feature parity and tests
  cover the replacement path.
- **QUARANTINE** — left in place, but no new code may depend on it; the
  next sprint that touches the area owns either replacing it or
  formally adopting it.

| Item | Disposition | Where it lives | Reason |
| --- | --- | --- | --- |
| `@aivo/learner-context` (shared learner context layer) | **KEEP_AND_EXTEND** | Referenced by sprint brief as the canonical context layer. Not present as a workspace package in this checkout; the equivalent surface lives in `@aivo/learner-surfaces` and learner-context helpers in services. | The personalization promise requires a single context layer that every lesson generator goes through. v2 either renames `@aivo/learner-surfaces` data hooks into `@aivo/learner-context` or adds it as a new package. Existing consumers stay. |
| AI tutor and brain modules (`services/ai-svc`, `services/brain-svc`, `services/tutor-svc`, `packages/tutor-runtime`, `packages/tutor-sdk`, `packages/tutor-surface-protocol`) | **KEEP** | `services/`, `packages/` | Generation pipeline is sound and is the v2 engine. |
| Subject brain (`services/subject-brain-svc`, `packages/skill-graphs`) | **KEEP** | services/, packages/ | Feeds the personalization decision. |
| Adaptive baseline (`packages/adaptive-baseline`, `services/assessment-svc`) | **KEEP_AND_EXTEND** | packages/, services/ | Baseline is a personalization input. v2 makes the result available through the learner context layer. |
| Pedagogy / scoring / level-transforms (`packages/pedagogy`, `packages/scoring`, `packages/level-transforms`) | **KEEP** | packages/ | Internal mechanics for the tutor. |
| Stage runtime / stage UI (`packages/stage-runtime`, `packages/stage-ui`) | **KEEP** | packages/ | The session-execution layer. |
| Executive function (`packages/executive-function`), AAC bridge (`packages/aac-bridge`) | **KEEP** | packages/ | Required for IEP/accommodations honoring. |
| Item bank (`packages/item-bank`) | **KEEP** | packages/ | Source of practice items. |
| Special-interest engine (`packages/special-interest-engine`) | **KEEP** | packages/ | Personalization input. |
| Quest data model (engagement-svc tables, `packages/content-pack`) | **KEEP** | services/engagement-svc, packages/content-pack | Schema (worlds → chapters → boss assessments) is valid. |
| Current quest UX (`/dashboard/learner/quests/*` surfaces) | **REBUILD** | apps/web/src/app/dashboard/learner/quests/ | The play surface is functional but is not the primary daily entry. The "complete" contract still uses `user.id` as `learnerId` and lacks `tenantId`/`lessonRunId`. Surface and contract are both rebuilt; data model is kept. |
| Lesson / activity shell (`/dashboard/learner/lesson/[tutorKey]`) | **REBUILD** | apps/web/src/app/dashboard/learner/lesson/ | Today the lesson is keyed on `tutorKey` and not on a real `lessonRunId`. v2 turns this URL into the canonical personalized-lesson surface. |
| Design tokens and brand primitives (`@aivo/brand`) | **KEEP** | packages/brand | Foundation we want to preserve. |
| Learner-facing components (`@aivo/learner-ui`, `@aivo/learner-surfaces`) | **KEEP_AND_EXTEND** | packages/learner-ui, packages/learner-surfaces | Shell components are good; v2 adds the "next personalized lesson" hero block here so it is reusable on mobile. |
| Auth / RBAC (`services/identity-svc`, `apps/web/src/middleware.ts`, `packages/security`, surface cookie) | **KEEP** | services/, apps/web, packages/ | Production-grade. v2 extends the matcher when learner and parent surfaces split or when v2 routes are added. |
| Learner identity handling (browser-side reliance on `user.id` as `learnerId`) | **REBUILD** | apps/web/src/app/dashboard/learner/* and dashboard/parent/* | Pervasive rule-3 violations. v2 introduces a learner-resolution helper in the BFF so the browser never has to guess. Tracked in the risk register. |
| BFF / API layer (`apps/web/src/app/api/*` and `next.config.ts` rewrites) | **REBUILD** | apps/web/src/app/api | Today the browser calls upstream services directly via rewrites. v2 introduces `/api/bff/*` with web-owned schemas and tests. Legacy rewrites stay during the strangler period. |
| Feature parity matrix (legacy `docs/legacy-feature-porting-map.md`) | **KEEP** | docs/ | Useful map. The new keep/drop/rebuild matrix in this folder takes precedence for v2 decisions; the legacy file is referenced for historical context. |
| Placeholder buttons (any UI element whose handler is a no-op, a TODO, or a static result) | **DROP** | wherever they exist in learner paths | Forbidden by global rule 10. Sprint 00 does not delete them yet; later sprints replace them with real handlers and a lint gate enforces the rule. |
| Static / demo learner fallbacks (e.g. demo data when an API fails) | **DROP** | learner paths only | Forbidden by global rule 10. The `prod:no-demo` script already covers the production scan; v2 extends it to fail on learner-path demo fallbacks. |
| Parent onboarding (the inline add-learner form on `/dashboard/parent`) | **REBUILD** | apps/web/src/app/dashboard/parent/page.tsx | The form lives inside the dashboard page and mixes onboarding state with the main surface. v2 lifts it into a dedicated onboarding flow that produces a valid `tenantId` / `learnerId` and seeds the brain profile and IEP/accommodations gate. |
| Parent dashboard (`/dashboard/parent` and per-learner hub `/dashboard/parent/learner/[id]`) | **REBUILD** | apps/web/src/app/dashboard/parent/ | The dashboard hub is the parent equivalent of the learner home; v2 reorients it around "next thing to do" per learner and removes ambiguity between `[learnerId]/homework` and `learner/[id]/homework`. |
| Recommendation surface (`/dashboard/parent/learner/[id]/recommendations` vs `/recommendations-v2`) | **QUARANTINE** legacy, **KEEP** v2 | apps/web/src/app/dashboard/parent/learner/[id] | Two implementations exist; the legacy version is quarantined until the v2 implementation is promoted to the canonical URL via redirect. |
| Hardcoded `tenantId: "current"` (`/dashboard/learner/homework/helper`) | **DROP** | apps/web/src/app/dashboard/learner/homework/helper/page.tsx | Explicit rule-4 violation. Replaced when the BFF supplies real `tenantId`. |
| Mobile app (`apps/mobile`) | **QUARANTINE** | apps/mobile | Today's `pnpm lint` fails inside `apps/mobile` (7 errors, 7 warnings). Mobile is not in the rebuild's first phase; the failures are documented and held until a mobile-track sprint picks them up. |
| Marketing app (`apps/marketing`) | **KEEP** | apps/marketing | Orthogonal to the rebuild. |
| Test infrastructure (`tests/integration`, `e2e`, vitest configs, axe playwright) | **KEEP_AND_EXTEND** | tests/, e2e/ | Existing harness is reused; v2 adds learner-path-specific contract and accessibility tests. |
| Database package and migrations (`packages/db`) | **KEEP** | packages/db | Migration infrastructure is intact and is required for any v2 schema work. |
| Service infrastructure (`identity-svc`, `family-svc`, `learning-svc`, `ai-svc`, `engagement-svc`, `comms-svc`, `admin-svc`, etc.) | **KEEP** | services/ | Per the sprint brief's "Keep" list. |
| Showcase / canvas-preview surfaces (`apps/web/src/app/showcase`, `apps/web/src/app/canvas-preview`) | **QUARANTINE** | apps/web/src/app/ | These render learner-like UI for design review. They must never leak into production learner paths and must remain out of any v2 default routing. |
| District / admin surfaces (`/dashboard/district`, `/dashboard/admin`, `/dashboard/internal`) | **KEEP** | apps/web/src/app/dashboard/ | Out of scope for the learner/parent rebuild. |
| Teacher / therapist / caregiver dashboards | **KEEP** | apps/web/src/app/dashboard/{teacher,therapist,caregiver} | Out of scope; preserved unchanged. |
| `replit.md`, `HETZNER_DEPLOYMENT_GUIDE.md`, infra/* | **KEEP** | repo root, infra/ | Out of scope. |

## Sequencing Note

The matrix is not a sprint plan; it is a static disposition. The order
of replacement is set in the risk register and in the per-sprint
implementation notes.
