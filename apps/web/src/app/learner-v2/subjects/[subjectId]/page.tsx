import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function LearnerSubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  // The id is captured so the URL is real; Sprint 01 does not render
  // subject content yet.
  await params;
  return (
    <LearnerShell
      title="Subject details"
      backHref="/learner-v2/subjects"
      backLabel="Subjects"
    >
      <p className="mb-6 text-base text-slate-700">
        Lessons and quests for this subject will appear here.
      </p>
      <EmptyState
        title="Subject lessons are being prepared"
        description="Personalized lessons for this subject will appear once the lesson engine is ready."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Take me to Today&apos;s Mission"
          description="Today's Mission picks one lesson for you each day."
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
