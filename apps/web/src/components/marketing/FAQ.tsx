"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "What age range is AIVO designed for?",
    a: "AIVO serves learners from pre-K through high school (ages 3-18). Our five functioning levels ensure that learners of all abilities — from gifted to pre-symbolic — get appropriately challenging content.",
  },
  {
    q: "How does the Brain Clone work?",
    a: "The Brain Clone is a personalized AI model that builds a detailed understanding of your child's learning patterns, strengths, and challenges. It adapts in real-time, adjusts across all 14 tutors simultaneously, and can be snapshotted or rolled back if needed.",
  },
  {
    q: "Is AIVO appropriate for children with special needs?",
    a: "Absolutely. AIVO was built from the ground up for inclusive education. We support AAC devices, switch access, eye-gaze technology, sensory profiles, and five functioning levels ranging from standard academics to pre-symbolic communication.",
  },
  {
    q: "Can therapists and teachers access my child's data?",
    a: "Yes, with your permission. Parents control who has access. Teachers, therapists, and caregivers can be invited to view progress, contribute to IEP goals, and collaborate on your child's learning team.",
  },
  {
    q: "What subjects does AIVO cover?",
    a: "AIVO covers 14 domains through specialized AI tutors: Mathematics, English Language Arts, Science, History, Coding, Speech & Communication, Social-Emotional Learning, Geography, Music, Physical Education, World Languages, STEM & Engineering, Life Skills, and Creative Arts.",
  },
  {
    q: "How does pricing work for schools and districts?",
    a: "We offer volume licensing for schools and districts with dedicated onboarding, admin dashboards, IEP integration, and professional development support. Contact our education team for a custom quote.",
  },
  {
    q: "Is my child's data safe?",
    a: "We take data privacy seriously. AIVO is COPPA and FERPA compliant, uses end-to-end encryption, and never sells or shares learner data. Parents have full control over data access and can request deletion at any time.",
  },
  {
    q: "Can I try AIVO before committing?",
    a: "Yes! Our Explorer plan is free forever with access to 2 tutors and 1 learner profile. Paid plans come with a 14-day free trial — no credit card required.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50/50 to-white" id="faq">
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">
            Questions & Answers
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-500 font-body">
            Everything you need to know about AIVO.
          </p>
        </div>

        <div className="space-y-3" role="list">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const triggerId = `faq-trigger-${i}`;
            return (
              <div
                key={i}
                role="listitem"
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-purple-200 shadow-md" : "border-slate-100 hover:border-slate-200"}`}
              >
                <button
                  id={triggerId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-heading font-bold text-slate-900 pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                  className={`overflow-hidden transition-all duration-300 motion-reduce:transition-none ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="px-6 pb-6 text-slate-500 font-body leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
