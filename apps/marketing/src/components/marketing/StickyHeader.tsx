"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

export function StickyHeader({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.header");
  const isScrolled = scrollY > 20;
  const [menuOpen, setMenuOpen] = useState(false);

  const linkColor = isScrolled
    ? "text-slate-600 hover:text-primary"
    : "text-white/80 hover:text-white";

  const NAV_LINKS = [
    { labelKey: "features" as const, href: "#features" },
    { labelKey: "tutors" as const, href: "#tutors" },
    { labelKey: "pricing" as const, href: "#pricing" },
    { labelKey: "faq" as const, href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center relative w-[130px] h-[52px]">
          <Image
            src="/images/aivo-logo-purple.png"
            alt="AIVO"
            fill
            priority
            className={`object-contain transition-opacity duration-300 ${isScrolled ? "opacity-100" : "opacity-0"}`}
          />
          <Image
            src="/images/aivo-logo-white.png"
            alt="AIVO"
            fill
            className={`object-contain transition-opacity duration-300 ${isScrolled ? "opacity-0" : "opacity-100"}`}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a key={link.labelKey} href={link.href} className={`text-sm font-semibold transition ${linkColor}`}>
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className={`px-5 py-2 rounded-lg font-semibold transition hidden sm:inline-flex min-h-[44px] items-center ${linkColor}`}
          >
            {t("sign_in")}
          </Link>
          <Link
            href="/signup"
            onClick={() => trackEvent(AnalyticsEvents.SIGNUP_INITIATE, { source: "header" })}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200/50 hidden sm:inline-flex min-h-[44px] items-center"
          >
            {t("get_started")}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <svg className={`w-6 h-6 transition ${isScrolled ? "text-slate-700" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.labelKey}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 transition min-h-[44px] flex items-center"
              >
                {t(link.labelKey)}
              </a>
            ))}
            <hr className="my-2 border-slate-100" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 transition min-h-[44px] flex items-center"
            >
              {t("sign_in")}
            </Link>
            <Link
              href="/signup"
              onClick={() => { setMenuOpen(false); trackEvent(AnalyticsEvents.SIGNUP_INITIATE, { source: "mobile_menu" }); }}
              className="mt-2 py-3 px-4 rounded-full bg-primary text-white font-bold text-center hover:bg-primary-dark transition min-h-[44px] flex items-center justify-center"
            >
              {t("get_started")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
