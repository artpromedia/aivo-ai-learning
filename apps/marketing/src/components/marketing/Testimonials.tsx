"use client";
import { useTranslations } from "next-intl";

const TESTIMONIALS = [
  { quoteKey: "t1_quote", nameKey: "t1_name", roleKey: "t1_role", avatar: "👩‍👦", color: "border-purple-200 bg-purple-50/50" },
  { quoteKey: "t2_quote", nameKey: "t2_name", roleKey: "t2_role", avatar: "👨‍🏫", color: "border-cyan-200 bg-cyan-50/50" },
  { quoteKey: "t3_quote", nameKey: "t3_name", roleKey: "t3_role", avatar: "👩‍💼", color: "border-amber-200 bg-amber-50/50" },
  { quoteKey: "t4_quote", nameKey: "t4_name", roleKey: "t4_role", avatar: "👨‍👩‍👧", color: "border-emerald-200 bg-emerald-50/50" },
] as const;

export function Testimonials() {
  const t = useTranslations("marketing.testimonials");

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-3">
            {t("label")}
          </p>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-body">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.nameKey}
              className={`border ${item.color} rounded-3xl p-8 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 font-body leading-relaxed mb-6 italic">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-heading font-bold text-slate-900">{t(item.nameKey)}</p>
                  <p className="text-sm text-slate-400 font-body">{t(item.roleKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
