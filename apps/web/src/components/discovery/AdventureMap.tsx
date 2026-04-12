"use client";
import { ADVENTURE_CHAPTERS, type ChapterResult } from "./types";

interface AdventureMapProps {
  currentChapterIdx: number;
  chapterResults: ChapterResult[];
  totalChapters: number;
}

export default function AdventureMap({ currentChapterIdx, chapterResults, totalChapters }: AdventureMapProps) {
  const chapters = ADVENTURE_CHAPTERS.slice(0, totalChapters);
  const completedIds = new Set(chapterResults.map(r => r.chapterId));

  return (
    <div className="w-full px-4 py-3">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-white/10 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${(Math.max(0, currentChapterIdx) / Math.max(1, chapters.length - 1)) * 100}%` }}
        />

        {chapters.map((chapter, idx) => {
          const isCompleted = completedIds.has(chapter.id);
          const isCurrent = idx === currentChapterIdx;
          const isFuture = idx > currentChapterIdx;

          return (
            <div key={chapter.id} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${
                  isCompleted
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30 scale-100"
                    : isCurrent
                      ? "bg-white/20 backdrop-blur border-2 border-white/50 shadow-lg shadow-white/20 scale-110 animate-pulse"
                      : "bg-white/5 backdrop-blur border border-white/10 opacity-50 scale-90"
                }`}
              >
                {isCompleted ? "✓" : chapter.landmark.emoji}
              </div>
              <span
                className={`text-[10px] font-heading font-bold text-center max-w-[64px] leading-tight ${
                  isCompleted
                    ? "text-amber-300"
                    : isCurrent
                      ? "text-white"
                      : "text-white/30"
                }`}
              >
                {chapter.landmark.label}
              </span>
              {isCompleted && (
                <span className="text-xs">
                  {(() => {
                    const r = chapterResults.find(cr => cr.chapterId === chapter.id);
                    return r ? `${r.correct}/${r.total}` : "";
                  })()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
