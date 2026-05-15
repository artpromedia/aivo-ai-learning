# AIVO v2 — UX Principles

The principles below are the bar every v2 surface must clear. They
are smaller than a style guide on purpose: a screen either follows them
or it does not ship.

## 1. One primary action per screen

Every page has exactly one primary call-to-action. Secondary links may
exist as plain text or as muted card links, but there is only one
hero. If a page genuinely has two equal actions, it is the wrong page.

## 2. Child-first learner experience

The learner surface is built for a child sitting in front of a screen,
not a power user.

- Hit targets for primary controls are at least 44x44 px; lesson and
  navigation controls land closer to 56 px.
- Copy is short, direct, in the second person.
- No nested navigation; one back/home pair, no breadcrumbs, no menus.
- No dashboards.

## 3. Plain-language parent experience

The parent surface is built for a busy adult who does not work in
education.

- No jargon. "Personalized lesson", "assessment", "progress" — yes.
  "Mastery curve", "EWMA", "DKT" — no.
- One sentence of context per page below the title.
- Plain-language summaries, not analytics dashboards. If a chart is
  the only way to convey something, write the sentence first and
  decide whether the chart adds anything.

## 4. No fake progress

A surface never claims that a lesson was generated, completed, or
graded unless the BFF returned that record. If the engine is not
ready, the surface says so in plain language and offers the next real
step. Sprint 01's pages illustrate the pattern.

## 5. No placeholder learning flows

No buttons that lead nowhere. No "Coming soon" overlays that block a
real action. If a CTA cannot be honored, it is rendered as a disabled
button with a user-safe reason, not as a stylized link that bounces
the user back to the same page.

## 6. Accessibility and neurodiversity by default

Every v2 page renders the shared accessibility toolbar slot. Every
page meets the bar from the existing `docs/accessibility-guidelines.md`
plus these v2 additions:

- Semantic landmarks: one `<main>`, one `<header>`, named sections.
- Visible focus rings on every interactive element.
- Reduced-motion preference honored everywhere animation appears.
- Text-size preference honored everywhere text larger than the base
  appears.
- Skip-to-main-content link as the first focusable element.

## 7. Personalization must be visible

When AIVO has personalized something, the surface says how. "This
lesson uses your IEP reading accommodations" is acceptable. Silent
personalization is forbidden because parents and learners cannot
trust what they cannot see.

## 8. Errors must be recoverable

Every error surface either retries in place, points at a single
recoverable action, or links to support. There are no dead ends.
There are no raw upstream error strings on a learner page; the parent
page may show a one-sentence technical hint and a request-id for
support, but never a stack trace.

## 9. Frontend routes must never expose backend complexity

URLs are written for users, not for upstream services. The URL
`/learner-v2/lesson/[lessonRunId]` says "lesson"; the underlying
implementation may call ai-svc and tutor-svc and the lesson runner
inside the BFF, but the URL never says so. The same applies to error
copy and to the accessibility toolbar.

## 10. One source of truth per fact

A learner's grade band lives in one place. A learner's IEP
accommodations live in one place. The BFF reads each fact from the
canonical service and the surface reads from the BFF — never directly
from another service that happens to also know the fact. When two
copies of a fact exist (legacy and v2), the v2 surface picks the
canonical one and the legacy surface migrates onto it.

## Enforcement

The principles above are enforced through:

- Code review against this document during sprint completion.
- The `prod:no-demo` script, extended to fail on learner-path demo
  fallbacks (Sprint 02).
- Lint rules added when the BFF lands: no direct `fetch("/api/<svc>")`
  inside `apps/web/src/app/{learner-v2,parent-v2}` (Sprint 02).
- Smoke tests that assert each v2 page has a single primary CTA or a
  clearly-disabled preparation state (Sprint 01 introduces the
  pattern).
- Accessibility tests under `tests/a11y/` extended to cover the v2
  routes once they ship real content.
