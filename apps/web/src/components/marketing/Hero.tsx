"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

const HERO_SLIDES = [
  {
    titleKey: "slide1_title" as const,
    subtitleKey: "slide1_subtitle" as const,
    badgeKey: "slide1_badge" as const,
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    accentGradient: "from-primary via-purple-500 to-secondary",
    image: "/images/tutors/nova.png",
    features: ["feature_adapts", "feature_iep", "feature_coppa"] as const,
  },
  {
    titleKey: "slide2_title" as const,
    subtitleKey: "slide2_subtitle" as const,
    badgeKey: "slide2_badge" as const,
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    accentGradient: "from-emerald-400 via-teal-400 to-cyan-400",
    image: "/images/tutors/sage.png",
    features: ["feature_brain_clone", "feature_5_levels", "feature_14_tutors"] as const,
  },
  {
    titleKey: "slide3_title" as const,
    subtitleKey: "slide3_subtitle" as const,
    badgeKey: "slide3_badge" as const,
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    accentGradient: "from-amber-400 via-orange-400 to-rose-400",
    image: "/images/tutors/spark.png",
    features: ["feature_gamified", "feature_progress", "feature_safe"] as const,
  },
];

export function Hero({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.hero");
  const [visible, setVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === activeSlide || isTransitioning) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide(index);
        setTimeout(() => setIsTransitioning(false), 600);
      }, 300);
    },
    [activeSlide, isTransitioning],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        setTimeout(() => setIsTransitioning(false), 600);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  const STATS = [
    { value: "14", label: t("stat_tutors") },
    { value: "5", label: t("stat_levels") },
    { value: "10", label: t("stat_languages") },
    { value: "24/7", label: t("stat_adaptive") },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none motion-reduce:hidden">
        <div
          className="absolute -top-32 -left-48 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl transition-colors duration-1000"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute -top-20 -right-40 w-[400px] h-[400px] bg-cyan-200/30 rounded-full blur-3xl transition-colors duration-1000"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute top-60 left-1/3 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["🎮", "🧠", "🌟", "📚", "🎨", "🔬", "🎵", "🌍"].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl opacity-[0.06] select-none"
            style={{
              left: `${10 + ((i * 12) % 80)}%`,
              top: `${15 + ((i * 17) % 70)}%`,
              transform: `translateY(${scrollY * (0.03 + i * 0.01)}px) rotate(${i * 25}deg)`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 py-20 relative z-10 w-full">
        <div
          className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transform: `translateY(${scrollY * -0.12}px)` }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div
                className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-purple-50/80 border border-purple-100 backdrop-blur-sm transition-all duration-500 ${isTransitioning ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="text-sm font-bold text-primary tracking-wide">
                  {t(slide.badgeKey)}
                </span>
              </div>

              <div className="min-h-[140px] md:min-h-[160px]">
                <h1
                  className={`text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-slate-900 leading-[1.1] tracking-tight transition-all duration-500 ${isTransitioning ? "opacity-0 -translate-x-8" : "opacity-100 translate-x-0"}`}
                >
                  {t(slide.titleKey)}
                </h1>
              </div>

              <p
                className={`text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed font-body transition-all duration-500 delay-100 ${isTransitioning ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}
              >
                {t(slide.subtitleKey)}
              </p>

              <ul
                className={`space-y-3 transition-all duration-500 delay-150 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
              >
                {slide.features.map((fKey) => (
                  <li key={fKey} className="flex items-center gap-3 text-slate-600 font-body">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {t(fKey)}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg hover:from-primary-dark hover:to-purple-700 transition-all shadow-xl shadow-purple-300/40 hover:shadow-purple-400/50 hover:-translate-y-0.5"
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
                  className="inline-flex items-center justify-center px-10 py-4 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-primary hover:text-primary transition-all hover:-translate-y-0.5"
                >
                  {t("cta_signin")}
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${slide.gradient} opacity-10 blur-2xl transition-all duration-1000`}
              />
              <div
                className={`relative w-[340px] h-[420px] transition-all duration-700 ${isTransitioning ? "opacity-0 scale-90 rotate-3" : "opacity-100 scale-100 rotate-0"}`}
              >
                <Image
                  src={slide.image}
                  alt="AI Tutor"
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="340px"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-slate-100">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-500 ${i === activeSlide ? "w-8 bg-primary" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-2 mt-8">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-500 ${i === activeSlide ? "w-8 bg-primary" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto pt-12 lg:pt-16">
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
