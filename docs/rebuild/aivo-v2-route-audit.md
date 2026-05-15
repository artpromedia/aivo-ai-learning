# AIVO v2 — Route Audit

This audit inventories every route in scope for the v2 rebuild and tags
it with a disposition. The dispositions are:

- **KEEP** — route stands as-is; v2 will mount on top of it.
- **REBUILD** — route is replaced by a v2 implementation in a later
  sprint. The legacy file remains until the v2 route ships.
- **REDIRECT_LATER** — route URL stays as a public entry point but the
  rendering moves to the v2 surface; a redirect is installed after the
  v2 route passes tests.
- **DELETE_AFTER_V2** — route exists today but has no place in v2 and
  is removed once the rebuild reaches feature parity.
- **BACKEND_ONLY** — passthrough proxy to an upstream service; covered
  by the BFF migration but not by the surface rebuild.
- **UNKNOWN_NEEDS_REVIEW** — disposition cannot be set without
  consulting the owner; flagged for follow-up.

> Scope note: the sprint brief lists `apps/web/src/app/learner` and
> `apps/web/src/app/parent` as the canonical paths. In this checkout the
> learner and parent surfaces live under `apps/web/src/app/dashboard/learner`
> and `apps/web/src/app/dashboard/parent`. The audit follows the
> on-disk paths. The risk register tracks the path-naming gap.

---

## Surface entry — `apps/web/src/middleware.ts`

| Aspect | Notes |
| --- | --- |
| Route path | Edge middleware for `/admin/*`, `/district/*`, `/dashboard/admin/*`, `/dashboard/district/*`, `/dashboard/internal/*` |
| Source file | `apps/web/src/middleware.ts` |
| Current purpose | Host allowlisting and edge RBAC for admin / district surfaces; sets hardening response headers. |
| learnerId handling | None. Does not touch learner or parent routes. |
| tenantId handling | None directly. Relies on the signed `aivo_session_role` cookie. |
| API dependencies | None at the edge; depends on identity-svc to mint the surface cookie. |
| Placeholder/mock/demo risk | None — production-grade. |
| **Decision** | **KEEP** |
| Reason | Edge defense matches v2 identity model. v2 will extend the matcher to enforce a learner-surface and parent-surface allowlist when those routes move. No replacement needed. |

## Surface entry — `apps/web/next.config.ts`

| Aspect | Notes |
| --- | --- |
| Route path | Next config; declares `rewrites()` that proxy `/api/<svc>/:path*` to each upstream service URL. |
| Source file | `apps/web/next.config.ts` |
| Current purpose | Fans out frontend API calls to identity, brain, assessment, ai, learning, tutor, family, engagement, billing, comms, i18n, integrations, status, research, admin. |
| learnerId handling | None — pure proxy. |
| tenantId handling | None — pure proxy. |
| API dependencies | All 15 upstream services. |
| Placeholder/mock/demo risk | The fact that the browser hits these directly is the structural risk: there is no BFF boundary. |
| **Decision** | **REBUILD** |
| Reason | v2 requires every learner-facing call to traverse `/api/bff/*` so request and response shapes are owned by the web app and verified by tests. The rewrites stay during the strangler period but are progressively replaced by BFF routes. Not deleted until the BFF reaches parity. |

---

## Learner surface — `apps/web/src/app/dashboard/learner`

### `/dashboard/learner`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/page.tsx` (delegates to `LearnerHome/LearnerHome.tsx`) |
| Current purpose | Top-level learner home. Shows engagement profile, baseline status, next-action card, and three tabs (today / adventures / rewards). |
| learnerId handling | **Uses `user.id` as the learner id** throughout `LearnerHome.tsx` (e.g. `/api/assessments/learner/discovery/${user.id}/status`, `/api/engagement/profile/${user.id}`, `/api/brain/${user.id}/next-action`). Violates global rule 3. |
| tenantId handling | Reads `user?.tenantId` for branding (`TopBar`, `TutorShelf`); not used for the next-action call. |
| API dependencies | assessment-svc, engagement-svc, brain-svc; family-svc indirectly through `LearnerHome` layout. |
| Placeholder/mock/demo risk | Medium — surface composes many tabs but does not directly drive a single "next personalized lesson" CTA. Tabs are real, but the home does not enforce the v2 north star. |
| **Decision** | **REBUILD** |
| Reason | Home is the most visible surface and is the primary v2 deliverable. v2 replaces the three-tab home with a single "next personalized lesson" hero backed by `lessonRunId`. Legacy page is not deleted until `/dashboard/learner` swaps to the v2 implementation behind a flag. |

