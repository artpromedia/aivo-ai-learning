# AIVO v2 — Route Map

Every v2 route introduced in Sprint 01 is listed below with its
expected data dependency, current implementation status, and the
sprint that takes it past "shell only".

The "Future sprint dependency" column references the sprint that must
complete before the route can render real (non-preparation) content.

---

## Learner v2

### `/learner-v2/select-profile`
- **Role:** learner (or a parent acting on behalf of a learner)
- **Purpose:** pick which learner profile to use today.
- **Primary CTA:** Open my profile.
- **Data dependency:** `/api/bff/me/learner-profiles`
- **Current status:** shell only; renders a preparation empty state and a disabled primary CTA.
- **Future sprint dependency:** Sprint 02 (learner-resolution BFF route).

### `/learner-v2/home`
- **Role:** learner
- **Purpose:** show Today's Mission and the next best action.
- **Primary CTA:** Select learner profile (until the LessonRun engine is live; flips to "Start Today's Mission" later).
- **Data dependency:** `/api/bff/learners/:learnerId/today`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 04 (LessonRun) and Sprint 08 (Today's Mission decision engine).

### `/learner-v2/subjects`
- **Role:** learner
- **Purpose:** list the subjects assigned to the learner.
- **Primary CTA:** Go to Today's Mission.
- **Data dependency:** `/api/bff/learners/:learnerId/subjects`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 05 (subjects feed in the BFF).

### `/learner-v2/subjects/[subjectId]`
- **Role:** learner
- **Purpose:** lessons and quests for one subject.
- **Primary CTA:** Go to Today's Mission.
- **Data dependency:** `/api/bff/learners/:learnerId/subjects/:subjectId`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 05.

### `/learner-v2/lesson/[lessonRunId]`
- **Role:** learner
- **Purpose:** run a single personalized lesson.
- **Primary CTA:** Continue / Submit / Next step (depending on lesson phase).
- **Data dependency:** `/api/bff/lesson-runs/:lessonRunId`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 04 (LessonRun), Sprint 06 (AI lesson generation), Sprint 07 (lesson runner).

### `/learner-v2/quests`
- **Role:** learner
- **Purpose:** list quest worlds available to the learner.
- **Primary CTA:** Go to Today's Mission.
- **Data dependency:** `/api/bff/learners/:learnerId/quests`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 09 (quests as personalized lesson adventures).

### `/learner-v2/quests/[worldId]`
- **Role:** learner
- **Purpose:** list chapters in one quest world.
- **Primary CTA:** Go to Today's Mission.
- **Data dependency:** `/api/bff/quests/:worldId/chapters`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 09.

### `/learner-v2/quests/[worldId]/[chapterId]`
- **Role:** learner
- **Purpose:** run one chapter as a personalized lesson adventure.
- **Primary CTA:** Go to Today's Mission.
- **Data dependency:** `/api/bff/quests/:worldId/chapters/:chapterId/start` (creates a LessonRun and redirects to the lesson player).
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 09.

---

## Parent v2

### `/parent-v2/home`
- **Role:** parent
- **Purpose:** show a single next step ("add a learner", "complete assessment", "view learners").
- **Primary CTA:** View learners.
- **Data dependency:** `/api/bff/me/parent-state`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 02 (parent-state BFF route).

### `/parent-v2/learners`
- **Role:** parent
- **Purpose:** list every learner on the account with the next step for each.
- **Primary CTA:** Add a learner.
- **Data dependency:** `/api/bff/parents/:userId/learners`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 02 (learners feed), Sprint 03 (v2 onboarding flow).

### `/parent-v2/learners/[learnerId]`
- **Role:** parent
- **Purpose:** plain-language overview of one learner.
- **Primary CTA:** Open assessment (or Open Today's Mission once the engine is live).
- **Data dependency:** `/api/bff/learners/:learnerId/overview`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 03.

### `/parent-v2/learners/[learnerId]/assessment`
- **Role:** parent
- **Purpose:** the parent-led assessment that AIVO uses to prepare the first personalized lesson.
- **Primary CTA:** Start assessment.
- **Data dependency:** `/api/bff/learners/:learnerId/assessment`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 03 (v2 assessment flow).

### `/parent-v2/learners/[learnerId]/progress`
- **Role:** parent
- **Purpose:** plain-language summary of recent lessons and mastery.
- **Primary CTA:** Open learner overview.
- **Data dependency:** `/api/bff/learners/:learnerId/progress-summary`
- **Current status:** shell only.
- **Future sprint dependency:** Sprint 07 (lesson runner emits progress events) and Sprint 10 (parent progress summary).

### `/parent-v2/settings`
- **Role:** parent
- **Purpose:** account, notification, and consent preferences.
- **Primary CTA:** Open legacy settings (until v2 settings are built).
- **Data dependency:** `/api/bff/me/settings`
- **Current status:** shell only with a single CTA back to the legacy settings page.
- **Future sprint dependency:** Sprint 11 (v2 settings flow).

---

## Cross-cutting

- No middleware redirect points at the v2 routes in Sprint 01.
- No role-home routing change in Sprint 01.
- Every v2 page renders the accessibility toolbar slot.
- Every page above renders either a real primary CTA or a disabled CTA with a user-safe reason. None of them render fake completion buttons, mock data, or static lessons.
