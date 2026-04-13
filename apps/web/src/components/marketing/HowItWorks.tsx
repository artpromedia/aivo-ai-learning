"use client";

const STEPS = [
  {
    num: "01",
    icon: "📋",
    title: "Parent Assessment",
    desc: "Parents complete a quick questionnaire about their child's needs, communication style, and learning preferences.",
    color: "from-purple-500 to-violet-600",
    glow: "shadow-purple-200",
  },
  {
    num: "02",
    icon: "🧭",
    title: "Baseline Discovery",
    desc: "Your child plays through a fun interactive assessment — no pressure, just discovery — to establish their starting point.",
    color: "from-cyan-500 to-teal-600",
    glow: "shadow-cyan-200",
  },
  {
    num: "03",
    icon: "🧠",
    title: "Brain Clone Created",
    desc: "AIVO builds a personalized learning brain that understands your child's strengths, challenges, and preferred ways to learn.",
    color: "from-amber-400 to-orange-500",
    glow: "shadow-amber-200",
  },
  {
    num: "04",
    icon: "🚀",
    title: "Adaptive Learning Begins",
    desc: "14 AI tutors deliver personalized lessons that adapt in real-time — getting smarter with every interaction.",
    color: "from-emerald-500 to-green-600",
    glow: "shadow-emerald-200",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50/50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">
            Getting Started
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Four steps to personalized learning
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            From signup to adaptive curriculum in minutes — not months.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative group">
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-slate-200 to-slate-100" />
              )}
              <div className="relative bg-white rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mb-6 shadow-lg ${step.glow} group-hover:scale-110 transition-transform`}
                >
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-2">
                  Step {step.num}
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-body text-sm">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