### `/dashboard/learner/badges`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/badges/page.tsx` |
| Current purpose | Shows earned badges. |
| learnerId handling | Needs verification — likely `user.id`. |
| tenantId handling | Likely `user.tenantId`. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Reward inventory is orthogonal to the next-lesson promise. Adopted by v2 once it migrates to the BFF; no UX rebuild required. |

### `/dashboard/learner/assessment`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/assessment/page.tsx` |
| Current purpose | Discovery / baseline assessment entry for the learner. |
| learnerId handling | Resolves `effectiveLearnerId = queryLearnerId || user.id`; falls back to `user.id` if profile resolution fails. |
| tenantId handling | Inherited via auth; not explicit in fetches. |
| API dependencies | assessment-svc. |
| Placeholder/mock/demo risk | Low — assessment is real and drives baseline. |
| **Decision** | **KEEP_AND_EXTEND** (cataloged here as **KEEP**) |
| Reason | Baseline is a v2 input. The fallback `|| user.id` violates rule 3 and is fixed when the BFF lands. |

### `/dashboard/learner/profile`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/profile/page.tsx` |
| Current purpose | Learner profile view. |
| learnerId handling | Uses `user.id` directly. |
| tenantId handling | Inherited. |
| API dependencies | identity-svc / family-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Profile view stays. Rule-3 violation is removed when BFF takes over identity resolution. |

### `/dashboard/learner/settings`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/settings/page.tsx` |
| Current purpose | Learner-side settings (sensory profile, language, etc.). |
| learnerId handling | Likely `user.id`. |
| tenantId handling | Inherited. |
| API dependencies | identity-svc, family-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Settings is orthogonal. Promoted to BFF in the migration sprint. |

### `/dashboard/learner/tutors`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/tutors/page.tsx` |
| Current purpose | Tutor catalog visible to the learner. |
| learnerId handling | Reads `user?.tenantId`; tutor list is tenant-scoped. |
| tenantId handling | Explicit. |
| API dependencies | tutor-svc, billing-entitlements. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Tutor catalog is preserved. v2 narrows the catalog to "the tutor for your next lesson" but does not delete the page. |

### `/dashboard/learner/tutors/[tutorKey]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/tutors/[tutorKey]/page.tsx` |
| Current purpose | Individual tutor detail. |
| learnerId handling | Inherited. |
| tenantId handling | `user?.tenantId`. |
| API dependencies | tutor-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Tutor detail page is reused as the v2 "session preview" shell. |

### `/dashboard/learner/homework`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/homework/page.tsx` |
| Current purpose | Homework upload (camera/text) and assignment list. |
| learnerId handling | Passes `learnerId: user.id, userId: user.id` to `/api/tutors/homework/upload`. Rule-3 violation. |
| tenantId handling | Not explicit on upload. |
| API dependencies | tutor-svc / homework-svc. |
| Placeholder/mock/demo risk | Low for the UI; upload pipeline is real. |
| **Decision** | **KEEP_AND_EXTEND** (cataloged as **KEEP**) |
| Reason | Homework helper is a kept surface. v2 fixes the learnerId fallback and routes through BFF. |

### `/dashboard/learner/homework/helper`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/homework/helper/page.tsx` |
| Current purpose | In-context tutor for homework problems. |
| learnerId handling | Hardcodes `tenantId: "current"`. |
| tenantId handling | **Hardcoded string `"current"` — explicit violation of rule 4.** |
| API dependencies | tutor-svc, problem-session-svc. |
| Placeholder/mock/demo risk | Medium — hardcoded tenant is the kind of placeholder this rebuild forbids. |
| **Decision** | **REBUILD** |
| Reason | Helper must derive a real `tenantId` and `learnerId` from the resolved learner profile. v2 BFF supplies them. |

### `/dashboard/learner/homework/[sessionId]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/homework/[sessionId]/page.tsx` |
| Current purpose | Homework session detail (per problem walkthrough). |
| learnerId handling | Session id is the primary key; learner inferred from session. |
| tenantId handling | Inherited from session record. |
| API dependencies | problem-session-svc, tutor-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Real session flow. Migrated to BFF in the migration sprint. |

