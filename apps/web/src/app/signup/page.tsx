"use client";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SkipLink } from "@/components/a11y/SkipLink";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
  Users,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

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
      Icon: Brain,
      title: t("signup_feature_brain_clone"),
      desc: "Builds a unique AI model of how your child learns",
      tint: "bg-subject-math text-white",
    },
    {
      Icon: Users,
      title: t("signup_feature_tutors"),
      desc: "Each with specialized teaching personalities",
      tint: "bg-subject-reading text-white",
    },
    {
      Icon: Zap,
      title: t("signup_feature_levels"),
      desc: "Adapts to every child's pace automatically",
      tint: "bg-subject-sel text-white",
    },
    {
      Icon: ShieldCheck,
      title: t("signup_feature_coppa"),
      desc: "COPPA, FERPA & GDPR compliant platform",
      tint: "bg-subject-science text-white",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <SkipLink />

      {/* Marketing Rail */}
      <aside
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-32 -left-10 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-cyan-300 rounded-full blur-3xl" />
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
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border-2 border-white/20 text-white text-xs font-black uppercase tracking-wider mb-6">
                <Sparkles size={14} strokeWidth={3} aria-hidden="true" />
                Start free today
              </span>
              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-[1.05]">
                {t("join_headline")}
              </h2>
              <p className="text-lg text-white/80 font-body mt-5 max-w-md leading-relaxed">
                {t("join_message")}
              </p>
            </div>

            <div className="space-y-3">
              {features.map(({ Icon, title, desc, tint }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/15 hover:bg-white/15 transition-colors"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl ${tint} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-white font-heading font-bold text-base leading-snug">
                      {title}
                    </p>
                    <p className="text-white/70 text-xs font-body font-semibold mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/80 text-sm font-body font-semibold">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/30">
              <CheckCircle2
                size={14}
                strokeWidth={3}
                className="text-emerald-300"
                aria-hidden="true"
              />
              {t("signup_free_trial")}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              <CheckCircle2
                size={14}
                strokeWidth={3}
                className="text-white/80"
                aria-hidden="true"
              />
              {t("signup_no_credit_card")}
            </span>
          </div>
        </div>
      </aside>

      {/* Form Side */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col bg-slate-50 min-h-screen"
      >
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
          <div className="w-full max-w-[440px]">
            <div className="mb-8">
              <div className="lg:hidden mb-6 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={14} strokeWidth={3} aria-hidden="true" />
                  {t("signup_free_trial")}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                  <CheckCircle2 size={14} strokeWidth={3} aria-hidden="true" />
                  {t("signup_no_credit_card")}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-primary flex items-center justify-center shadow-sm shrink-0">
                  <Sparkles size={28} strokeWidth={2.5} aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-3xl font-heading font-bold text-slate-900 leading-tight">
                    {t("create_account")}
                  </h1>
                  <p className="text-slate-600 font-body mt-1.5">
                    {t("signup_subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-3 p-4 rounded-2xl bg-pink-50 border-2 border-pink-200 text-pink-800 text-sm font-bold mb-6"
              >
                <span className="w-8 h-8 rounded-xl bg-white text-pink-600 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle size={18} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="pt-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  {t("full_name")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary pointer-events-none">
                    <User size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-4 focus:ring-purple-200 outline-none transition font-body"
                    placeholder={t("name_placeholder")}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  {t("email")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary pointer-events-none">
                    <Mail size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-4 focus:ring-purple-200 outline-none transition font-body"
                    placeholder="parent@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-sm font-bold text-slate-800 mb-2"
                >
                  {t("password")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary pointer-events-none">
                    <Lock size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-4 focus:ring-purple-200 outline-none transition font-body"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={20} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Eye size={20} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-body font-semibold">
                  {t("password_hint")}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full py-4 rounded-2xl bg-primary text-white font-heading font-black text-base uppercase tracking-wider hover:bg-primary-dark active:bg-primary-dark transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2
                      size={18}
                      strokeWidth={2.5}
                      className="motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                    {t("signing_up")}
                  </span>
                ) : (
                  t("create_account")
                )}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-4 font-body font-semibold leading-relaxed">
              {t("agree_terms_prefix")}{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:text-primary-dark transition font-bold hover:underline"
              >
                {t("terms")}
              </Link>{" "}
              {t("and")}{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:text-primary-dark transition font-bold hover:underline"
              >
                {t("privacy")}
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t-2 border-slate-100 text-center">
              <p className="text-sm text-slate-600 font-body">
                {t("have_account")}{" "}
                <Link
                  href="/login"
                  className="text-primary font-bold hover:text-primary-dark transition hover:underline"
                >
                  {t("sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 pb-6 text-xs text-slate-500 font-body font-semibold">
          <Link
            href="/privacy-policy"
            className="hover:text-primary transition"
          >
            {t("privacy")}
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <Link
            href="/terms-of-service"
            className="hover:text-primary transition"
          >
            {t("terms")}
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <Link
            href="/coppa-compliance"
            className="hover:text-primary transition"
          >
            COPPA
          </Link>
        </div>
      </main>
    </div>
  );
}
