"use client";
import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "AI Tutors", href: "#tutors" },
    { label: "Brain Clone", href: "#brain" },
    { label: "Functioning Levels", href: "#levels" },
  ],
  Solutions: [
    { label: "For Families", href: "/signup" },
    { label: "For Schools", href: "/signup?type=school" },
    { label: "For Districts", href: "/signup?type=district" },
    { label: "Special Education", href: "#levels" },
    { label: "IEP Integration", href: "#features" },
  ],
  Company: [
    { label: "About AIVO", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "COPPA Compliance", href: "#" },
    { label: "FERPA Compliance", href: "#" },
    { label: "Accessibility", href: "#" },
  ],
};

export function Footer() {
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
              AI-powered adaptive learning for every child, every mind, every potential.
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

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-heading font-bold text-white mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition font-body"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-body">
            &copy; {new Date().getFullYear()} AIVO Learning Platform. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 font-body">
            Built with care for every learner.
          </p>
        </div>
      </div>
    </footer>
  );
}
