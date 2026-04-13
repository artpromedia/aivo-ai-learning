"use client";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("marketing.footer");

  const FOOTER_SECTIONS = [
    {
      titleKey: "platform" as const,
      links: [
        { labelKey: "features" as const, href: "#features" },
        { labelKey: "pricing" as const, href: "#pricing" },
        { labelKey: "ai_tutors" as const, href: "#tutors" },
        { labelKey: "brain_clone" as const, href: "#brain" },
        { labelKey: "functioning_levels" as const, href: "#levels" },
      ],
    },
    {
      titleKey: "solutions" as const,
      links: [
        { labelKey: "for_families" as const, href: "/signup" },
        { labelKey: "for_schools" as const, href: "/signup?type=school" },
        { labelKey: "for_districts" as const, href: "/signup?type=district" },
        { labelKey: "special_education" as const, href: "#levels" },
        { labelKey: "iep_integration" as const, href: "#features" },
      ],
    },
    {
      titleKey: "company" as const,
      links: [
        { labelKey: "about_aivo" as const, href: "/about" },
        { labelKey: "blog" as const, href: "/blog" },
        { labelKey: "careers" as const, href: "/careers" },
        { labelKey: "contact" as const, href: "/contact" },
        { labelKey: "press_kit" as const, href: "/press-kit" },
      ],
    },
    {
      titleKey: "legal" as const,
      links: [
        { labelKey: "privacy_policy" as const, href: "/privacy-policy" },
        { labelKey: "terms_of_service" as const, href: "/terms-of-service" },
        { labelKey: "coppa_compliance" as const, href: "/coppa-compliance" },
        { labelKey: "ferpa_compliance" as const, href: "/ferpa-compliance" },
        { labelKey: "accessibility" as const, href: "/accessibility" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/aivo-logo-white.png"
              alt="AIVO"
              width={120}
              height={36}
              className="mb-4"
              style={{ width: "auto", height: "auto" }}
            />
            <p className="text-sm text-slate-400 font-body leading-relaxed mb-4">
              {t("tagline")}
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                COPPA
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                FERPA
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                SOC 2
              </span>
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.titleKey}>
              <h4 className="text-sm font-heading font-bold text-white mb-4">{t(section.titleKey)}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition font-body"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-body">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-slate-600 font-body">
            {t("built_with_care")}
          </p>
        </div>
      </div>
    </footer>
  );
}
