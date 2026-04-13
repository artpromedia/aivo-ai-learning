"use client";

const TESTIMONIALS = [
  {
    quote: "My son went from refusing to touch a tablet to eagerly asking for 'brain time' every morning. AIVO understood his sensory needs from day one.",
    name: "Sarah M.",
    role: "Parent of Level 3 learner",
    avatar: "👩‍👦",
    color: "border-purple-200 bg-purple-50/50",
  },
  {
    quote: "As a special education teacher, I've never seen a platform that adapts this deeply. The brain clone gives me insights I couldn't get from any assessment alone.",
    name: "Dr. James K.",
    role: "Special Education Director",
    avatar: "👨‍🏫",
    color: "border-cyan-200 bg-cyan-50/50",
  },
  {
    quote: "We deployed AIVO across 12 schools in our district. The IEP integration alone saved our teachers 10+ hours per student per quarter.",
    name: "Maria L.",
    role: "District Administrator",
    avatar: "👩‍💼",
    color: "border-amber-200 bg-amber-50/50",
  },
  {
    quote: "My daughter has autism and communicates through AAC. AIVO's tutors work seamlessly with her device — she's learning math concepts we didn't think possible.",
    name: "David & Priya R.",
    role: "Parents of Level 4 learner",
    avatar: "👨‍👩‍👧",
    color: "border-emerald-200 bg-emerald-50/50",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-3">
            Loved by Families
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Real stories, real growth
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            Hear from parents, educators, and districts who trust AIVO.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className={`border ${t.color} rounded-3xl p-8 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 font-body leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-heading font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-400 font-body">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
