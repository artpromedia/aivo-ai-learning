"use client";
import { Map, Calculator, BookOpen, Beaker, Hourglass, Code2, ChevronRight, Swords, Camera } from "lucide-react";
import { TUTORS } from "@aivo/brand";
import { useFlVariant, LearnerCard } from "@aivo/learner-ui";

interface AdventuresTabProps {
  onNavigate: (path: string) => void;
}

const QUEST_WORLDS = [
  { name: "Mathlands", Icon: Calculator, tutor: "nova", slug: "nova" },
  { name: "Word World", Icon: BookOpen, tutor: "sage", slug: "sage" },
  { name: "Science Frontier", Icon: Beaker, tutor: "spark", slug: "spark" },
  { name: "Time Archive", Icon: Hourglass, tutor: "chrono", slug: "chrono" },
  { name: "Code Realm", Icon: Code2, tutor: "pixel", slug: "pixel" },
];

export function AdventuresTab({ onNavigate }: AdventuresTabProps) {
  const { isLow } = useFlVariant();

  return (
    <div className="space-y-6">
      <LearnerCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[hsl(262_83%_58%/0.12)] text-[hsl(262_83%_58%)]">
            <Map className="w-5 h-5" strokeWidth={2.5} aria-hidden />
          </div>
          <h3 className="font-extrabold text-slate-900">{isLow ? "Adventures" : "Quest Worlds"}</h3>
        </div>
        <div className="space-y-2">
          {QUEST_WORLDS.slice(0, isLow ? 3 : 5).map((world) => {
            const tutor = TUTORS[world.tutor as keyof typeof TUTORS];
            const color = tutor?.color || "#7C3AED";
            const Icon = world.Icon;
            return (
              <button
                key={world.slug}
                onClick={() => onNavigate(`/dashboard/learner/quests/${world.slug}`)}
                className="w-full flex items-center gap-3 bg-slate-50 hover:bg-white rounded-2xl px-4 py-3 border border-slate-100 hover:border-[hsl(262_83%_58%/0.3)] transition-all text-left group focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)]"
                style={{ minHeight: "var(--learner-hit-target, 56px)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}1f`, color }}
                  aria-hidden
                >
                  <Icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900">{world.name}</p>
                  <p className="text-xs text-slate-500 font-semibold">Explore quests</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[hsl(262_83%_58%)] transition-colors" aria-hidden />
              </button>
            );
          })}
        </div>
      </LearnerCard>

      {!isLow && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate("/dashboard/learner/challenges")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(340_82%_52%/0.1)] text-[hsl(340_82%_52%)] font-extrabold text-sm hover:bg-[hsl(340_82%_52%/0.16)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(340_82%_52%)]"
            style={{ minHeight: "var(--learner-hit-target, 40px)" }}
          >
            <Swords className="w-4 h-4" strokeWidth={2.5} aria-hidden /> Challenges
          </button>
          <button
            onClick={() => onNavigate("/dashboard/learner/homework")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[hsl(262_83%_58%/0.12)] text-[hsl(262_83%_58%)] font-extrabold text-sm hover:bg-[hsl(262_83%_58%/0.18)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(262_83%_58%)]"
            style={{ minHeight: "var(--learner-hit-target, 40px)" }}
          >
            <Camera className="w-4 h-4" strokeWidth={2.5} aria-hidden /> Homework Helper
          </button>
        </div>
      )}
    </div>
  );
}
