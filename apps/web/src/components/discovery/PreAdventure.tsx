"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { TUTORS, type TutorKey } from "@aivo/brand";
import { TUTOR_INTROS } from "./types";

interface PreAdventureProps {
  learnerName: string;
  onStart: () => void;
}

export default function PreAdventure({ learnerName, onStart }: PreAdventureProps) {
  const [visibleTutors, setVisibleTutors] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    TUTOR_INTROS.forEach((_, idx) => {
      timers.push(setTimeout(() => setVisibleTutors(idx + 1), 800 + idx * 900));
    });
    timers.push(setTimeout(() => setShowButton(true), 800 + TUTOR_INTROS.length * 900 + 400));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              animationName: "twinkle",
              animationDuration: `${2 + (i % 3)}s`,
              animationDelay: `${(i * 0.3) % 2}s`,
              animationIterationCount: "infinite",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg">
        <div className="text-6xl mb-4 animate-bounce">🔥</div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
          Hi{learnerName ? `, ${learnerName}` : ""}!
        </h1>
        <p className="text-lg text-white/70 font-body mb-8">
          Some really cool friends want to meet you. They&apos;re going to take you on an amazing adventure!
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {TUTOR_INTROS.map((intro, idx) => {
            const tutor = TUTORS[intro.tutorKey];
            const isVisible = idx < visibleTutors;
            return (
              <div
                key={intro.tutorKey}
                className={`flex flex-col items-center gap-2 transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-75"
                }`}
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-3 shadow-lg transition-transform hover:scale-110"
                  style={{ borderColor: intro.color, boxShadow: `0 0 20px ${intro.color}40` }}
                >
                  <Image src={tutor.avatar} alt={intro.name} width={64} height={64} className="object-cover" />
                </div>
                <p className="text-sm font-heading font-bold text-white">{intro.name}</p>
                <p className="text-[11px] text-white/60 font-body leading-tight">&ldquo;{intro.line}&rdquo;</p>
              </div>
            );
          })}
        </div>

        <div className={`transition-all duration-700 ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <button
            onClick={onStart}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xl font-heading font-bold shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform"
          >
            Let&apos;s Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
