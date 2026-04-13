"use client";

const LEVELS = [
  {
    level: 1,
    name: "Standard",
    desc: "Grade-level academics with adaptive pacing and enrichment opportunities.",
    icon: "📖",
    color: "#7C3AED",
    bg: "from-violet-500 to-purple-600",
    features: ["Grade-aligned curriculum", "Enrichment challenges", "Standard assessments"],
  },
  {
    level: 2,
    name: "Supported",
    desc: "Modified curriculum with additional scaffolding and visual supports.",
    icon: "🤝",
    color: "#06B6D4",
    bg: "from-cyan-500 to-teal-600",
    features: ["Visual scaffolding", "Extended time", "Simplified instructions"],
  },
  {
    level: 3,
    name: "Guided",
    desc: "Structured learning with step-by-step guidance and sensory accommodations.",
    icon: "🧩",
    color: "#F59E0B",
    bg: "from-amber-400 to-orange-500",
    features: ["Step-by-step guidance", "Sensory accommodations", "AAC integration"],
  },
  {
    level: 4,
    name: "Exploratory",
    desc: "Cause-and-effect learning with high-contrast visuals and switch access.",
    icon: "🎨",
    color: "#10B981",
    bg: "from-emerald-500 to-green-600",
    features: ["Cause-and-effect focus", "Switch access support", "High-contrast visuals"],
  },
  {
    level: 5,
    name: "Pre-Symbolic",
    desc: "Sensory engagement and early communication through guided interaction.",
    icon: "✨",
    color: "#EC4899",
    bg: "from-pink-500 to-rose-600",
    features: ["Sensory stimulation", "Partner-assisted", "Eye-gaze compatible"],
  },
];

export function FunctioningLevels() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
            Inclusive by Design
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Five levels, one platform
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            AIVO serves learners across the full spectrum — from advanced academics to pre-symbolic exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {LEVELS.map((lvl) => (
            <div
              key={lvl.level}
              className="group relative bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${lvl.bg} opacity-60 group-hover:opacity-100 transition-opacity`}
              />
              <div className="text-center mb-4">
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${lvl.bg} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {lvl.icon}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: lvl.color }}>
                  Level {lvl.level}
                </p>
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">
                  {lvl.name}
                </h3>
                <p className="text-sm text-slate-500 font-body mb-4 leading-relaxed">
                  {lvl.desc}
                </p>
                <ul className="space-y-1.5">
                  {lvl.features.map((f) => (
                    <li key={f} className="text-xs text-slate-400 font-body flex items-center gap-1.5 justify-center">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: lvl.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
