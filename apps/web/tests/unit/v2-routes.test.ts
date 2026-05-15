/**
 * AIVO v2 route smoke tests.
 *
 * For each Sprint 01 page, we:
 *   1. import the default export (a server component),
 *   2. invoke it (awaiting if it is async, since dynamic-route pages
 *      take `{ params: Promise<...> }`),
 *   3. render the returned React element to a static HTML string,
 *   4. assert that the page title and either a real primary CTA or a
 *      clearly-disabled preparation state is present, and
 *   5. assert that no obviously fake completion button is present.
 *
 * We deliberately do not mount with hooks; v2 Sprint 01 pages are
 * stateless server components, which is exactly what the renderer
 * needs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import LearnerSelectProfilePage from "../../src/app/learner-v2/select-profile/page.js";
import LearnerHomePage from "../../src/app/learner-v2/home/page.js";
import LearnerSubjectsPage from "../../src/app/learner-v2/subjects/page.js";
import LearnerSubjectDetailPage from "../../src/app/learner-v2/subjects/[subjectId]/page.js";
import LearnerLessonPage from "../../src/app/learner-v2/lesson/[lessonRunId]/page.js";
import LearnerQuestsPage from "../../src/app/learner-v2/quests/page.js";
import LearnerQuestWorldPage from "../../src/app/learner-v2/quests/[worldId]/page.js";
import LearnerQuestChapterPage from "../../src/app/learner-v2/quests/[worldId]/[chapterId]/page.js";

import ParentHomePage from "../../src/app/parent-v2/home/page.js";
import ParentLearnersPage from "../../src/app/parent-v2/learners/page.js";
import ParentLearnerDetailPage from "../../src/app/parent-v2/learners/[learnerId]/page.js";
import ParentLearnerAssessmentPage from "../../src/app/parent-v2/learners/[learnerId]/assessment/page.js";
import ParentLearnerProgressPage from "../../src/app/parent-v2/learners/[learnerId]/progress/page.js";
import ParentSettingsPage from "../../src/app/parent-v2/settings/page.js";

// Forbidden strings that would imply mock/static learning behavior in a
// production learner-facing page. The list is short on purpose — its
// job is to catch obvious regressions, not to be a security scanner.
const FORBIDDEN_SUBSTRINGS = [
  "Mark complete",
  "Mark as complete",
  "Fake",
  "TODO",
  "Lorem ipsum",
];

type AnyPage =
  | (() => ReactElement)
  | ((args: { params: Promise<Record<string, string>> }) => Promise<ReactElement>);

async function renderPage(
  Page: AnyPage,
  params?: Record<string, string>,
): Promise<string> {
  const out = params
    ? await (Page as (args: { params: Promise<Record<string, string>> }) => Promise<ReactElement>)({
        params: Promise.resolve(params),
      })
    : (Page as () => ReactElement)();
  return renderToStaticMarkup(out);
}

function assertSafe(html: string): void {
  for (const needle of FORBIDDEN_SUBSTRINGS) {
    assert.ok(
      !html.includes(needle),
      `page contains forbidden substring: ${needle}`,
    );
  }
}

function assertHasTitleAndAction(html: string, title: string): void {
  assert.ok(
    html.includes(title),
    `page title not rendered: ${title}`,
  );
  const hasPrimaryAction =
    html.includes('id="primary-action-title"') ||
    html.includes('role="status"');
  assert.ok(
    hasPrimaryAction,
    "page renders neither a primary action card nor a preparation state",
  );
}

test("/learner-v2/select-profile renders a profile picker preparation state", async () => {
  const html = await renderPage(LearnerSelectProfilePage);
  assertHasTitleAndAction(html, "Choose your profile");
  assertSafe(html);
});

test("/learner-v2/home renders the Today's Mission preparation state", async () => {
  const html = await renderPage(LearnerHomePage);
  assertHasTitleAndAction(html, "Hi there");
  assert.ok(html.includes("Select learner profile"));
  assertSafe(html);
});

test("/learner-v2/subjects renders a subject list preparation state", async () => {
  const html = await renderPage(LearnerSubjectsPage);
  assertHasTitleAndAction(html, "Subjects");
  assertSafe(html);
});

test("/learner-v2/subjects/[subjectId] renders a subject detail preparation state", async () => {
  const html = await renderPage(LearnerSubjectDetailPage, { subjectId: "math" });
  assertHasTitleAndAction(html, "Subject details");
  assertSafe(html);
});

test("/learner-v2/lesson/[lessonRunId] renders the lesson player preparation state", async () => {
  const html = await renderPage(LearnerLessonPage, { lessonRunId: "run-1" });
  assertHasTitleAndAction(html, "Your lesson");
  assert.ok(html.includes("lesson engine is being prepared"));
  assertSafe(html);
});

test("/learner-v2/quests renders the quest worlds preparation state", async () => {
  const html = await renderPage(LearnerQuestsPage);
  assertHasTitleAndAction(html, "Quest worlds");
  assertSafe(html);
});

test("/learner-v2/quests/[worldId] renders a quest world preparation state", async () => {
  const html = await renderPage(LearnerQuestWorldPage, { worldId: "w1" });
  assertHasTitleAndAction(html, "Quest world");
  assertSafe(html);
});

test("/learner-v2/quests/[worldId]/[chapterId] renders a quest chapter preparation state", async () => {
  const html = await renderPage(LearnerQuestChapterPage, {
    worldId: "w1",
    chapterId: "c1",
  });
  assertHasTitleAndAction(html, "Quest chapter");
  assertSafe(html);
});

test("/parent-v2/home renders the parent welcome state", async () => {
  const html = await renderPage(ParentHomePage);
  assertHasTitleAndAction(html, "Welcome to AIVO");
  assert.ok(html.includes("View learners"));
  assertSafe(html);
});

test("/parent-v2/learners renders the learner list preparation state", async () => {
  const html = await renderPage(ParentLearnersPage);
  assertHasTitleAndAction(html, "Your learners");
  assertSafe(html);
});

test("/parent-v2/learners/[learnerId] renders the learner overview preparation state", async () => {
  const html = await renderPage(ParentLearnerDetailPage, { learnerId: "l1" });
  assertHasTitleAndAction(html, "Learner overview");
  assertSafe(html);
});

test("/parent-v2/learners/[learnerId]/assessment renders the assessment preparation state", async () => {
  const html = await renderPage(ParentLearnerAssessmentPage, { learnerId: "l1" });
  assertHasTitleAndAction(html, "Assessment");
  assertSafe(html);
});

test("/parent-v2/learners/[learnerId]/progress renders the progress preparation state", async () => {
  const html = await renderPage(ParentLearnerProgressPage, { learnerId: "l1" });
  assertHasTitleAndAction(html, "Progress");
  assertSafe(html);
});

test("/parent-v2/settings renders the settings preparation state", async () => {
  const html = await renderPage(ParentSettingsPage);
  assertHasTitleAndAction(html, "Settings");
  assertSafe(html);
});
