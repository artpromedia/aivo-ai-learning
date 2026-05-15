# AIVO v2 — Product Principles

## North Star

> Every learner receives a personalized tutor-generated lesson based on
> their brain profile, IEP/accommodations, baseline results, and mastery
> history.

This is the single product promise. Every screen, route, button, and
service contract is defended against this sentence. If a surface does not
visibly advance the learner toward the next personalized lesson, it does
not belong in the learner experience.

## Audience and Surfaces

- **Learner surface** — the daily home of a student. One next lesson,
  always personalized, always backed by a `lessonRunId`.
- **Parent surface** — the caregiver of one or more learners. Sees
  progress, IEP/accommodations status, and team activity across each
  learner profile.
- **Educator / district / admin surfaces** — out of scope for the
  rebuild's first phase. They continue under their existing contracts
  and only change when the BFF contract changes underneath them.

## Identity Model

The single most common failure mode in the current codebase is treating
`session.user.id` as `learnerId`. The v2 model is:

- `userId` — the authenticated account. May be a parent, a learner, an
  educator, or staff.
- `learnerId` — the student profile a lesson runs against. Always
  resolved through the learner profile graph, never assumed.
- `tenantId` — the organization the learner profile belongs to. Always
  resolved; never defaulted to a hardcoded value in learner-sensitive
  flows.
- `lessonRunId` — a single personalized lesson generation, persisted so
  it can be resumed, reviewed, and audited.

A parent reading their child's progress is a `userId` reading data for a
different `learnerId`. A student signing in is a `userId` whose account
is explicitly linked to exactly one `learnerId`. Both cases must
traverse the same resolution layer.

## Global Build Rules

1. No placeholder learner-facing interactions.
2. No static lesson where a personalized lesson is required.
3. No use of `session.user.id` as `learnerId` unless the authenticated
   account is explicitly a student account mapped to that learner
   profile.
4. Every learner-facing lesson must be backed by `tenantId`, `learnerId`,
   and `lessonRunId`.
5. Every generated lesson must call the shared learner context layer
   before generation.
6. Every primary button must call a tested route.
7. Every primary route must have loading, empty, error, retry, and
   success states.
8. All route contracts must be frontend-safe and exposed through
   `/api/bff/*`.
9. Do not delete legacy routes until v2 routes pass end-to-end tests and
   redirects are installed.
10. Do not leave TODO, mock, demo, placeholder buttons, fake completion
    flows, or static fallback lessons in production learner paths.
11. Keep existing good modules unless a sprint explicitly replaces them.
12. Each sprint must include tests, route verification, accessibility
    checks, and a short implementation note in `docs/rebuild/`.

## Definitions

- **Personalized lesson** — a lesson whose plan, items, scaffolds,
  reading level, and accommodations were derived for this learner using
  their current brain profile, IEP, baseline, and mastery state.
- **Tutor-generated** — the lesson body is produced by the AI tutor
  pipeline at run time. A statically authored lesson can be cited as a
  source artifact, but cannot be returned to the learner unaltered as
  the day's primary lesson.
- **Stable BFF contract** — a route under `/api/bff/*` whose request
  and response shape is owned by the web app, versioned, type-checked,
  and tested. Direct calls from the browser to upstream services
  (`/api/engagement/...`, `/api/brain/...`, etc.) are legacy and must be
  re-fronted by a BFF route before they can be considered v2.
- **Quarantined** — the file or route is not deleted, but the next
  sprint that touches it owns either replacing it or formally adopting
  it as v2.

## How These Rules Are Enforced

- **Rule 3 (learnerId)** — enforced by a lint or test gate that fails
  when `user.id` is passed where `learnerId` is expected. Sprint that
  introduces the BFF must include this gate.
- **Rule 4 (tenantId / learnerId / lessonRunId)** — enforced by the
  BFF request schema; lesson endpoints will reject requests missing any
  of the three.
- **Rule 5 (learner context layer)** — enforced by routing all lesson
  generation through `@aivo/learner-context` (or its v2 successor) with
  no direct AI calls bypassing it.
- **Rule 8 (BFF)** — enforced by a no-direct-service-call lint rule on
  `apps/web/src/app/dashboard/**` once the BFF lands.
- **Rule 10 (no placeholders)** — enforced by the existing
  `prod:no-demo` script, extended to learner paths.

These enforcement mechanisms are scheduled in the risk register; Sprint
00 does not ship them.
