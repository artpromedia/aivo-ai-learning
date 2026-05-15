# Sprint 02 — Implementation Note

## What this sprint shipped

The canonical AIVO v2 BFF foundation under `/api/bff/*`, the
supporting library under `apps/web/src/lib/v2/bff/`, and a minimal
frontend integration on the two v2 home surfaces.

## Files created

### BFF libraries (`apps/web/src/lib/v2/bff/`)

- `errors.ts` — `BffError`, `BffErrorException`, `bffError(code, override?)`, `isBffErrorException(value)`. Ten canonical codes with HTTP status, retryable flag, and user-safe message templates.
- `response.ts` — `bffSuccess(data, requestId)` and `bffFailure(error, requestId)` return `NextResponse` objects matching the contract.
- `request-id.ts` — `getOrCreateRequestId(request)` reuses `x-request-id` / `x-correlation-id` / `x-amzn-trace-id` when present and well-formed; `generateRequestId()` falls back to `crypto.randomUUID` with a base36 secondary.
- `session.ts` — `getRequiredSession(request)`, `getOptionalSession(request)`, `getCurrentUserRole(session)`, `buildTestSession(...)`. Verifies the JWT via `@aivo/security`'s `verifyJWT`. Malformed or missing claims map to `UNAUTHENTICATED`.
- `tenant.ts` — `resolveTenantForSession(session)`, `resolveTenantForLearner(session, learner)`. Production never uses a hardcoded "default" tenant; a `tenant-dev-local` fallback exists only when `NODE_ENV !== "production"` and `AIVO_BFF_ALLOW_DEV_TENANT=1` is set.
- `active-learner.ts` — `getActiveLearner`, `setActiveLearner`, `clearActiveLearner`, `requireActiveLearner`. Stores the choice in an HTTP-only cookie (`aivo_active_learner_v2`, `SameSite=Lax`, `Secure` in production, 30-day max age) and re-validates on read.
- `authorization.ts` — `assertCanAccessLearner`, `assertCanManageLearner`, `assertCanViewLearnerProgress`. The accessible-learner list is pulled from identity-svc's `/api/users/learners`, and the relationship is derived from the role + the learner record. The deps are injectable so tests stub the lookup.
- `service-client.ts` — `callService<T>(options)`. Single fetch wrapper that injects `x-user-id`, `x-tenant-id`, `x-learner-id`, `x-request-id`, `x-internal-service: web-bff`, plus the bearer token. 8-second timeout. Non-2xx statuses map to standard error codes; upstream bodies never leak to the browser.

### BFF routes (`apps/web/src/app/api/bff/`)

- `me/route.ts` — `GET /api/bff/me`
- `learners/route.ts` — `GET /api/bff/learners`
- `learners/[learnerId]/route.ts` — `GET /api/bff/learners/:learnerId`
- `learners/[learnerId]/context/route.ts` — `GET /api/bff/learners/:learnerId/context`
- `active-learner/route.ts` — `GET`, `POST`, `DELETE /api/bff/active-learner`

All five declare `runtime = "nodejs"` and `dynamic = "force-dynamic"`
so they never cache and can use `next/headers` cookies.

### Frontend integration

- `apps/web/src/components/v2/data/me-banner.tsx` — small client
  component that reads `/api/bff/me` on mount and renders a one-line
  status banner. On the parent home it shows the signed-in user;
  on the learner home it shows "no learner profile selected" (with
  a link to `/learner-v2/select-profile`) or "Learning as <name>".
  Renders nothing on first paint so the Sprint 01 smoke tests
  continue to pass unchanged.
- `apps/web/src/app/learner-v2/home/page.tsx` and
  `apps/web/src/app/parent-v2/home/page.tsx` mount `MeBanner` at the
  top of their content region.

### Documentation

- `docs/rebuild/aivo-v2-bff-contract.md` — per-route purpose,
  request/response shapes, auth rules, error map, identity model,
  cookie policy, service-client header policy.
- `docs/rebuild/sprint-02-implementation-note.md` (this file).

### Tests

- `apps/web/tests/unit/v2-bff.test.ts` — 28 tests covering each lib
  module. Stub deps are used for `authorization.ts` so the suite
  runs without booting identity-svc.

### Workspace change

- `apps/web/package.json` adds `@aivo/security` as a workspace
  dependency. `verifyJWT` runs in the BFF's Node runtime; jose is
  already in the lockfile via that package.

