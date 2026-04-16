"use client";
import Image from "next/image";
import { TUTORS } from "@aivo/brand";
import { useFlVariant } from "@aivo/learner-ui";

interface TutorShelfProps {
  onSelectTutor: (tutorKey: string) => void;
  recentTutorKey?: string;
}

export function TutorShelf({ onSelectTutor, recentTutorKey }: TutorShelfProps) {
  const { level, profile, isLow, isPreSymbolic } = useFlVariant();
  const allTutors = Object.entries(TUTORS);

  if (isPreSymbolic) return null;

  const visibleTutors = (() => {
    switch (profile.tutorShelfMode) {
      case "scroll": return allTutors;
      case "paged": return allTutors.slice(0, 6);
      case "limited": return allTutors.slice(0, 4);
      case "single": return recentTutorKey ? allTutors.filter(([k]) => k === recentTutorKey).slice(0, 1) : allTutors.slice(0, 1);
      default: return allTutors;
    }
  })();

  const sortedTutors = recentTutorKey
    ? [
        ...visibleTutors.filter(([k]) => k === recentTutorKey),
        ...visibleTutors.filter(([k]) => k !== recentTutorKey),
      ]
    : visibleTutors;

  return (
    <section className="px-4 md:px-8" aria-label="Your tutors">
      <h2 className={`font-heading font-bold text-slate-900 mb-4 ${isLow ? "text-2xl text-center" : "text-lg"}`}>
        {isLow ? "Pick a friend" : "Your Tutors"}
      </h2>
      <div
        className={`flex gap-4 pb-2 ${
          profile.tutorShelfMode === "scroll"
            ? "overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
            : "flex-wrap justify-center"
        }`}
      >
        {sortedTutors.map(([key, tutor]) => (
          <button
            key={key}
            onClick={() => onSelectTutor(key)}
            className={`
              flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl bg-white border-2 border-transparent
              shadow-sm hover:shadow-lg transition-all group
              focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2
              ${isLow ? "p-6 w-36" : "p-4 w-28"}
            `}
            style={{
              transitionDuration: "var(--learner-motion-ms, 300ms)",
              "--tw-ring-color": tutor.color,
            } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = tutor.color)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <div
              className={`relative rounded-full overflow-hidden shadow-md group-hover:scale-110 transition-transform ${
                isLow ? "w-20 h-20" : "w-14 h-14"
              }`}
              style={{ borderColor: tutor.color, borderWidth: isLow ? "4px" : "3px" }}
            >
              <Image src={tutor.avatar} alt={`${tutor.name} — ${tutor.domain}`} fill className="object-cover object-top" sizes={isLow ? "80px" : "56px"} />
            </div>
            <span className={`font-heading font-bold ${isLow ? "text-lg" : "text-sm"}`} style={{ color: tutor.color }}>
              {tutor.name}
            </span>
            {!isLow && (
              <span className="text-xs text-slate-400 font-semibold text-center leading-tight">{tutor.domain}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
