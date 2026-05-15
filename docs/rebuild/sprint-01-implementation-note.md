# Sprint 01 — Implementation Note

## What this sprint shipped

The v2 product architecture and route skeleton landed alongside the
legacy routes. No legacy code was modified.

## Files created

### Shared v2 components (`apps/web/src/components/v2/`)
- `layout/app-shell.tsx`
- `layout/learner-shell.tsx`
- `layout/parent-shell.tsx`
- `shared/primary-action-card.tsx`
- `shared/empty-state.tsx`
- `shared/error-state.tsx`
- `shared/loading-state.tsx`
- `shared/retry-panel.tsx`
- `shared/page-header.tsx`
- `shared/accessibility-toolbar.tsx`

### Learner v2 routes (`apps/web/src/app/learner-v2/`)
- `layout.tsx`
- `select-profile/page.tsx`
- `home/page.tsx`
- `subjects/page.tsx`
- `subjects/[subjectId]/page.tsx`
- `lesson/[lessonRunId]/page.tsx`
- `quests/page.tsx`
- `quests/[worldId]/page.tsx`
- `quests/[worldId]/[chapterId]/page.tsx`

### Parent v2 routes (`apps/web/src/app/parent-v2/`)
- `layout.tsx`
- `home/page.tsx`
- `learners/page.tsx`
- `learners/[learnerId]/page.tsx`
- `learners/[learnerId]/assessment/page.tsx`
- `learners/[learnerId]/progress/page.tsx`
- `settings/page.tsx`

### Documentation (`docs/rebuild/`)
- `aivo-v2-information-architecture.md`
- `aivo-v2-ux-principles.md`
- `aivo-v2-route-map.md`
- `sprint-01-implementation-note.md` (this file)

### Tests (`apps/web/tests/unit/`)
- `v2-routes.test.ts` — renders every v2 page through `react-dom/server`
  and asserts page title, primary CTA or preparation state, and
  absence of forbidden mock substrings (`Mark complete`, `Fake`,
  `TODO`, `Lorem ipsum`).

## Routes created

14 routes total, all rendering a preparation state with at most one
primary CTA. The list and per-route status lives in
`docs/rebuild/aivo-v2-route-map.md`.

## Components created

10 shared components. The shells (`learner-shell`, `parent-shell`,
`app-shell`) are server components; the two interactive helpers
(`accessibility-toolbar`, `retry-panel`) are client components. All
others are server components so they can be statically rendered and
tested without a DOM.

## Conventions used

- App-router server components throughout. Pages with dynamic params
  declare them as `Promise<...>` and `await` the param (Next 15 form),
  even when the value is not yet consumed, so the URL contract is
  honest.
- Tailwind classes match the repo's existing patterns (slate, violet,
  amber, rose; `rounded-2xl` / `rounded-3xl`; `font-heading` and
  `font-body` variables from the root layout).
- Components live under `src/components/v2/` so they cannot be
  imported into legacy pages by accident and so a future cleanup can
  delete `v2` as a unit when the rebuild promotes routes back to the
  canonical paths.
- Tests use Node's built-in test runner (`tsx --test`) and
  `react-dom/server`'s `renderToStaticMarkup` to keep parity with the
  existing test harness.

## Known limitations

- **Every primary CTA is either a real `Link` (to another v2 shell
  page) or a disabled button with a user-safe reason.** No CTA on a v2
  page calls a real API yet; that begins in Sprint 02.
- **Middleware does not route to v2.** The matcher in
  `apps/web/src/middleware.ts` is unchanged. Hitting a `/learner-v2/*`
  or `/parent-v2/*` URL works directly; no role-home redirects point
  there.
- **The accessibility toolbar persists preferences to localStorage and
  writes `data-v2-text-size` / `data-v2-motion` onto
  `documentElement`, but no v2 page yet reads those attributes to
  change rendering.** Sprint 03 wires them into the lesson player.
- **Each `.tsx` page and shell explicitly imports `import * as React
  from "react"`.** This is needed because the repo's `tsconfig.json`
  uses `"jsx": "preserve"` (handled by Next's compiler at build time);
  the Node test runner uses esbuild's classic JSX transform which
  requires the in-scope `React` symbol. The import has no runtime
  cost.
- **No content data is fetched.** Pages render preparation states with
  static copy. No `useAuth`, no `useRouter`, no `fetch` is invoked
  from a v2 page in Sprint 01.

## What did not change

- No legacy route was deleted, moved, or modified.
- `apps/web/next.config.ts` rewrites are unchanged.
- `apps/web/src/middleware.ts` is unchanged.
- `apps/web/src/app/page.tsx` role-home routing is unchanged.
- No database migration. No new schema.
- `pnpm install`, `npx tsc --noEmit -p apps/web`, `pnpm --filter @aivo/web lint`, and `pnpm --filter @aivo/web test` all pass on this branch. `pnpm --filter @aivo/web test` reports 80/80 unit tests.

## Health check after Sprint 01

| Command | Result |
| --- | --- |
| `npx tsc --noEmit -p apps/web` | OK |
| `pnpm --filter @aivo/web lint` | OK (5 pre-existing warnings, 0 errors, no new findings) |
| `pnpm --filter @aivo/web test` | OK (80/80 pass; 14 new v2 route smoke tests) |

## Next sprint dependencies

| Sprint | What it must deliver before the v2 surface can render real content |
| --- | --- |
| Sprint 02 | `/api/bff/*` foundation and the learner-resolution helper that turns a session into `(tenantId, learnerId)`. The two "select profile" and "view learners" CTAs need this. |
| Sprint 03 | v2 onboarding flow, v2 assessment flow, v2 IEP/accommodations input. The parent learner detail and assessment pages need this. |
| Sprint 04 | `LessonRun` schema and persistence. The lesson player URL becomes real here. |
| Sprint 05 | Subjects feed in the BFF. |
| Sprint 06 | AI lesson generation pipeline that goes through the learner-context layer. |
| Sprint 07 | Lesson runner that consumes a `LessonRun` and emits progress events. |
| Sprint 08 | Today's Mission decision engine. The learner home flips its CTA. |
| Sprint 09 | Quests as personalized lesson adventures. |
| Sprint 10 | Plain-language progress summary for parents. |
| Sprint 11 | v2 settings flow. |

Beyond those, Sprint 12+ owns redirects from legacy URLs to the v2
URLs, the cleanup of legacy routes, and the removal of the `v2`
suffix from the URL space.
