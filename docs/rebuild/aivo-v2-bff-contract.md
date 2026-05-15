# AIVO v2 — BFF Contract

The AIVO v2 BFF is the single API surface used by the v2 frontend.
Browsers never call `identity-svc`, `family-svc`, `learning-svc`,
`ai-svc`, or any other upstream service directly. They call
`/api/bff/*` routes that own their own request and response shapes,
own authorization, and own the translation to upstream services.

## Identity model

```txt
session.user.id   = authenticated account
tenantId          = resolved family/school/platform tenant context
learnerId         = selected child/student learner profile
activeLearnerId   = persisted selected learner profile for the session
```

The BFF **never** assumes `session.user.id === learnerId` except in
the single case where a verified student account is mapped to its own
learner profile via `learners.userId`. The verification runs inside
`assertCanAccessLearner` and uses identity-svc's accessible-learners
listing as the source of truth.

## Response envelope

Every BFF route returns one of:

```ts
type BffSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

type BffFailure = {
  ok: false;
  error: {
    code: string;
    message: string;       // developer-facing
    userMessage: string;   // user-safe
    retryable: boolean;
  };
  requestId: string;
};
```

`requestId` is also set as an `x-request-id` response header so log
correlation works without parsing the body.

## Standard error codes

| Code | HTTP | Retryable | userMessage (English) |
| --- | --- | --- | --- |
| `UNAUTHENTICATED` | 401 | no | You need to sign in to continue. |
| `FORBIDDEN` | 403 | no | You do not have access to this. |
| `TENANT_NOT_FOUND` | 400 | no | We could not find your account. Please sign in again. |
| `LEARNER_NOT_FOUND` | 404 | no | We could not find that learner. |
| `ACTIVE_LEARNER_NOT_SET` | 409 | no | Please choose a learner profile to continue. |
| `INVALID_LEARNER_ACCESS` | 403 | no | You do not have access to this learner. |
| `SERVICE_UNAVAILABLE` | 503 | yes | We could not load this just now. Please try again in a moment. |
| `UPSTREAM_TIMEOUT` | 504 | yes | This is taking longer than usual. Please try again. |
| `VALIDATION_ERROR` | 400 | no | Some of the information was incorrect. Please check and try again. |
| `UNKNOWN_ERROR` | 500 | yes | Something went wrong. Please try again. |

A v2 surface that needs a more specific user message can render its
own copy keyed on `error.code`; the BFF's `userMessage` is always
safe to display verbatim.

## Routes

### `GET /api/bff/me`

| Aspect | Value |
| --- | --- |
| Purpose | Return authenticated user, resolved tenant, and current active learner. The first call every v2 surface makes. |
| Auth | Required (`Authorization: Bearer <jwt>`). |
| Request | None. |
| Response shape | `BffSuccess<{ user: { id, role, name?, email? }, tenant: { id, type?, name? } \| null, activeLearner: { id, displayName, readinessState? } \| null }>` |
| learnerId handling | Returns `activeLearner` only if the stored active-learner cookie still maps to a learner the session may access. Stale cookies are silently treated as "no active learner"; they are not removed by this endpoint. |
| tenantId handling | Reads from the JWT. Tenant resolution failure is non-fatal — the body returns `tenant: null` so the surface can render a setup screen. |
| Error behavior | `UNAUTHENTICATED` if no token. Any other error returns `UNKNOWN_ERROR`. |
| Future sprint dependency | Sprint 03 enriches `tenant.type` / `tenant.name`. Sprint 04 enriches `activeLearner.readinessState` with LessonRun gating data. |

### `GET /api/bff/learners`

| Aspect | Value |
| --- | --- |
| Purpose | List every learner profile the session may access. |
| Auth | Required. |
| Request | None. |
| Response shape | `BffSuccess<{ learners: Array<{ id, displayName, gradeBand?, avatarUrl?, readinessState?, relationship? }> }>` |
| learnerId handling | Returned `id` is always the learner profile id, not a user id. |
| tenantId handling | Filtered upstream by identity-svc's authorization. The BFF does not pass `tenantId` on this call — identity-svc derives it from the bearer token. |
| Error behavior | `UNAUTHENTICATED`, `SERVICE_UNAVAILABLE`. |
| Future sprint dependency | Sprint 03 adds `readinessState` (`baseline_required`, `assessment_pending`, `ready`, etc.). |

### `GET /api/bff/learners/[learnerId]`

| Aspect | Value |
| --- | --- |
| Purpose | Return the public profile fields for one learner. |
| Auth | Required. |
| Request | None. |
| Response shape | `BffSuccess<{ learner: { id, displayName, gradeBand?, ageRange?, readinessState?, profileSummary? } }>` |
| learnerId handling | Authorized via `assertCanAccessLearner`. A session that cannot list this learner gets `INVALID_LEARNER_ACCESS` (not `LEARNER_NOT_FOUND`) — this prevents existence leaks. |
| tenantId handling | Tenant is derived from the learner record (see `resolveTenantForLearner`). |
| Error behavior | `UNAUTHENTICATED`, `INVALID_LEARNER_ACCESS`, `SERVICE_UNAVAILABLE`. |
| Future sprint dependency | Sprint 03 enriches `readinessState`, `ageRange`, `profileSummary`. |

