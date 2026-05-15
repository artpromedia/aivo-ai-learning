import * as React from "react";
import { LearnerShell } from "@/components/v2/layout/learner-shell";
import { EmptyState } from "@/components/v2/shared/empty-state";
import { PrimaryActionCard } from "@/components/v2/shared/primary-action-card";

export default async function LearnerQuestChapterPage({
  params,
}: {
  params: Promise<{ worldId: string; chapterId: string }>;
}) {
  const { worldId } = await params;
  return (
    <LearnerShell
      title="Quest chapter"
      backHref={`/learner-v2/quests/${worldId}`}
      backLabel="World"
    >
      <EmptyState
        title="This chapter is being prepared"
        description="When the lesson engine is ready, this chapter will run as a personalized lesson adventure."
      />
      <div className="mt-6">
        <PrimaryActionCard
          surface="learner"
          title="Back to Today&apos;s Mission"
          cta="Go to Today&apos;s Mission"
          ctaHref="/learner-v2/home"
        />
      </div>
    </LearnerShell>
  );
}
