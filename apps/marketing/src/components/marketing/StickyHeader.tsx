"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { trackCTAClick, trackSignupInitiation } from "@/lib/analytics";
import { WEB_APP_URL } from "@/lib/constants";

export function StickyHeader({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.header");
  const isScrolled = scrollY > 20;
  const [menuOpen, setMenuOpen] = useState(false);

  const linkColor = isScrolled
    ? "text-slate-600 hover:text-primary"
    : "text-white/80 hover:text-white";

  const signInClass = isScrolled
    ? "text-slate-700 hover:text-primary"
    : "text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm";

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
        <Link
          href="/"
          className={`flex items-center relative w-[140px] h-[52px] rounded-lg px-2 transition-colors duration-300 ${
            isScrolled ? "" : "bg-white/85 backdrop-blur-sm"
          }`}
        >
          <Image
            src="/images/aivo-logo-purple.png"
            alt="AIVO Learning"
            fill
            priority
            sizes="140px"
            className="object-contain p-1"
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
          <a
            href={`${WEB_APP_URL}/login`}
            className={`px-5 py-2 rounded-lg font-semibold transition hidden sm:inline-flex min-h-[44px] items-center ${signInClass}`}
          >
            {t("sign_in")}
          </a>
          <a
            href={`${WEB_APP_URL}/signup?plan=free`}
            onClick={() => {
              trackCTAClick("header_get_started", `${WEB_APP_URL}/signup?plan=free`);
              trackSignupInitiation("header");
            }}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200/50 min-h-[44px] hidden sm:inline-flex items-center"
          >
            {t("get_started")}
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className={`w-6 h-6 ${isScrolled ? "text-slate-800" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className={`w-6 h-6 ${isScrolled ? "text-slate-800" : "text-white"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            <a href="#features" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition min-h-[44px] flex items-center">{t("features")}</a>
            <a href="#tutors" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition min-h-[44px] flex items-center">{t("tutors")}</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition min-h-[44px] flex items-center">{t("pricing")}</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition min-h-[44px] flex items-center">{t("faq")}</a>
            <hr className="my-2 border-slate-100" />
            <a href={`${WEB_APP_URL}/login`} onClick={() => setMenuOpen(false)} className="px-4 py-3 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition min-h-[44px] flex items-center">{t("sign_in")}</a>
            <a
              href={`${WEB_APP_URL}/signup?plan=free`}
              onClick={() => {
                setMenuOpen(false);
                trackCTAClick("mobile_menu_get_started", `${WEB_APP_URL}/signup?plan=free`);
                trackSignupInitiation("mobile_menu");
              }}
              className="px-4 py-3 bg-primary text-white font-bold rounded-full text-center hover:bg-primary-dark transition min-h-[44px] flex items-center justify-center mt-2"
            >
              {t("get_started")}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
