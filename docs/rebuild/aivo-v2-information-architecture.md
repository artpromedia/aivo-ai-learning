# AIVO v2 — Information Architecture

This document fixes the v2 information architecture so every later
sprint has a single picture to argue against. The architecture is
deliberately small: one home per role, one detail per noun, no
parallel admin-style dashboards.

## Top-level structure

```txt
Parent v2
  home
  learners
    learner detail
      assessment
      progress
  settings

Learner v2
  select profile
  home
  subjects
    subject detail
  lesson player
  quests
    quest world
      quest chapter

Shared
  BFF
  learner context
  LessonRun
  accessibility preferences
```

## Parent surface

| Section | URL | What lives here |
| --- | --- | --- |
| Home | `/parent-v2/home` | One page that answers "what should I do next?" — a single primary action, pointing at the learner list or at setup, depending on state. |
| Learners | `/parent-v2/learners` | The list of learners on the account. Each row links to the learner detail. |
| Learner detail | `/parent-v2/learners/[learnerId]` | The plain-language overview of one learner. Baseline status, IEP/accommodations status, recent lesson, next step. |
| Assessment | `/parent-v2/learners/[learnerId]/assessment` | The parent-led assessment for one learner. |
| Progress | `/parent-v2/learners/[learnerId]/progress` | Plain-language summary of recent lessons and mastery. No analytics charts in the first phase. |
| Settings | `/parent-v2/settings` | Account, notification, and consent preferences. Per-learner settings live on the learner detail page. |

## Learner surface

| Section | URL | What lives here |
| --- | --- | --- |
| Select profile | `/learner-v2/select-profile` | The single entry for an account that maps to multiple learner profiles. Renders the profile picker. |
| Home | `/learner-v2/home` | The learner's daily home. One card: Today's Mission. No tabs, no dashboard. |
| Subjects | `/learner-v2/subjects` | A flat list of subjects assigned to the learner. |
| Subject detail | `/learner-v2/subjects/[subjectId]` | Lessons and quests for one subject. |
| Lesson player | `/learner-v2/lesson/[lessonRunId]` | The canonical personalized-lesson surface. Always backed by a real `lessonRunId`. |
| Quests | `/learner-v2/quests` | Quest worlds the learner has access to. |
| Quest world | `/learner-v2/quests/[worldId]` | Chapter list for one world. |
| Quest chapter | `/learner-v2/quests/[worldId]/[chapterId]` | One chapter run as a personalized lesson adventure. Routes into the lesson player internally; the URL is preserved for adventure context. |

## Shared building blocks

| Building block | Sprint that owns it | Notes |
| --- | --- | --- |
| BFF (`/api/bff/*`) | Sprint 02 | The single boundary between the web app and upstream services. Every learner and parent page reads from BFF endpoints, not from upstream services directly. |
| Learner context | Sprint 02 (resolver) / Sprint 03 (snapshots) | The single library every lesson generator goes through. Produces `(tenantId, learnerId)` from a session, plus the snapshots used at generation time: brain profile, IEP/accommodations, baseline, mastery, grade band, sensory profile, parent settings. |
| LessonRun | Sprint 04 | The persistence model for a personalized lesson. Carries `(tenantId, learnerId, lessonRunId)` plus inputs and outputs. The lesson player is keyed on `lessonRunId`. |
| Accessibility preferences | Sprint 01 (shell) / Sprint 03 (lesson honoring) | Sprint 01 ships the toolbar slot and persists text-size / reduce-motion. Sprint 03 wires those preferences into the lesson player. |

## Core journey

The v2 journey, as it should read in marketing and in code:

```txt
1. Parent creates a learner.
2. Parent completes the assessment for that learner.
3. Parent optionally uploads an IEP / accommodations record.
4. AIVO builds the learner context.
5. AIVO prepares the baseline or, when baseline is done, the first
   personalized lesson.
6. Learner selects a profile.
7. Learner sees Today's Mission on the learner home.
8. Learner starts the personalized tutor-generated lesson.
9. Learner completes the guided lesson.
10. AIVO updates progress and mastery.
11. Parent sees a plain-language learning summary on the learner detail
    and on the progress page.
12. Learner can continue through Quest Worlds as personalized lesson
    adventures.
```

Each numbered step maps to exactly one v2 route (or one BFF action) and
each transition is observable through the BFF; that is the rebuild's
single most important contract.

## What is intentionally absent

- No second-level dashboards beyond learner detail.
- No admin-style charts on parent surfaces. Sprint 01's progress page
  is plain language; visual analytics come back only if a learning
  outcome requires them.
- No global search.
- No notifications inbox in v2 yet — the legacy inbox stays under
  `/dashboard/parent/inbox` until the v2 surface adopts it.
- No per-learner brain or IEP editor in the v2 tree yet; these live
  under the legacy parent surface until Sprint 03 brings them across.

## Where this differs from the legacy tree

| Legacy | v2 |
| --- | --- |
| `/dashboard/learner` (three tabs: today / adventures / rewards) | `/learner-v2/home` (one card: Today's Mission). Tabs collapse into the home and quests. |
| `/dashboard/learner/lesson/[tutorKey]` | `/learner-v2/lesson/[lessonRunId]`. The lesson URL is keyed on a lesson run, not on a tutor. |
| `/dashboard/parent` (onboarding + dashboard on one page) | `/parent-v2/home` + a separate onboarding flow surfaced from the learners list. |
| Two parent homework routes (`[learnerId]/homework` and `learner/[id]/homework`) | A single learner detail page that links into the homework helper. |

## Open questions tracked in the risk register

- R-08: Whether to move surfaces under the brief's `apps/web/src/app/learner` and `apps/web/src/app/parent` paths or to keep them under `learner-v2` / `parent-v2` and use middleware redirects later. Sprint 01 ships them under `learner-v2` and `parent-v2` to make the v2 boundary visible in the URL during development.
- R-09: Whether the shared library is named `@aivo/learner-context` or built on top of `@aivo/learner-surfaces`. Sprint 02 picks one.
