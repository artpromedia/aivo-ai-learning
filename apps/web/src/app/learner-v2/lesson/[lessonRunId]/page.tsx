import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function LearnerLessonPage({
  params,
}: {
  params: Promise<{ lessonRunId: string }>;
}) {
  // We accept the lessonRunId to keep the URL contract honest, but the
  // lesson runner is not implemented in Sprint 01. No fake content is
  // rendered.
  await params;
  return (
    <LearnerShell
      title="Your lesson"
      backHref="/learner-v2/home"
      backLabel="Home"
    >
      <EmptyState
        title="The lesson engine is being prepared"
        description="When the lesson engine is ready, this page will show your personalized lesson, your tutor, and the steps for today."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Back to Today&apos;s Mission"
          description="Today's Mission will tell you when a lesson is ready."
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
