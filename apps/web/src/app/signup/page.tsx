"use client";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SkipLink } from "@/components/a11y/SkipLink";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, "PARENT");
      router.push("/");
    } catch (err: any) {
      setError(err.message || t("register_failed"));
    }
    setLoading(false);
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: t("signup_feature_brain_clone"),
      desc: "Builds a unique AI model of how your child learns",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: t("signup_feature_tutors"),
      desc: "Each with specialized teaching personalities",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: t("signup_feature_levels"),
      desc: "Adapts to every child's pace automatically",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t("signup_feature_coppa"),
      desc: "COPPA, FERPA & GDPR compliant platform",
    },
  ];

  return (
    <div className="min-h-screen flex">
      <SkipLink />
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" aria-hidden="true">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 -left-10 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-pink-300 rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
          <Link href="/">
            <Image
              src="/images/aivo-logo-white.png"
              alt="AIVO"
              width={140}
              height={44}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-heading font-bold text-white leading-tight">
                {t("join_headline")}
              </h2>
              <p className="text-lg text-white/70 font-body mt-4 max-w-md leading-relaxed">
                {t("join_message")}
              </p>
            </div>

            <div className="space-y-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{f.title}</p>
                    <p className="text-white/50 text-xs font-body mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/50 text-sm font-body">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {t("signup_free_trial")}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>{t("signup_no_credit_card")}</span>
          </div>
        </div>
      </div>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <Link href="/" className="lg:hidden">
            <Image
              src="/images/aivo-logo-purple.png"
              alt="AIVO"
              width={110}
              height={34}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>
          <div className="lg:ml-auto" />
          <LanguageSwitcher compact />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <div className="lg:hidden mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 font-body">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {t("signup_free_trial")}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{t("signup_no_credit_card")}</span>
                </div>
              </div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">{t("create_account")}</h1>
              <p className="text-gray-500 font-body">{t("signup_subtitle")}</p>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium mb-6">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("full_name")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition font-body"
                    placeholder={t("name_placeholder")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition font-body"
                    placeholder="parent@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("password")}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition font-body"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-body">{t("password_hint")}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold text-base hover:bg-violet-700 active:bg-violet-800 transition-all shadow-lg shadow-violet-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("signing_up")}
                  </span>
                ) : t("create_account")}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4 font-body leading-relaxed">
              {t("agree_terms_prefix")}{" "}
              <Link href="/terms-of-service" className="text-violet-600 hover:text-violet-800 transition font-medium">{t("terms")}</Link>
              {" "}{t("and")}{" "}
              <Link href="/privacy-policy" className="text-violet-600 hover:text-violet-800 transition font-medium">{t("privacy")}</Link>
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500 font-body">
                {t("have_account")}{" "}
                <Link href="/login" className="text-violet-600 font-bold hover:text-violet-800 transition">
                  {t("sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 pb-6 text-xs text-gray-400 font-body">
          <Link href="/privacy-policy" className="hover:text-gray-600 transition">{t("privacy")}</Link>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <Link href="/terms-of-service" className="hover:text-gray-600 transition">{t("terms")}</Link>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <Link href="/coppa-compliance" className="hover:text-gray-600 transition">COPPA</Link>
        </div>
      </main>
    </div>
  );
}
