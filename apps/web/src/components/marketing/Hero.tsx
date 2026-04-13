"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATS = [
  { value: "14", label: "AI Tutors" },
  { value: "5", label: "Functioning Levels" },
  { value: "10", label: "Languages" },
  { value: "24/7", label: "Adaptive Learning" },
];

export function Hero({ scrollY }: { scrollY: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none motion-reduce:hidden">
        <div
          className="absolute -top-32 -left-48 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute -top-20 -right-40 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute top-60 left-1/3 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-pink-100/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["🎮", "🧠", "🌟", "📚", "🎨", "🔬", "🎵", "🌍"].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl opacity-[0.08] select-none"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 17) % 70}%`,
              transform: `translateY(${scrollY * (0.03 + i * 0.01)}px) rotate(${i * 25}deg)`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 relative z-10 w-full">
        <div
          className={`text-center space-y-8 transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transform: `translateY(${scrollY * -0.12}px)` }}
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-purple-50/80 border border-purple-100 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-sm font-bold text-primary tracking-wide">
              The adaptive learning platform
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold text-slate-900 leading-[1.1] tracking-tight">
            Learning adventures
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
              for every mind
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-body">
            AIVO meets each learner where they are — from standard curriculum to
            pre-symbolic communication — with{" "}
            <span className="text-primary font-semibold">14 AI tutors</span> and{" "}
            <span className="text-primary font-semibold">brain-clone technology</span>{" "}
            that truly adapts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg hover:from-primary-dark hover:to-purple-700 transition-all shadow-xl shadow-purple-300/40 hover:shadow-purple-400/50 hover:-translate-y-0.5"
            >
              Start Free Trial
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-primary hover:text-primary transition-all hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto pt-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-heading font-bold text-primary">
                  {s.value}
                </p>
                <p className="text-sm text-slate-400 font-body font-semibold mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
