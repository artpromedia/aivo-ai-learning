"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const HERO_SLIDES = [
  {
    titleKey: "slide1_title" as const,
    subtitleKey: "slide1_subtitle" as const,
    badgeKey: "slide1_badge" as const,
    image: "/images/hero/arab-boy-chromebook.webp",
    features: ["feature_adapts", "feature_iep", "feature_coppa"] as const,
  },
  {
    titleKey: "slide2_title" as const,
    subtitleKey: "slide2_subtitle" as const,
    badgeKey: "slide2_badge" as const,
    image: "/images/hero/mother-son-sofa.webp",
    features: ["feature_brain_clone", "feature_5_levels", "feature_14_tutors"] as const,
  },
  {
    titleKey: "slide3_title" as const,
    subtitleKey: "slide3_subtitle" as const,
    badgeKey: "slide3_badge" as const,
    image: "/images/hero/arab-boy-chromebook.webp",
    features: ["feature_gamified", "feature_progress", "feature_safe"] as const,
  },
];

const TRUST_CITIES = ["Washington DC", "Chicago", "Minneapolis", "Dallas", "Atlanta", "Denver"];

export function Hero({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.hero");
  const [visible, setVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => setVisible(true), 100);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const runTransition = useCallback((nextIndex: number) => {
    if (!mountedRef.current) return;
    clearPendingTimeouts();
    setIsTransitioning(true);
    const t1 = setTimeout(() => {
      if (!mountedRef.current) return;
      setActiveSlide(nextIndex);
      const t2 = setTimeout(() => {
        if (!mountedRef.current) return;
        setIsTransitioning(false);
      }, 600);
      timeoutsRef.current.push(t2);
    }, 400);
    timeoutsRef.current.push(t1);
  }, [clearPendingTimeouts]);

  const activeSlideRef = useRef(0);
  useEffect(() => { activeSlideRef.current = activeSlide; }, [activeSlide]);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = (activeSlideRef.current + 1) % HERO_SLIDES.length;
      runTransition(next);
    }, 7000);
  }, [runTransition]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === activeSlide || isTransitioning) return;
      runTransition(index);
      startAutoplay();
    },
    [activeSlide, isTransitioning, runTransition, startAutoplay],
  );

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearPendingTimeouts();
    };
  }, [startAutoplay, clearPendingTimeouts]);

  const slide = HERO_SLIDES[activeSlide];

  const STATS = [
    { value: "14", label: t("stat_tutors"), icon: "👨‍🏫" },
    { value: "5", label: t("stat_levels"), icon: "🎮" },
    { value: "10", label: t("stat_languages"), icon: "🌍" },
    { value: "24/7", label: t("stat_adaptive"), icon: "🧠" },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === activeSlide ? 1 : 0 }}
          >
            <Image
              src={s.image}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/20" />
      </div>

      <div
        className="relative z-10 min-h-[92vh] flex items-center"
        style={{ transform: `translateY(${scrollY * -0.08}px)` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-24 w-full">
          <div
            className={`max-w-2xl transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md transition-all duration-500 ${isTransitioning ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-sm font-bold text-white/90 tracking-wide">
                  {t(slide.badgeKey)}
                </span>
              </div>
            </div>

            <div className="min-h-[180px] md:min-h-[200px] mb-6">
              <h1
                className={`text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white leading-[1.08] tracking-tight transition-all duration-600 ${isTransitioning ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0"}`}
              >
                {t(slide.titleKey)}
              </h1>
            </div>

            <p
              className={`text-lg md:text-xl text-white/70 max-w-xl leading-relaxed font-body mb-8 transition-all duration-500 delay-100 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
            >
              {t(slide.subtitleKey)}
            </p>

            <ul
              className={`space-y-3 mb-10 transition-all duration-500 delay-150 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
            >
              {slide.features.map((fKey) => (
                <li key={fKey} className="flex items-center gap-3 text-white/80 font-body">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {t(fKey)}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/signup"
                onClick={() => trackEvent(AnalyticsEvents.CTA_CLICK, { location: "hero", type: "trial" })}
                className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg hover:from-primary-dark hover:to-purple-700 transition-all shadow-2xl shadow-purple-900/40 hover:shadow-purple-800/50 hover:-translate-y-0.5 min-h-[44px]"
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
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 rounded-full border-2 border-white/25 text-white font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all hover:-translate-y-0.5 backdrop-blur-sm min-h-[44px]"
              >
                {t("cta_signin")}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === activeSlide ? "w-10 bg-white" : "w-3 bg-white/30 hover:bg-white/50"}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50 font-body">
              {t("trust_line")}
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {TRUST_CITIES.map((city) => (
                <span key={city} className="flex items-center gap-1.5 text-sm text-white/40 font-body">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
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
