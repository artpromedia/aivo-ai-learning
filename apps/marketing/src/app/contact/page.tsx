"use client";
import { useState } from "react";
import { CompanyPageLayout } from "@/components/marketing/legal/CompanyPageLayout";
import { trackFormSubmission } from "@/lib/analytics";

const CONTACTS = [
  {
    icon: "📧",
    title: "General Inquiries",
    description: "Questions about AIVO Learning? We'd love to hear from you.",
    email: "hello@aivolearning.com",
    color: "#7c3aed",
  },
  {
    icon: "🛡️",
    title: "Privacy & Compliance",
    description: "Questions about data privacy, COPPA, FERPA, or compliance.",
    email: "privacy@aivolearning.com",
    color: "#059669",
  },
  {
    icon: "🎯",
    title: "Customer Support",
    description: "Need help with your AIVO account or a technical issue?",
    email: "support@aivolearning.com",
    color: "#d97706",
  },
  {
    icon: "📰",
    title: "Press & Media",
    description: "Media inquiries, press releases, and partnership opportunities.",
    email: "press@aivolearning.com",
    color: "#ec4899",
  },
];

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...form }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      trackFormSubmission("contact_form");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Message Sent!</h3>
        <p className="text-slate-600 font-body">Thank you for reaching out. Our team will get back to you within 1-2 business days.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 px-6 py-2 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
          <input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-bold text-slate-700 mb-1.5">Email Address *</label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-bold text-slate-700 mb-1.5">Message *</label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800 resize-none"
          placeholder="How can we help you?"
        />
      </div>
      {status === "error" && (
        <p className="text-red-600 text-sm font-body">Something went wrong. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-60 min-h-[44px]"
      >
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

function DemoForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", schoolSize: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "demo", ...form }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      trackFormSubmission("demo_request");
      setForm({ name: "", email: "", company: "", role: "", schoolSize: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Demo Request Received!</h3>
        <p className="text-slate-600 font-body">Our education specialists will reach out within 24 hours to schedule your personalized demo.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 px-6 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="demo-name" className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
          <input
            id="demo-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="demo-email" className="block text-sm font-bold text-slate-700 mb-1.5">Work Email *</label>
          <input
            id="demo-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
            placeholder="you@school.edu"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="demo-company" className="block text-sm font-bold text-slate-700 mb-1.5">School / District Name *</label>
          <input
            id="demo-company"
            type="text"
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
            placeholder="School or district name"
          />
        </div>
        <div>
          <label htmlFor="demo-role" className="block text-sm font-bold text-slate-700 mb-1.5">Your Role *</label>
          <select
            id="demo-role"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
          >
            <option value="">Select your role</option>
            <option value="superintendent">Superintendent</option>
            <option value="district-admin">District Administrator</option>
            <option value="principal">Principal</option>
            <option value="special-ed-director">Special Education Director</option>
            <option value="teacher">Teacher</option>
            <option value="curriculum-coordinator">Curriculum Coordinator</option>
            <option value="it-director">IT Director</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="demo-size" className="block text-sm font-bold text-slate-700 mb-1.5">School / District Size *</label>
        <select
          id="demo-size"
          required
          value={form.schoolSize}
          onChange={(e) => setForm({ ...form, schoolSize: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition font-body text-slate-800"
        >
          <option value="">Select size</option>
          <option value="1-100">1–100 students</option>
          <option value="101-500">101–500 students</option>
          <option value="501-2000">501–2,000 students</option>
          <option value="2001-10000">2,001–10,000 students</option>
          <option value="10001+">10,001+ students</option>
        </select>
      </div>
      {status === "error" && (
        <p className="text-red-600 text-sm font-body">Something went wrong. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-60 min-h-[44px]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {status === "submitting" ? "Submitting..." : "Request a Demo"}
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <CompanyPageLayout
      badge="Contact"
      title="Get in Touch"
      subtitle="We'd love to hear from you. Whether you're a parent, educator, or administrator, our team is here to help."
      icon="💬"
      accentColor="#2563eb"
    >
      <section className="mb-16">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Send Us a Message</h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
          <ContactForm />
        </div>
      </section>

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
                  className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80 min-h-[44px]"
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

      <div id="demo" className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Request a Demo</h2>
        <p className="text-slate-600 font-body mb-8 max-w-2xl">
          See how AIVO can transform learning for your students. Fill out the form below, and our education specialists will walk you through the platform and answer all your questions.
        </p>
        <DemoForm />
      </div>
    </CompanyPageLayout>
  );
}
