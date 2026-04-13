"use client";

const BRAIN_FEATURES = [
  {
    icon: "🔄",
    title: "Continuous Adaptation",
    desc: "The brain clone evolves with every interaction, adjusting difficulty, pace, and teaching style in real-time.",
  },
  {
    icon: "📸",
    title: "Snapshots & Rollback",
    desc: "Save brain states at key milestones. If something isn't working, roll back and try a different approach.",
  },
  {
    icon: "🎯",
    title: "Multi-Dimensional Mastery",
    desc: "Tracks progress across cognitive, behavioral, communication, and academic domains simultaneously.",
  },
  {
    icon: "🔗",
    title: "Cross-Tutor Intelligence",
    desc: "What one tutor learns about your child, all tutors know — creating a unified learning experience.",
  },
];

export function BrainClone() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">
            Core Technology
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            The Brain Clone
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-body">
            A living digital model of your child&apos;s learning mind — it grows, adapts, and remembers so every lesson picks up exactly where they left off.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse motion-reduce:animate-none" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600/30 to-cyan-600/30 animate-pulse motion-reduce:animate-none" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-700/40 to-cyan-700/40 animate-pulse motion-reduce:animate-none" style={{ animationDelay: "1s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl">🧠</span>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-lg shadow-lg shadow-amber-400/30">⚡</div>
              <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-emerald-400/30">📊</div>
              <div className="absolute top-1/2 -right-4 w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center text-lg shadow-lg shadow-pink-400/30">🎯</div>
            </div>
          </div>

          <div className="space-y-6">
            {BRAIN_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-white mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-400 font-body leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
