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

// Subject labels are translated at render time via the `subjectKey` field.
const SUBJECTS = [
  { Icon: Star, subjectKey: "subject_math", token: "--visual-math" },
  { Icon: BookOpen, subjectKey: "subject_reading", token: "--visual-reading" },
  { Icon: Sparkles, subjectKey: "subject_science", token: "--visual-science" },
  { Icon: Heart, subjectKey: "subject_sel", token: "--visual-sel" },
] as const;

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
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRedirectTo(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.mfaPending) {
        router.push(`/verify-mfa?token=${encodeURIComponent(result.mfaToken)}&method=${encodeURIComponent(result.mfaMethod || "email")}&returnTo=/`);
        return;
      }
      const roleDashboards: Record<string, string> = {
        PARENT: "/dashboard/parent",
        LEARNER: "/dashboard/learner",
        TEACHER: "/dashboard/teacher",
        CAREGIVER: "/dashboard/caregiver",
        THERAPIST: "/dashboard/therapist",
      };
      const dest = roleDashboards[result?.user?.role] || "/dashboard/parent";
      router.replace(dest);
    } catch (err: any) {
      setError(err.message || t("login_failed"));
      if (err && typeof err === "object" && err.redirectTo) {
        setRedirectTo(err.redirectTo as string);
      }
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

  const submitClasses =
    mode === "email"
      ? "bg-[hsl(var(--visual-primary))] hover:bg-[hsl(var(--visual-primary)/0.9)] active:bg-[hsl(var(--visual-primary)/0.9)]"
      : "bg-[hsl(var(--visual-science))] hover:bg-[hsl(var(--visual-science)/0.9)] active:bg-[hsl(var(--visual-science)/0.9)]";

  return (
    <div className="min-h-screen flex vi-bg">
      <SkipLink />

      {/* Marketing Rail */}
      <aside
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[hsl(var(--visual-primary))]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--visual-math))] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[hsl(var(--visual-reading))] rounded-full blur-3xl" />
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
                {t("marketing_eyebrow")}
              </span>
              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-[1.05]">
                {t("marketing_headline_part1")}
                <br />
                <span className="text-[hsl(var(--visual-sel))]">{t("marketing_headline_part2")}</span>
              </h2>
              <p className="text-lg text-white/80 font-body mt-5 max-w-md leading-relaxed">
                {t("marketing_subheadline")}
              </p>
            </div>

            {/* Subject pictograms */}
            <div className="flex items-center gap-3">
              {SUBJECTS.map(({ Icon, subjectKey, token }) => (
                <div
                  key={subjectKey}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: `hsl(var(${token}))` }}
                >
                  <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {t(subjectKey)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <div className="flex -space-x-3">
                {[
                  { token: "--visual-sel", letter: "J" },
                  { token: "--visual-math", letter: "M" },
                  { token: "--visual-science", letter: "K" },
                  { token: "--visual-reading", letter: "A" },
                ].map((c) => (
                  <div
                    key={c.letter}
                    className="w-11 h-11 rounded-full border-[3px] border-white/30 flex items-center justify-center text-white text-sm font-black"
                    style={{ backgroundColor: `hsl(var(${c.token}))` }}
                  >
                    {c.letter}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-heading font-bold text-base">
                  {t("marketing_families_count")}
                </p>
                <p className="text-white/60 text-xs font-body font-semibold">
                  {t("marketing_families_caption")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[
              { value: "14", labelKey: "stat_ai_tutors", Icon: Brain },
              { value: "5", labelKey: "stat_levels", Icon: Star },
              { value: "6", labelKey: "stat_subjects", Icon: BookOpen },
            ].map(({ value, labelKey, Icon }, i, arr) => (
              <div key={labelKey} className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                    <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-black text-white leading-none">
                      {value}
                    </p>
                    <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider mt-1">
                      {t(labelKey)}
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
        className="flex-1 flex flex-col vi-bg min-h-screen"
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
          <div className="w-full max-w-[440px] vi-card p-8">
            {/* Header with welcome icon */}
            <div className="mb-8 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--visual-primary)/0.12)] text-[hsl(var(--visual-primary))] flex items-center justify-center shrink-0">
                <Sparkles size={28} strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold vi-text leading-tight">
                  {t("welcome_back")}
                </h1>
                <p className="vi-text-muted font-body mt-1.5">
                  {t("continue_description")}
                </p>
              </div>
            </div>

            {/* Mode toggle pill */}
            <div
              role="tablist"
              aria-label="Login method"
              className="flex vi-surface-soft border-2 vi-border rounded-2xl p-1.5 mb-6"
            >
              <button
                role="tab"
                aria-selected={mode === "email"}
                onClick={() => setMode("email")}
                style={{ minHeight: 44 }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === "email"
                    ? "bg-[hsl(var(--visual-primary))] text-white shadow-md"
                    : "vi-text-muted hover:vi-text"
                }`}
              >
                <Mail size={16} strokeWidth={2.5} aria-hidden="true" />
                {t("email_login")}
              </button>
              <button
                role="tab"
                aria-selected={mode === "pin"}
                onClick={() => setMode("pin")}
                style={{ minHeight: 44 }}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === "pin"
                    ? "bg-[hsl(var(--visual-science))] text-white shadow-md"
                    : "vi-text-muted hover:vi-text"
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
                className="flex items-start gap-3 p-4 rounded-2xl bg-[hsl(var(--visual-math)/0.08)] border-2 border-[hsl(var(--visual-math)/0.3)] text-[hsl(var(--visual-math))] text-sm font-bold mb-6"
              >
                <span className="w-8 h-8 rounded-xl bg-white text-[hsl(var(--visual-math))] flex items-center justify-center shrink-0 shadow-sm">
                  <AlertCircle size={18} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="pt-1">
                  {error}
                  {redirectTo && (
                    <>
                      {" "}
                      <Link href={redirectTo} className="underline font-black">
                        Go to staff sign-in
                      </Link>
                    </>
                  )}
                </span>
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
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[hsl(var(--visual-primary))] pointer-events-none">
                      <Mail size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      style={{ minHeight: 44 }}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 vi-border vi-text placeholder-slate-400 focus:border-[hsl(var(--visual-primary))] focus:ring-4 focus:ring-[hsl(var(--visual-primary)/0.2)] outline-none transition font-body"
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
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[hsl(var(--visual-primary))] pointer-events-none">
                      <Lock size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      style={{ minHeight: 44 }}
                      className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border-2 vi-border vi-text placeholder-slate-400 focus:border-[hsl(var(--visual-primary))] focus:ring-4 focus:ring-[hsl(var(--visual-primary)/0.2)] outline-none transition font-body"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center vi-text-muted hover:text-[hsl(var(--visual-primary))] transition"
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
                      className="text-xs font-bold text-[hsl(var(--visual-primary))] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  style={{ minHeight: 44 }}
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
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[hsl(var(--visual-science))] pointer-events-none">
                      <User size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <input
                      id="parent-id"
                      type="text"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      required
                      autoComplete="username"
                      style={{ minHeight: 44 }}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 vi-border vi-text placeholder-slate-400 focus:border-[hsl(var(--visual-science))] focus:ring-4 focus:ring-[hsl(var(--visual-science)/0.2)] outline-none transition font-body"
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
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[hsl(var(--visual-science))] pointer-events-none">
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
                      style={{ minHeight: 44 }}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 vi-border vi-text placeholder-slate-400 focus:border-[hsl(var(--visual-science))] focus:ring-4 focus:ring-[hsl(var(--visual-science)/0.2)] outline-none transition font-body text-center text-2xl font-black tracking-[0.5em]"
                      placeholder="------"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  style={{ minHeight: 44 }}
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

            <div className="mt-8 pt-6 border-t-2 vi-border text-center">
              <p className="text-sm vi-text-muted font-body">
                {t("no_account")}{" "}
                <Link
                  href="/signup"
                  className="text-[hsl(var(--visual-primary))] font-bold hover:underline transition"
                >
                  {t("sign_up")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 pb-6 text-xs vi-text-muted font-body font-semibold">
          <Link
            href="/privacy-policy"
            className="hover:text-[hsl(var(--visual-primary))] transition"
          >
            {t("privacy")}
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <Link
            href="/terms-of-service"
            className="hover:text-[hsl(var(--visual-primary))] transition"
          >
            {t("terms")}
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <Link
            href="/coppa-compliance"
            className="hover:text-[hsl(var(--visual-primary))] transition"
          >
            COPPA
          </Link>
        </div>
      </main>
    </div>
  );
}
