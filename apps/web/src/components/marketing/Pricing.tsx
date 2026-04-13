"use client";
import Link from "next/link";

const PLANS = [
  {
    name: "Explorer",
    price: "Free",
    period: "",
    desc: "Try AIVO with limited access — perfect for exploring.",
    features: [
      "1 learner profile",
      "2 AI tutors (Nova + Sage)",
      "Basic brain clone",
      "Community support",
    ],
    cta: "Start Free",
    href: "/signup",
    popular: false,
    bg: "bg-white",
    border: "border-slate-200",
    ctaBg: "bg-slate-900 hover:bg-slate-800",
  },
  {
    name: "Family",
    price: "$29",
    period: "/month",
    desc: "Full access for your family — all tutors, all levels.",
    features: [
      "Up to 5 learner profiles",
      "All 14 AI tutors",
      "Full brain clone with snapshots",
      "Sensory profiles",
      "Parent dashboard & analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=family",
    popular: true,
    bg: "bg-gradient-to-b from-purple-50 to-white",
    border: "border-purple-200",
    ctaBg: "bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700",
  },
  {
    name: "Family Pro",
    price: "$49",
    period: "/month",
    desc: "Everything in Family, plus IEP tools and team collaboration.",
    features: [
      "Everything in Family",
      "IEP goal tracking",
      "Therapist & teacher access",
      "Advanced analytics",
      "Data export & reporting",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    popular: false,
    bg: "bg-white",
    border: "border-slate-200",
    ctaBg: "bg-slate-900 hover:bg-slate-800",
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50/50" id="pricing">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
            Simple Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Plans for every family
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            Start free, upgrade when you&apos;re ready. No contracts, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative ${plan.bg} border ${plan.border} rounded-3xl p-8 ${plan.popular ? "shadow-xl shadow-purple-200/50 scale-[1.02] md:scale-105" : "hover:shadow-lg"} transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-bold shadow-lg">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-heading font-bold text-slate-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-slate-400 font-body">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-body mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 font-body">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-3.5 rounded-full ${plan.ctaBg} text-white font-bold text-center transition shadow-lg`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-primary rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 mb-6">
              <span className="text-lg">🏫</span>
              <span className="text-sm font-bold text-white/90">For Schools & Districts</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
              AIVO for Education
            </h3>
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-body mb-8">
              Bring AIVO to your entire school or district. Volume pricing, admin dashboards, IEP integration, and dedicated onboarding support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup?type=district"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-primary font-bold text-lg hover:bg-slate-50 transition shadow-lg"
              >
                Request a Demo
              </Link>
              <Link
                href="/signup?type=school"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