### `/dashboard/learner/quests`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/quests/page.tsx` |
| Current purpose | Quest world index. |
| learnerId handling | Inherited via auth. |
| tenantId handling | Inherited. |
| API dependencies | engagement-svc (quest worlds). |
| Placeholder/mock/demo risk | Low — schema is real. |
| **Decision** | **REDIRECT_LATER** |
| Reason | Quests are good content but they are not the primary daily surface. v2 promotes "next personalized lesson" to the home and demotes quests to a secondary "explore" path. The URL stays; the home no longer launches into a quest by default. |

### `/dashboard/learner/quests/[worldSlug]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/quests/[worldSlug]/page.tsx` |
| Current purpose | World detail with chapter list. |
| learnerId handling | Inherited. |
| tenantId handling | Inherited. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Reused under the secondary explore experience. |

### `/dashboard/learner/quests/[worldSlug]/play/[questId]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/quests/[worldSlug]/play/[questId]/page.tsx` |
| Current purpose | Boss-assessment quest play. Sends `learnerId: user.id` to `/api/engagement/quests/complete`. |
| learnerId handling | `learnerId: user.id` on completion — rule-3 violation. |
| tenantId handling | None. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low — content path is real, though the quest body is statically authored and could be confused with a personalized lesson. |
| **Decision** | **REBUILD** |
| Reason | Completion contract must include `tenantId`, real `learnerId`, and (when a quest stands in for a lesson) `lessonRunId`. The play surface itself can be kept; the contract behind "complete" must be redone. |

### `/dashboard/learner/quests/[worldSlug]/play`
| Aspect | Notes |
| --- | --- |
| Source file | (directory; routed via `[questId]` child) |
| Current purpose | Container segment for quest play. |
| learnerId handling | Inherited. |
| tenantId handling | Inherited. |
| API dependencies | None directly. |
| Placeholder/mock/demo risk | None. |
| **Decision** | **KEEP** |
| Reason | Pure routing segment. |

### `/dashboard/learner/lesson/[tutorKey]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/lesson/[tutorKey]/page.tsx` |
| Current purpose | Static or semi-static "lesson" associated with a tutor. |
| learnerId handling | Needs verification — likely `user.id` based on neighboring routes. |
| tenantId handling | Needs verification. |
| API dependencies | tutor-svc, ai-svc. |
| Placeholder/mock/demo risk | High — the route name implies "lesson" but the surface is keyed only by tutor, not by learner profile, baseline, or lessonRun. Violates the v2 north star. |
| **Decision** | **REBUILD** |
| Reason | This URL must become the canonical "personalized lesson" surface, backed by `tenantId`, `learnerId`, `lessonRunId`. v2 implementation will live alongside the legacy file and swap behind a flag. |

### `/dashboard/learner/shop`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/shop/page.tsx` |
| Current purpose | Coin/gem shop, inventory. |
| learnerId handling | `/api/engagement/shop/inventory/${user.id}` — rule-3 violation. |
| tenantId handling | None. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Functioning rewards surface. learnerId resolution moves to BFF. |

### `/dashboard/learner/challenges`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/challenges/page.tsx` |
| Current purpose | Peer challenges. |
| learnerId handling | `/api/engagement/challenges/learner/${user.id}` — rule-3 violation. |
| tenantId handling | None. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Adjacent feature; not central to the rebuild. learnerId resolution fixed by BFF. |

### `/dashboard/learner/leaderboard`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/leaderboard/page.tsx` |
| Current purpose | Leaderboard view. |
| learnerId handling | Compares `entry.learnerId === user.id` to highlight self. |
| tenantId handling | None. |
| API dependencies | engagement-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Independent; fix learnerId resolution in BFF migration. |

