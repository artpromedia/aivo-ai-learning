"use client";
import { useState, FormEvent } from "react";
import { CompanyPageLayout } from "@/components/marketing/legal/CompanyPageLayout";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

const COMMS_URL = process.env.NEXT_PUBLIC_COMMS_URL || "";

const CONTACTS = [
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
];

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${COMMS_URL}/api/comms/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, source: "contact_page" }),
      });
      if (res.ok) {
        setSubmitted(true);
        trackEvent(AnalyticsEvents.CONTACT_SUBMIT, { type: "general" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send message. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Message Sent!</h3>
        <p className="text-slate-500 font-body">Thank you for reaching out. Our team will get back to you within 1-2 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-body"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-bold text-slate-700 mb-1.5">Email Address *</label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-body"
            placeholder="jane@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-bold text-slate-700 mb-1.5">Message *</label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-body resize-none"
          placeholder="How can we help you?"
        />
      </div>
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50 min-h-[44px]"
      >
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

function DemoRequestForm() {
  const [formData, setFormData] = useState({ name: "", email: "", company: "", role: "", schoolSize: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${COMMS_URL}/api/comms/public/demo-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
        trackEvent(AnalyticsEvents.DEMO_REQUEST, { company: formData.company, schoolSize: formData.schoolSize });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Demo Request Received!</h3>
        <p className="text-slate-500 font-body">Our education specialists will reach out within 24 hours to schedule your personalized demo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="demo-name" className="block text-sm font-bold text-slate-700 mb-1.5">Your Name *</label>
          <input id="demo-name" type="text" required value={formData.name} onChange={(e) => update("name", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body"
            placeholder="Dr. Sarah Johnson" />
        </div>
        <div>
          <label htmlFor="demo-email" className="block text-sm font-bold text-slate-700 mb-1.5">Work Email *</label>
          <input id="demo-email" type="email" required value={formData.email} onChange={(e) => update("email", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body"
            placeholder="sarah@schooldistrict.edu" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="demo-company" className="block text-sm font-bold text-slate-700 mb-1.5">School / Organization</label>
          <input id="demo-company" type="text" value={formData.company} onChange={(e) => update("company", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body"
            placeholder="Lincoln School District" />
        </div>
        <div>
          <label htmlFor="demo-role" className="block text-sm font-bold text-slate-700 mb-1.5">Your Role</label>
          <input id="demo-role" type="text" value={formData.role} onChange={(e) => update("role", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body"
            placeholder="Special Education Director" />
        </div>
      </div>
      <div>
        <label htmlFor="demo-size" className="block text-sm font-bold text-slate-700 mb-1.5">Number of Students</label>
        <select id="demo-size" value={formData.schoolSize} onChange={(e) => update("schoolSize", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body bg-white">
          <option value="">Select size...</option>
          <option value="1-50">1-50 students</option>
          <option value="51-200">51-200 students</option>
          <option value="201-500">201-500 students</option>
          <option value="501-2000">501-2,000 students</option>
          <option value="2000+">2,000+ students</option>
        </select>
      </div>
      <div>
        <label htmlFor="demo-message" className="block text-sm font-bold text-slate-700 mb-1.5">Anything else we should know?</label>
        <textarea id="demo-message" rows={3} value={formData.message} onChange={(e) => update("message", e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition font-body resize-none"
          placeholder="Tell us about your students' needs..." />
      </div>
      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
      <button type="submit" disabled={submitting}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 min-h-[44px]">
        {submitting ? "Submitting..." : "Request a Demo"}
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
      <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-12 mb-16 shadow-sm">
        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Send Us a Message</h2>
        <p className="text-slate-500 font-body mb-8">Have a question? We typically respond within 1-2 business days.</p>
        <ContactForm />
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 md:p-12 border border-purple-100 mb-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏫</span>
          <h2 className="text-2xl font-heading font-bold text-slate-900">Request a Demo</h2>
        </div>
        <p className="text-slate-600 font-body mb-8 max-w-2xl">
          See how AIVO can transform learning for your students. Our education specialists will walk you through the platform and answer all your questions.
        </p>
        <DemoRequestForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </CompanyPageLayout>
  );
}
