"use client";
import { useTranslations } from "next-intl";

export function Features({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.features");

  const FEATURES = [
    { icon: "🎮", titleKey: "levels_title" as const, descKey: "levels_desc" as const, bg: "bg-purple-50", border: "border-purple-100", iconBg: "bg-purple-100" },
    { icon: "🤖", titleKey: "tutors_title" as const, descKey: "tutors_desc" as const, bg: "bg-cyan-50", border: "border-cyan-100", iconBg: "bg-cyan-100" },
    { icon: "🧠", titleKey: "brain_title" as const, descKey: "brain_desc" as const, bg: "bg-amber-50", border: "border-amber-100", iconBg: "bg-amber-100" },
    { icon: "🌍", titleKey: "region_title" as const, descKey: "region_desc" as const, bg: "bg-emerald-50", border: "border-emerald-100", iconBg: "bg-emerald-100" },
    { icon: "🎯", titleKey: "sensory_title" as const, descKey: "sensory_desc" as const, bg: "bg-pink-50", border: "border-pink-100", iconBg: "bg-pink-100" },
    { icon: "📊", titleKey: "analytics_title" as const, descKey: "analytics_desc" as const, bg: "bg-indigo-50", border: "border-indigo-100", iconBg: "bg-indigo-100" },
  ];

  return (
    <section className="py-24 relative">
      <div
        className="max-w-6xl mx-auto px-6 md:px-8"
        style={{ transform: `translateY(${Math.max(0, scrollY - 300) * -0.03}px)` }}
      >
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.titleKey}
              className={`group ${f.bg} border ${f.border} rounded-3xl p-8 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
            >
              <div
                className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900">
                {t(f.titleKey)}
              </h3>
              <p className="text-slate-600 leading-relaxed font-body">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
