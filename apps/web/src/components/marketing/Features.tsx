"use client";

const FEATURES = [
  {
    icon: "🎮",
    title: "5 Functioning Levels",
    desc: "From standard academics to pre-symbolic cause-and-effect — every child has a path designed just for them.",
    bg: "bg-purple-50",
    border: "border-purple-100",
    iconBg: "bg-purple-100",
    accent: "text-purple-600",
  },
  {
    icon: "🤖",
    title: "14 AI Tutors",
    desc: "Seven core tutors plus seven specialists, each with a unique personality covering every learning domain.",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    iconBg: "bg-cyan-100",
    accent: "text-cyan-600",
  },
  {
    icon: "🧠",
    title: "Brain Clone",
    desc: "An adaptive brain state that evolves with each learner — with snapshots, rollback, and continuous growth.",
    bg: "bg-amber-50",
    border: "border-amber-100",
    iconBg: "bg-amber-100",
    accent: "text-amber-600",
  },
  {
    icon: "🌍",
    title: "Region-Smart Curriculum",
    desc: "Dynamic curriculum aligned to your zip code and regional standards — automatically personalized to local requirements.",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    iconBg: "bg-emerald-100",
    accent: "text-emerald-600",
  },
  {
    icon: "🎯",
    title: "Sensory Profiles",
    desc: "Adapts visuals, audio, and interactions based on each learner's sensory preferences and needs.",
    bg: "bg-pink-50",
    border: "border-pink-100",
    iconBg: "bg-pink-100",
    accent: "text-pink-600",
  },
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Parents, teachers, and therapists get live dashboards showing progress, mastery, and growth over time.",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    iconBg: "bg-indigo-100",
    accent: "text-indigo-600",
  },
];

export function Features({ scrollY }: { scrollY: number }) {
  return (
    <section className="py-24 relative">
      <div
        className="max-w-6xl mx-auto px-6 md:px-8"
        style={{ transform: `translateY(${Math.max(0, scrollY - 300) * -0.03}px)` }}
      >
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
            Why AIVO
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Built different, on purpose
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            Every feature is designed around the learner — not a one-size-fits-all curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group ${f.bg} border ${f.border} rounded-3xl p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
            >
              <div
                className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900">
                {f.title}
              </h3>
              <p className="text-slate-600 leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