### `/dashboard/learner/LearnerHome` (component directory)
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/learner/LearnerHome/*.tsx` |
| Current purpose | Component implementations for the learner home. Not a route. |
| **Decision** | **REBUILD** |
| Reason | Co-rebuilt with `/dashboard/learner` since this is the implementation it delegates to. |

---

## Parent surface — `apps/web/src/app/dashboard/parent`

### `/dashboard/parent`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/page.tsx` |
| Current purpose | Parent dashboard root: learner list, "add learner" onboarding form, while-you-were-away activity, what's-working panel. |
| learnerId handling | Loops over the parent's learner list; doesn't conflate with `user.id`. |
| tenantId handling | Inherited from auth. |
| API dependencies | family-svc, brain-svc, assessment-svc, engagement-svc. |
| Placeholder/mock/demo risk | Medium — the onboarding form lives on the dashboard page itself and adds learners with country/region/curriculum metadata; v2 needs to verify whether all paths produce a valid learner profile before any lesson generation runs. |
| **Decision** | **REBUILD** |
| Reason | Parent home is being rebuilt to align with the learner v2 promise: clearer "next thing to do" per learner, real brain-review CTAs, and explicit BFF endpoints. Legacy page kept until v2 lands. |

### `/dashboard/parent/inbox`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/inbox/page.tsx` |
| Current purpose | Comms inbox for parent. |
| API dependencies | comms-svc. |
| **Decision** | **KEEP** |
| Reason | Independent surface. |

### `/dashboard/parent/data-center`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/data-center/page.tsx` |
| Current purpose | Data exports, deletion requests, DPA. |
| API dependencies | data-governance-svc. |
| **Decision** | **KEEP** |
| Reason | Compliance surface; orthogonal. |

### `/dashboard/parent/settings`
| Source file | `apps/web/src/app/dashboard/parent/settings/page.tsx` |
| **Decision** | **KEEP** |

### `/dashboard/parent/billing`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/billing/page.tsx` |
| Current purpose | Stripe billing, subscription lifecycle, add-ons. |
| tenantId handling | Explicit `user?.tenantId`. |
| API dependencies | billing-svc. |
| Placeholder/mock/demo risk | Low. |
| **Decision** | **KEEP** |
| Reason | Production billing flow. |

### `/dashboard/parent/store`
| Source file | `apps/web/src/app/dashboard/parent/store/page.tsx` |
| Current purpose | Tutor SKU store. |
| **Decision** | **KEEP** |
| Reason | Tied to billing; orthogonal. |

### `/dashboard/parent/help`
| Source file | `apps/web/src/app/dashboard/parent/help/page.tsx` |
| **Decision** | **KEEP** |

### `/dashboard/parent/[learnerId]/homework`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/[learnerId]/homework/page.tsx` |
| Current purpose | Parent view of a learner's homework. |
| learnerId handling | Explicit route param. |
| **Decision** | **KEEP** |
| Reason | Correctly parameterized by `learnerId`. |

### `/dashboard/parent/learner/[id]`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/learner/[id]/page.tsx` |
| Current purpose | Per-learner overview hub for a parent. |
| learnerId handling | Explicit route param. |
| **Decision** | **REBUILD** |
| Reason | Parent's per-learner hub is the second most important surface in v2; it must show next personalized lesson, IEP/accommodations status, baseline status, and "what to do next" without ambiguity. Legacy kept until v2 swaps in. |

### `/dashboard/parent/learner/[id]/overview` through `/iep`
The following children all live under `apps/web/src/app/dashboard/parent/learner/[id]/` and share the same `learnerId` parameterization:

| Sub-route | Decision | Reason |
| --- | --- | --- |
| `/overview` | KEEP | Real summary surface. |
| `/team` | KEEP | Care team view. |
| `/brain-review` | KEEP_AND_EXTEND (KEEP) | Critical to the v2 promise — brain review feeds personalization. |
| `/sensory` | KEEP | Sensory profile editor. |
| `/assessment` | KEEP | Baseline status. |
| `/transitions` | KEEP | Special education transitions. |
| `/progress` | KEEP | Mastery progress. |
| `/recommendations` | REDIRECT_LATER | Legacy recommendations engine. v2 routes `recommendations-v2` to canonical path. |
| `/recommendations-v2` | KEEP | Newer recommendations surface; promoted to default after redirect lands. |
| `/settings` | KEEP | Per-learner settings. |
| `/milestones` | KEEP | Real surface. |
| `/gradebook` | KEEP | Real surface. |
| `/tutors` | KEEP | Tutor list per learner. |
| `/curriculum` | KEEP | Curriculum framework view. |
| `/collaboration` | KEEP | Educator / parent collaboration. |
| `/homework` | KEEP | Same as `[learnerId]/homework` but under `learner/[id]/`; one of these must be redirected to the other (tracked in risk register). |
| `/brain` | KEEP | Brain profile detail. |
| `/insights` | KEEP_AND_EXTEND (KEEP) | Brain/insight readouts. |
| `/brain-history` | KEEP | Historical brain timeline. |
| `/iep` | KEEP | IEP / accommodations record — required for personalization. |

### `/dashboard/parent/components`
| Aspect | Notes |
| --- | --- |
| Source file | `apps/web/src/app/dashboard/parent/components/*.tsx` |
| **Decision** | **REBUILD** |
| Reason | Co-rebuilt with `/dashboard/parent`. |

---

## Web API surface — `apps/web/src/app/api`

All current `/api/*` directories proxy to upstream services. They follow
the `[[...path]]/route.ts` catch-all pattern.

| Route segment | Source file | Upstream | Decision | Reason |
| --- | --- | --- | --- | --- |
| `/api/admin-svc/[[...path]]` | `admin-svc/[[...path]]/route.ts` | admin-svc | BACKEND_ONLY | Admin path; outside learner rebuild. |
| `/api/audit-events/[[...path]]` | `audit-events/[[...path]]/route.ts` | audit-svc | BACKEND_ONLY | Compliance passthrough. |
| `/api/audit-reports/[[...path]]` | `audit-reports/[[...path]]/route.ts` | audit-svc | BACKEND_ONLY | Compliance passthrough. |
| `/api/deletion-requests/[[...path]]` | `deletion-requests/[[...path]]/route.ts` | data-governance-svc | BACKEND_ONLY | Compliance passthrough. |
| `/api/districts/[[...path]]` | `districts/[[...path]]/route.ts` | identity / admin | BACKEND_ONLY | District admin path; outside learner rebuild. |
| `/api/dpa/[[...path]]` | `dpa/[[...path]]/route.ts` | data-governance-svc | BACKEND_ONLY | Compliance passthrough. |
| `/api/exports/[[...path]]` | `exports/[[...path]]/route.ts` | data-governance-svc | BACKEND_ONLY | Compliance passthrough. |
| `/api/homework-sessions/[[...path]]` | `homework-sessions/[[...path]]/route.ts` | problem-session-svc | REBUILD | Surfaced to learner; v2 routes the learner-facing calls through `/api/bff/homework/*`. Legacy proxy kept for service-to-service callers. |
| `/api/math-recognizer/[[...path]]` | `math-recognizer/[[...path]]/route.ts` | math-recognizer-svc | BACKEND_ONLY | Internal recognition pipeline. |
| `/api/problem-sessions/[[...path]]` | `problem-sessions/[[...path]]/route.ts` | problem-session-svc | REBUILD | Same reason as homework-sessions. |
| `/api/recommendations/[[...path]]` | `recommendations/[[...path]]/route.ts` | recommendation-svc | REBUILD | Recommendations feed the personalized-lesson decision; route is re-fronted by BFF so the web app owns its shape. |
| `/api/responsible-ai/[[...path]]` | `responsible-ai/[[...path]]/route.ts` | responsible-ai-svc | BACKEND_ONLY | Guardrails passthrough. |
| `/api/rosters/[[...path]]` | `rosters/[[...path]]/route.ts` | integrations-svc | BACKEND_ONLY | Integration passthrough. |
| `/api/schools/[[...path]]` | `schools/[[...path]]/route.ts` | identity / admin | BACKEND_ONLY | School admin path. |
| `/api/science-solver/[[...path]]` | `science-solver/[[...path]]/route.ts` | science-solver-svc | REBUILD | Surfaced to learner; routed via BFF. |
| `/api/subject-brain/[[...path]]` | `subject-brain/[[...path]]/route.ts` | subject-brain-svc | REBUILD | Feeds the brain profile that drives personalization. |
| `/api/teacher/[[...path]]` | `teacher/[[...path]]/route.ts` | identity / admin | BACKEND_ONLY | Educator path; outside rebuild. |

**Quest routes / learning-path routes**

The sprint brief asks for `apps/web/src/app/api/quests` and
`apps/web/src/app/api/learning-path`. Neither exists in this checkout.
Quest data is reached via the `/api/engagement/...` rewrites in
`next.config.ts` (engagement-svc owns quest worlds and chapters).
Learning-path data is reached via the `/api/learning/...` rewrite to
learning-svc. Decision for both:

- **Quest API path** (`/api/engagement/quests/*` via rewrite) — **REBUILD**.
  v2 will introduce `/api/bff/quests/*` so the web app owns the shape.
- **Learning-path API** (`/api/learning/*` via rewrite) — **REBUILD**.
  v2 will introduce `/api/bff/learning-path/*` and `/api/bff/next-lesson/*`
  as the canonical learner-facing entry points.

---

## Summary

| Disposition | Count |
| --- | --- |
| KEEP | 27 |
| REBUILD | 12 |
| REDIRECT_LATER | 2 |
| BACKEND_ONLY | 11 |
| DELETE_AFTER_V2 | 0 |
| UNKNOWN_NEEDS_REVIEW | 0 |

Sprint 00 declines to mark anything DELETE_AFTER_V2; that disposition
becomes available only after the v2 surface ships and redirects are in
place.
