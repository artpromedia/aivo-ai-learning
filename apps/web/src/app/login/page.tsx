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
  KeyRound,
  Loader2,
  AlertCircle,
  Sparkles,
  Star,
  Heart,
  BookOpen,
  Brain,
} from "lucide-react";

const SUBJECTS = [
  { Icon: Star, label: "Math", className: "bg-subject-math text-white" },
  { Icon: BookOpen, label: "Reading", className: "bg-subject-reading text-white" },
  { Icon: Sparkles, label: "Science", className: "bg-subject-science text-white" },
  { Icon: Heart, label: "SEL", className: "bg-subject-sel text-white" },
];

export default function LoginPage() {
  const { login, pinLogin } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"email" | "pin">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentId, setParentId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.mfaPending) {
        router.push(`/verify-mfa?token=${encodeURIComponent(result.mfaToken)}&returnTo=/`);
        return;
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || t("login_failed"));
    }
    setLoading(false);
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await pinLogin(parentId, pin);
      router.push("/dashboard/learner/assessment");
    } catch (err: any) {
      setError(err.message || t("pin_login_failed"));
    }
    setLoading(false);
  };

  const accent = mode === "email" ? "primary" : "subject-science";
  const submitClasses =
    mode === "email"
      ? "bg-primary hover:bg-primary-dark active:bg-primary-dark shadow-purple-600/30"
      : "bg-subject-science hover:opacity-90 active:opacity-80 shadow-green-500/30";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <SkipLink />

      {/* Marketing Rail */}
      <aside
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
          <Link href="/" aria-hidden="false">
            <Image
              src="/images/aivo-logo-white.png"
              alt="AIVO"
              width={140}
              height={44}
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <div className="space-y-10">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border-2 border-white/20 text-white text-xs font-black uppercase tracking-wider mb-6">
                <Sparkles size={14} strokeWidth={3} aria-hidden="true" />
                Built for every brain
              </span>
              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-[1.05]">
                Every child learns
                <br />
                <span className="text-amber-300">differently.</span>
              </h2>
              <p className="text-lg text-white/80 font-body mt-5 max-w-md leading-relaxed">
                AIVO&apos;s AI tutors adapt to your child&apos;s unique learning profile,
                creating a personalized path to success.
              </p>
            </div>

            {/* Subject pictograms */}
            <div className="flex items-center gap-3">
              {SUBJECTS.map(({ Icon, label, className }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${className} shadow-lg`}
                >
                  <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <div className="flex -space-x-3">
                {[
                  { color: "bg-amber-400", letter: "J" },
                  { color: "bg-rose-400", letter: "M" },
                  { color: "bg-emerald-400", letter: "K" },
                  { color: "bg-sky-400", letter: "A" },
                ].map((c) => (
                  <div
                    key={c.letter}
                    className={`w-11 h-11 rounded-full ${c.color} border-[3px] border-white/30 flex items-center justify-center text-white text-sm font-black`}
                  >
                    {c.letter}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-heading font-bold text-base">
                  10,000+ families
                </p>
                <p className="text-white/60 text-xs font-body font-semibold">
                  trust AIVO for learning
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[
              { value: "14", label: "AI Tutors", Icon: Brain },
              { value: "5", label: "Levels", Icon: Star },
              { value: "6", label: "Subjects", Icon: BookOpen },
            ].map(({ value, label, Icon }, i, arr) => (
              <div key={label} className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                    <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-black text-white leading-none">
                      {value}
                    </p>
                    <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider mt-1">
                      {label}
                    </p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-10 bg-white/20" />}
              </div>
            ))}
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
            {/* Header with welcome icon */}
            <div className="mb-8 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-primary flex items-center justify-center shadow-sm shrink-0">
                <Sparkles size={28} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 leading-tight">
                  {t("welcome_back")}
                </h1>
                <p className="text-slate-600 font-body mt-1.5">
                  {t("continue_description")}
                </p>
              </div>
            </div>

            {/* Mode toggle pill */}
            <div
              role="tablist"
              aria-label="Login method"
              className="flex bg-white border-2 border-slate-100 rounded-2xl p-1.5 mb-6 shadow-sm"
            >
              <button
                role="tab"
                aria-selected={mode === "email"}
                onClick={() => setMode("email")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === "email"
                    ? "bg-primary text-white shadow-md shadow-purple-600/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail size={16} strokeWidth={2.5} aria-hidden="true" />
                {t("email_login")}
              </button>
              <button
                role="tab"
                aria-selected={mode === "pin"}
                onClick={() => setMode("pin")}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === "pin"
                    ? "bg-subject-science text-white shadow-md shadow-green-500/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound size={16} strokeWidth={2.5} aria-hidden="true" />
                {t("learner_pin")}
              </button>
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

            {mode === "email" ? (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    {t("email")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary pointer-events-none">
                      <Mail size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="login-email"
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
                    htmlFor="login-password"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    {t("password")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary pointer-events-none">
                      <Lock size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-4 focus:ring-purple-200 outline-none transition font-body"
                      placeholder="Enter your password"
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
                  <div className="mt-2 text-right">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-primary hover:text-primary-dark hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className={`w-full py-4 rounded-2xl text-white font-heading font-black text-base uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${submitClasses}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2
                        size={18}
                        strokeWidth={2.5}
                        className="motion-safe:animate-spin"
                        aria-hidden="true"
                      />
                      {t("signing_in")}
                    </span>
                  ) : (
                    t("sign_in")
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePinLogin} className="space-y-5">
                <div>
                  <label
                    htmlFor="parent-id"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    {t("parent_email_or_id")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-subject-science pointer-events-none">
                      <User size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="parent-id"
                      type="text"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-subject-science focus:ring-4 focus:ring-green-200 outline-none transition font-body"
                      placeholder="parent@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="learner-pin"
                    className="block text-sm font-bold text-slate-800 mb-2"
                  >
                    {t("learner_pin_label")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-subject-science pointer-events-none">
                      <KeyRound size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="learner-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      maxLength={6}
                      autoComplete="one-time-code"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-subject-science focus:ring-4 focus:ring-green-200 outline-none transition font-body text-center text-2xl font-black tracking-[0.5em]"
                      placeholder="------"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className={`w-full py-4 rounded-2xl text-white font-heading font-black text-base uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${submitClasses}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2
                        size={18}
                        strokeWidth={2.5}
                        className="motion-safe:animate-spin"
                        aria-hidden="true"
                      />
                      {t("signing_in")}
                    </span>
                  ) : (
                    t("sign_in")
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t-2 border-slate-100 text-center">
              <p className="text-sm text-slate-600 font-body">
                {t("no_account")}{" "}
                <Link
                  href="/signup"
                  className="text-primary font-bold hover:text-primary-dark transition hover:underline"
                >
                  {t("sign_up")}
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