### `GET /api/bff/learners/[learnerId]/context`

| Aspect | Value |
| --- | --- |
| Purpose | Frontend-safe learner context summary. Drives the personalization-visible cues on v2 learner and parent surfaces. |
| Auth | Required. |
| Request | None. |
| Response shape | `BffSuccess<{ learnerId, gradeBand?, hasIEP, disabilityCategories?, accommodationSummary: Array<{ type, label, learnerVisible }>, accessibilityDefaults: { textSize?, readAloud?, reducedMotion?, highContrast?, dyslexiaFriendly? }, readinessState? }>` |
| learnerId handling | Authorized via `assertCanAccessLearner`. |
| tenantId handling | Same as `/learners/:id`. |
| Sensitivity | **Never** returns raw IEP document text, clinician notes, or any free-form field. Sprint 02 ships the contract with conservative defaults (`hasIEP: false`, empty arrays). Sprint 03 populates real values without changing the shape. |
| Error behavior | `UNAUTHENTICATED`, `INVALID_LEARNER_ACCESS`, `SERVICE_UNAVAILABLE`. |
| Future sprint dependency | Sprint 03 wires assessment-svc baseline and family-svc IEP into this route. Sprint 06 honors `accessibilityDefaults` in the lesson player. |

### `GET /api/bff/active-learner`

| Aspect | Value |
| --- | --- |
| Purpose | Return the session's current active learner. |
| Auth | Required. |
| Request | None. |
| Response shape | `BffSuccess<{ activeLearner: { id, displayName, readinessState? } \| null }>` |
| Behavior | If the cookie references a learner the session can no longer reach, the BFF returns `activeLearner: null` rather than an error. |

### `POST /api/bff/active-learner`

| Aspect | Value |
| --- | --- |
| Purpose | Set the active learner for the session. |
| Auth | Required. |
| Request body | `{ learnerId: string }` |
| Response shape | `BffSuccess<{ activeLearner: { id, displayName, readinessState? } }>` |
| Authorization | `assertCanAccessLearner` runs before the cookie is written. Setting an unreachable learner returns `INVALID_LEARNER_ACCESS`; the cookie is not touched. |
| Cookie | `aivo_active_learner_v2`, HTTP-only, `SameSite=Lax`, `Secure` in production, 30-day max age, path `/`. |
| Error behavior | `UNAUTHENTICATED`, `VALIDATION_ERROR` (missing/invalid id), `INVALID_LEARNER_ACCESS`. |

### `DELETE /api/bff/active-learner`

| Aspect | Value |
| --- | --- |
| Purpose | Clear the active learner cookie. |
| Auth | Required. |
| Response shape | `BffSuccess<{ activeLearner: null }>` |
| Cookie | Set with `maxAge: 0`, same name and path as the set operation. |

## Service-client policy

The internal service client (`apps/web/src/lib/v2/bff/service-client.ts`)
injects the following headers on every upstream call:

```txt
authorization: Bearer <session token>
x-user-id:           <session.userId>
x-tenant-id:         <resolved tenantId>
x-learner-id:        <active or supplied learnerId, when present>
x-request-id:        <BFF request id>
x-internal-service:  web-bff
```

A default 8-second timeout aborts the upstream call. Network errors,
aborts, and non-2xx statuses are normalized to the standard error
codes — upstream error bodies are never relayed to the browser.

Service base URLs come from the same env vars `apps/web/next.config.ts`
uses for its browser-side rewrites. In production, an unset env var
raises `SERVICE_UNAVAILABLE` before any upstream call is made.

## Active-learner integrity

The active-learner value lives in a single HTTP-only cookie. It is
**not** signed; it is **re-validated** on every read against the
authorization graph, so a forged cookie value still fails the
relationship check inside `assertCanAccessLearner`. We pick this
trade-off because the cookie's only use is to remember a UI choice,
not to grant access.

## Frontend integration policy

- Browsers call `/api/bff/*` and nothing else.
- The web app may still fan out to the legacy rewrites
  (`/api/identity/*`, `/api/family/*`, etc.) from legacy routes; the
  v2 routes never do.
- The BFF is server-side only. `apps/web/src/lib/v2/bff/*` modules
  are never imported into client components — they import
  `next/headers` and Node-only crypto.
- Surfaces read `userMessage` from the failure body verbatim. They
  may swap in their own copy keyed on `error.code` but they must not
  render `error.message` to learners.

## Out of scope for Sprint 02

- Personalized lesson generation, LessonRun schema, AI calls.
- Onboarding mutations, IEP upload, assessment submission.
- Quest rebuild.
- Real values for `readinessState`, `accommodationSummary`,
  `accessibilityDefaults` — populated in Sprint 03.
- Migration of legacy routes from direct rewrites to BFF. Tracked in
  the risk register as R-14.
