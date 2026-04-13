"use client";
import { CompanyPageLayout } from "@/components/marketing/legal/CompanyPageLayout";

const CONTACTS = [
  {
    icon: "📧",
    title: "General Inquiries",
    description: "Questions about AIVO Learning? We'd love to hear from you.",
    email: "hello@aivo.education",
    color: "#7c3aed",
  },
  {
    icon: "🏫",
    title: "Schools & Districts",
    description: "Interested in AIVO for your school or district? Let's talk.",
    email: "sales@aivo.education",
    color: "#2563eb",
  },
  {
    icon: "🛡️",
    title: "Privacy & Compliance",
    description: "Questions about data privacy, COPPA, FERPA, or compliance.",
    email: "privacy@aivo.education",
    color: "#059669",
  },
  {
    icon: "🎯",
    title: "Customer Support",
    description: "Need help with your AIVO account or a technical issue?",
    email: "support@aivo.education",
    color: "#d97706",
  },
  {
    icon: "📰",
    title: "Press & Media",
    description: "Media inquiries, press releases, and partnership opportunities.",
    email: "press@aivo.education",
    color: "#ec4899",
  },
  {
    icon: "💼",
    title: "Careers",
    description: "Want to join the AIVO team? Send us your resume.",
    email: "careers@aivo.education",
    color: "#06b6d4",
  },
];

export default function ContactPage() {
  return (
    <CompanyPageLayout
      badge="Contact"
      title="Get in Touch"
      subtitle="We'd love to hear from you. Whether you're a parent, educator, or administrator, our team is here to help."
      icon="💬"
      accentColor="#2563eb"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {CONTACTS.map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${c.color}10` }}>
                {c.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-1">{c.title}</h3>
                <p className="text-sm text-slate-500 font-body mb-3">{c.description}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
                  style={{ color: c.color }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {c.email}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Request a Demo</h2>
        <p className="text-slate-600 font-body mb-8 max-w-2xl">
          See how AIVO can transform learning for your students. Our education specialists will walk you through the platform and answer all your questions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Schedule", desc: "Pick a time that works for your team" },
            { step: "2", title: "Demo", desc: "See AIVO in action with a personalized walkthrough" },
            { step: "3", title: "Launch", desc: "Get set up and start transforming learning" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">{s.step}</div>
              <div>
                <h4 className="font-heading font-bold text-slate-900">{s.title}</h4>
                <p className="text-sm text-slate-500 font-body">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="mailto:sales@aivo.education?subject=Demo Request"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule a Demo
          </a>
        </div>
      </div>
    </CompanyPageLayout>
  );
}
