"use client";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";

export function StickyHeader({ scrollY }: { scrollY: number }) {
  const t = useTranslations("marketing.header");
  const isScrolled = scrollY > 20;

  const linkColor = isScrolled
    ? "text-slate-600 hover:text-primary"
    : "text-white/80 hover:text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center relative">
          <Image
            src="/images/aivo-logo-purple.png"
            alt="AIVO"
            width={130}
            height={40}
            priority
            className={`transition-opacity duration-300 ${isScrolled ? "opacity-100" : "opacity-0"}`}
            style={{ width: "auto", height: "auto" }}
          />
          <Image
            src="/images/aivo-logo-white.png"
            alt="AIVO"
            width={130}
            height={40}
            className={`absolute inset-0 transition-opacity duration-300 ${isScrolled ? "opacity-0" : "opacity-100"}`}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className={`text-sm font-semibold transition ${linkColor}`}>{t("features")}</a>
          <a href="#tutors" className={`text-sm font-semibold transition ${linkColor}`}>{t("tutors")}</a>
          <a href="#pricing" className={`text-sm font-semibold transition ${linkColor}`}>{t("pricing")}</a>
          <a href="#faq" className={`text-sm font-semibold transition ${linkColor}`}>{t("faq")}</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className={`px-5 py-2 rounded-lg font-semibold transition hidden sm:inline-flex ${linkColor}`}
          >
            {t("sign_in")}
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200/50"
          >
            {t("get_started")}
          </Link>
        </div>
      </div>
    </header>
  );
}
