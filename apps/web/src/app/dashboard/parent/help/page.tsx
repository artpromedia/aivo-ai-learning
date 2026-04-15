"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

const FAQ_ITEMS = [
  {
    q: "How does the brain profile work?",
    a: "AIVO builds a unique AI brain profile for each child based on their assessment results, learning patterns, and parent-provided information. This profile helps our AI tutors adapt their teaching style to your child's specific needs.",
  },
  {
    q: "What is a functioning level?",
    a: "A functioning level describes how your child communicates and processes information. Levels range from Standard to Pre-Symbolic. This helps AIVO choose the right approach — for example, more visual supports for children who benefit from picture-based learning.",
  },
  {
    q: "How do I prepare for my IEP meeting with AIVO data?",
    a: "Go to your child's IEP Goals page and download the Progress Report. It includes mastery data, session history, and accommodation details that you can share with your school team.",
  },
  {
    q: "Can my child's teacher see their data?",
    a: "Only if you invite them to your child's Learning Team. You control who has access. Go to your child's Team page to manage access.",
  },
  {
    q: "How do I add another child?",
    a: "From the home dashboard, click '+ Add a Child' and follow the guided setup. Each child gets their own personalized profile.",
  },
  {
    q: "What does COPPA consent mean?",
    a: "COPPA (Children's Online Privacy Protection Act) requires us to get your consent before collecting information about your child. We take your child's privacy seriously and never share data without your permission.",
  },
  {
    q: "Is my child's data safe?",
    a: "Yes. We use industry-standard encryption and security practices. You can export or delete your child's data at any time from their settings page.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Billing in the main menu. You can manage your subscription, change plans, or cancel from there.",
  },
];

export default function HelpPage() {
  const t = useTranslations("parent");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery
    ? FAQ_ITEMS.filter(item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : FAQ_ITEMS;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">Help Center</h1>
      <p className="text-slate-500 mb-6">Find answers to common questions about AIVO.</p>

      <div className="mb-6">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm" />
      </div>

      <div className="space-y-3 mb-8">
        {filtered.map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-3" style={{ minHeight: 48 }}>
              <span className="text-sm font-semibold text-slate-800">{item.q}</span>
              <span className={`text-slate-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`}>▾</span>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="font-semibold">No results found.</p>
            <p className="text-sm mt-1">Try different keywords or contact support below.</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-2xl p-6 border border-purple-100">
        <h2 className="text-lg font-heading font-bold text-slate-900 mb-2">Need more help?</h2>
        <p className="text-sm text-slate-600 mb-4">Our support team is here for you. We typically respond within 24 hours.</p>
        <a href="mailto:support@aivo.learning" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition" style={{ minHeight: 44 }}>
          📧 Contact Support
        </a>
      </div>
    </div>
  );
}
