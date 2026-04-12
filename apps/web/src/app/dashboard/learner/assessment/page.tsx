"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useDiscoveryEngine } from "@/components/discovery/useDiscoveryEngine";
import PreAdventure from "@/components/discovery/PreAdventure";
import AdventureMap from "@/components/discovery/AdventureMap";
import ChapterIntro from "@/components/discovery/ChapterIntro";
import ActivityRenderer from "@/components/discovery/ActivityRenderer";
import ChapterComplete from "@/components/discovery/ChapterComplete";
import Finale from "@/components/discovery/Finale";
import type { FunctioningLevel } from "@/components/discovery/types";

export default function DiscoveryAdventurePageWrapper() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧭</div>
          <p className="text-white/60 font-heading font-bold">Preparing your baseline assessment...</p>
        </div>
      </div>
    }>
      <DiscoveryAdventurePage />
    </Suspense>
  );
}

function DiscoveryAdventurePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryLearnerId = searchParams.get("learnerId");
  const [learnerFL, setLearnerFL] = useState<FunctioningLevel>("STANDARD");
  const [learnerName, setLearnerName] = useState("");
  const [resolvedLearnerId, setResolvedLearnerId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && accessToken) {
      const isParent = user.role === "PARENT";
      const effectiveLearnerId = queryLearnerId || user.id;

      const init = async () => {
        try {
          if (isParent && queryLearnerId) {
            const learnersRes = await fetch("/api/users/learners", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (learnersRes.ok) {
              const learnersList = await learnersRes.json();
              const found = learnersList.find((l: any) => l.id === queryLearnerId);
              if (found) {
                setLearnerName(found.name || "");
                if (found.functioningLevel) setLearnerFL(found.functioningLevel);
                setResolvedLearnerId(found.userId || queryLearnerId);
              }
            }
          } else {
            setLearnerName(user.name || "");
            setResolvedLearnerId(user.id);
            const meRes = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${accessToken}` } });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData?.functioningLevel) setLearnerFL(meData.functioningLevel);
            }
          }

          const statusRes = await fetch(`/api/assessments/learner/discovery/${effectiveLearnerId}/status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData?.baselineCompleted) {
              router.replace(isParent ? "/dashboard/parent" : "/dashboard/learner");
              return;
            }
          }
        } catch {}
        setReady(true);
      };

      init();
    } else if (!loading && user && !accessToken) {
      setReady(true);
    }
  }, [user, loading, router, accessToken, queryLearnerId]);

  if (loading || !user || !ready) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧭</div>
          <p className="text-white/60 font-heading font-bold">Preparing your baseline assessment...</p>
          <div className="flex gap-1 justify-center mt-4">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  const effectiveId = resolvedLearnerId || user.id;

  return (
    <DiscoveryAdventureInner
      learnerId={effectiveId}
      learnerName={learnerName}
      functioningLevel={learnerFL}
      accessToken={accessToken}
    />
  );
}

function DiscoveryAdventureInner({
  learnerId,
  learnerName,
  functioningLevel,
  accessToken,
}: {
  learnerId: string;
  learnerName: string;
  functioningLevel: FunctioningLevel;
  accessToken: string | null;
}) {
  const router = useRouter();
  const {
    state,
    chapters,
    config,
    getCurrentActivity,
    getCurrentActivities,
    startAdventure,
    beginFirstChapter,
    startChapterActivities,
    handleAnswer,
    advanceToNextChapter,
    finishAdventure,
    submitResults,
  } = useDiscoveryEngine({ learnerId, learnerName, functioningLevel, accessToken });

  useEffect(() => {
    startAdventure();
  }, [startAdventure]);

  const currentChapter = chapters[state.currentChapterIdx];
  const currentActivity = getCurrentActivity();
  const currentActivities = getCurrentActivities();
  const lastResult = state.chapterResults[state.chapterResults.length - 1];

  if (state.phase === "loading") {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🧠</div>
          <p className="text-white/60 font-heading font-bold">Your AI friends are preparing activities...</p>
          <p className="text-white/30 text-sm mt-2 font-body">Personalizing just for you</p>
          <div className="flex gap-1 justify-center mt-4">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "pre-adventure") {
    return <PreAdventure learnerName={learnerName} onStart={beginFirstChapter} />;
  }

  if (state.phase === "chapter-intro" && currentChapter) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50">
          <AdventureMap
            currentChapterIdx={state.currentChapterIdx}
            chapterResults={state.chapterResults}
            totalChapters={chapters.length}
          />
        </div>
        <ChapterIntro
          chapter={currentChapter}
          chapterNumber={state.currentChapterIdx + 1}
          totalChapters={chapters.length}
          onReady={startChapterActivities}
        />
      </div>
    );
  }

  if (state.phase === "activity" && currentChapter && currentActivity) {
    return (
      <div>
        <div className="fixed top-0 left-0 right-0 z-50">
          <AdventureMap
            currentChapterIdx={state.currentChapterIdx}
            chapterResults={state.chapterResults}
            totalChapters={chapters.length}
          />
        </div>
        <ActivityRenderer
          activity={currentActivity}
          chapter={currentChapter}
          activityNumber={state.currentActivityIdx + 1}
          totalActivities={currentActivities.length}
          onAnswer={handleAnswer}
          onSkip={() => handleAnswer(false, 0)}
        />
      </div>
    );
  }

  if (state.phase === "chapter-complete" && currentChapter && lastResult) {
    return (
      <ChapterComplete
        chapter={currentChapter}
        result={lastResult}
        isLastChapter={state.currentChapterIdx >= chapters.length - 1}
        onContinue={advanceToNextChapter}
      />
    );
  }

  if (state.phase === "finale") {
    return (
      <Finale
        learnerName={learnerName}
        chapterResults={state.chapterResults}
        totalCorrect={state.totalCorrect}
        totalAttempts={state.totalAttempts}
        xpEarned={state.xpEarned}
        functioningLevel={functioningLevel}
        onFinish={() => router.push("/dashboard/learner")}
        onSubmitResults={submitResults}
      />
    );
  }

  if (state.phase === "results") {
    router.push("/dashboard/learner");
    return null;
  }

  return null;
}
