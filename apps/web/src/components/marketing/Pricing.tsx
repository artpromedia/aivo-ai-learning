"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";

const CHECK_ICON = (
  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CHECK_WHITE = (
  <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function Pricing() {
  const t = useTranslations("marketing.pricing");

  const PLANS = [
    {
      nameKey: "free_name" as const, priceKey: "free_price" as const, period: "", perLearner: false,
      descKey: "free_desc" as const, featureKeys: ["free_f1", "free_f2", "free_f3", "free_f4"] as const,
      ctaKey: "free_cta" as const, href: "/signup", popular: false,
      bg: "bg-white", border: "border-slate-200", ctaBg: "bg-slate-900 hover:bg-slate-800",
    },
    {
      nameKey: "single_name" as const, price: "$24.99", period: "/mo", perLearner: true,
      descKey: "single_desc" as const, featureKeys: ["single_f1", "single_f2", "single_f3", "single_f4", "single_f5", "single_f6"] as const,
      ctaKey: "single_cta" as const, href: "/signup?plan=single", popular: false,
      bg: "bg-white", border: "border-slate-200", ctaBg: "bg-slate-900 hover:bg-slate-800",
    },
    {
      nameKey: "family_name" as const, price: "$19.99", period: "/mo", perLearner: true,
      descKey: "family_desc" as const, featureKeys: ["family_f1", "family_f2", "family_f3", "family_f4", "family_f5", "family_f6", "family_f7"] as const,
      ctaKey: "family_cta" as const, href: "/signup?plan=family", popular: true,
      bg: "bg-gradient-to-b from-purple-50 to-white", border: "border-purple-200",
      ctaBg: "bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700",
    },
  ];

  const DISTRICT_FEATURES = [
    "district_f1", "district_f2", "district_f3", "district_f4",
    "district_f5", "district_f6", "district_f7", "district_f8",
  ] as const;

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50/50" id="pricing">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {PLANS.map((plan) => (
            <div
              key={plan.nameKey}
              className={`relative ${plan.bg} border ${plan.border} rounded-3xl p-8 ${plan.popular ? "shadow-xl shadow-purple-200/50 scale-[1.02] md:scale-105" : "hover:shadow-lg"} transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold shadow-lg">
                  {t("best_value")}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
                  {t(plan.nameKey)}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading font-bold text-slate-900">
                    {"priceKey" in plan ? t(plan.priceKey as "free_price") : plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-400 font-body">{plan.period}</span>
                  )}
                </div>
                {plan.perLearner && (
                  <p className="text-xs text-primary font-semibold mt-1">{t("per_learner")}</p>
                )}
                <p className="text-sm text-slate-500 font-body mt-2">{t(plan.descKey)}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.featureKeys.map((fk) => (
                  <li key={fk} className="flex items-start gap-2.5 text-sm text-slate-600 font-body">
                    {CHECK_ICON}
                    {t(fk)}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-3.5 rounded-full ${plan.ctaBg} text-white font-bold text-center transition shadow-lg`}
              >
                {t(plan.ctaKey)}
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-body">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            {t("addon_note")}
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-primary rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 mb-6">
              <span className="text-lg">🏫</span>
              <span className="text-sm font-bold text-white/90">{t("district_badge")}</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              {t("district_title")}
            </h3>
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-body mb-4">
              {t("district_desc")}
            </p>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/90 font-body mb-8">
              {DISTRICT_FEATURES.map((fk) => (
                <li key={fk} className="flex items-center gap-1.5">
                  {CHECK_WHITE}
                  {t(fk)}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup?type=district"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-primary font-bold text-lg hover:bg-slate-50 transition shadow-lg"
              >
                {t("district_demo")}
              </Link>
              <Link
                href="/signup?type=school"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition"
              >
                {t("district_sales")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
