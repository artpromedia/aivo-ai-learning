"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

export function CTASection() {
  const t = useTranslations("marketing.cta");

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-indigo-700" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 text-center relative z-10">
        <div className="text-6xl mb-6">🚀</div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
          {t("title_line1")}
          <br />
          {t("title_line2")}
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto font-body mb-10">
          {t("subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            onClick={() => trackEvent(AnalyticsEvents.CTA_CLICK, { location: "cta_section", type: "trial" })}
            className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-white text-primary font-bold text-lg hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-0.5 min-h-[44px]"
          >
            {t("cta_trial")}
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
            href="/contact"
            onClick={() => trackEvent(AnalyticsEvents.CTA_CLICK, { location: "cta_section", type: "demo" })}
            className="inline-flex items-center justify-center px-10 py-4 rounded-full border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all hover:-translate-y-0.5 min-h-[44px]"
          >
            {t("cta_pricing")}
          </Link>
        </div>
      </div>
    </section>
  );
}
