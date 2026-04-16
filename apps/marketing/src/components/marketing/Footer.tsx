"use client";
import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const COMMS_URL = process.env.NEXT_PUBLIC_COMMS_URL || "";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${COMMS_URL}/api/comms/public/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (res.ok) {
        setSubmitted(true);
        trackEvent(AnalyticsEvents.NEWSLETTER_SIGNUP, { source: "footer" });
      } else {
        setError("Failed to subscribe. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-emerald-400 font-semibold">
        You&apos;re subscribed! We&apos;ll keep you updated.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email for newsletter"
        className="flex-1 px-4 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-white text-sm font-body placeholder:text-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition min-w-0"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-dark transition disabled:opacity-50 flex-shrink-0 min-h-[44px]"
      >
        {submitting ? "..." : "Subscribe"}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
}

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
        { labelKey: "for_schools" as const, href: "/contact" },
        { labelKey: "for_districts" as const, href: "/contact" },
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

        <div className="border-t border-slate-800 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="text-sm font-heading font-bold text-white mb-1">Stay in the loop</h4>
              <p className="text-xs text-slate-400 font-body mb-3 md:mb-0">Get product updates, education insights, and tips for parents.</p>
            </div>
            <div className="w-full md:w-auto md:min-w-[320px]">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