## Identity rules enforced by Sprint 02

```txt
session.user.id   = authenticated account (from JWT sub)
tenantId          = JWT tenantId, or learner.tenantId for learner-scoped operations
learnerId         = the learner profile id, never the user id
activeLearnerId   = HTTP-only cookie, re-validated on every read
```

`assertCanAccessLearner` requires the learner to be present in the
authorization listing AND the role-specific relationship check to
pass. A learner whose id happens to equal `session.userId` but
whose `userId`/`parentId` does not match fails the check.

## Error policy

- No raw upstream error bodies are returned to the browser.
- No stack traces in responses.
- `error.userMessage` is always safe for learner and parent
  surfaces.
- `error.message` is developer-facing only.
- All routes propagate `requestId` in both the body and the
  `x-request-id` response header.

## Sensitive-data policy

- `/api/bff/learners/:learnerId/context` returns categorical fields
  only. Sprint 02 ships the contract with `hasIEP: false` and empty
  arrays for everything else; Sprint 03 populates real values from
  assessment-svc and family-svc without changing the shape.
- Raw IEP text, clinician notes, and free-form profile fields will
  never appear in this route's response, even when the upstream
  service knows them.

## Frontend integration limits (intentional)

- `MeBanner` is the only v2 component that calls a BFF route in
  Sprint 02. The other Sprint 01 pages still render their
  preparation states.
- No middleware redirect points at v2 yet.
- The legacy `next.config.ts` rewrites are untouched.

## Known limitations

- **JWT keys must be present at runtime.** The BFF imports
  `verifyJWT` from `@aivo/security`. In development that package
  generates a key pair on first use; in production `JWT_PRIVATE_KEY`
  and `JWT_PUBLIC_KEY` must be set by Helm. This is the same
  requirement identity-svc already has.
- **Learner-context defaults are conservative.** Until Sprint 03,
  every learner returns `hasIEP: false` and empty accommodations.
  This is on purpose — fabricating accommodations would violate
  global rule 4 ("personalization must be backed by real data").
- **The service client calls identity-svc only.** Sprint 02 wires
  one upstream (the accessible-learner listing). Sprint 03 wires
  family-svc and assessment-svc through the same client.
- **Browser-side credentialed fetch is required for the active-learner
  cookie.** `MeBanner` uses `Authorization: Bearer` (in-memory JWT)
  and inherits cookies via the default browser fetch credentials
  policy. The BFF route cookie-writes are scoped to path `/`, so
  the same-origin SPA receives them automatically.

## Health check after Sprint 02

| Command | Result |
| --- | --- |
| `npx tsc --noEmit -p apps/web` | OK |
| `pnpm --filter @aivo/web lint` | OK (5 pre-existing warnings, 0 errors, 0 new findings) |
| `pnpm --filter @aivo/web test` | OK (108/108 pass; 28 new BFF unit tests) |

## Next sprint dependencies

| Sprint | Wires in |
| --- | --- |
| Sprint 03 | family-svc IEP, assessment-svc baseline, brain-svc snapshots; populates real values for `/learners/:id/context` without changing the shape. Adds v2 onboarding mutations through new BFF routes. |
| Sprint 04 | LessonRun schema and BFF routes (`/api/bff/lesson-runs/...`). The lesson player URL `/learner-v2/lesson/[lessonRunId]` becomes real. |
| Sprint 05 | Subjects feed via BFF (`/api/bff/learners/:learnerId/subjects`). |
| Sprint 06+ | AI lesson generation, lesson runner, Today's Mission decision engine. All consume the learner-resolution helper introduced in Sprint 02. |
| Sprint 12+ | Migration of legacy frontend `fetch("/api/<svc>/...")` calls to BFF routes. The active-learner cookie also replaces the existing parent-side learner-switcher state.

## Risk register touch-ups

- **R-01 (`session.user.id` used as `learnerId`)** — Sprint 02 introduces the canonical resolution helper. Legacy pages still violate the rule; v2 pages do not.
- **R-02 (hardcoded `tenantId: "current"`)** — addressed for v2 paths; legacy `homework/helper` page still violates the rule.
- **R-03 (no BFF boundary)** — Sprint 02 builds the boundary. Cutover happens incrementally per surface.
- **R-11 (no `typecheck` script)** — still open; the BFF route handlers depend on `tsc --noEmit -p apps/web` to typecheck.
