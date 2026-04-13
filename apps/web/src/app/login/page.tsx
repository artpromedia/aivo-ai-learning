"use client";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
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

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/mother-son-sofa.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-purple-900/70 to-slate-900/80" />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Image
            src="/images/aivo-logo-white.png"
            alt="AIVO"
            width={130}
            height={40}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher compact />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">{t("welcome_back")}</h1>
            <p className="text-white/60 font-body">{t("continue_description")}</p>
          </div>

          <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
            <button
              onClick={() => setMode("email")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "email"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t("email_login")}
            </button>
            <button
              onClick={() => setMode("pin")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "pin"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t("learner_pin")}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold mb-4">
              {error}
            </div>
          )}

          {mode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-white/70 mb-1.5">{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition font-body"
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/70 mb-1.5">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition font-body"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg hover:from-primary-dark hover:to-purple-700 transition-all shadow-xl shadow-purple-900/40 disabled:opacity-50"
              >
                {loading ? t("signing_in") : t("sign_in")}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-white/70 mb-1.5">{t("parent_email_or_id")}</label>
                <input
                  type="text"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition font-body"
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/70 mb-1.5">{t("learner_pin_label")}</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition font-body text-center text-2xl tracking-[0.5em]"
                  placeholder="• • • •"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold text-lg hover:from-cyan-600 hover:to-teal-600 transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-50"
              >
                {loading ? t("signing_in") : t("sign_in")}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/50 font-body">
              {t("no_account")}{" "}
              <Link href="/signup" className="text-purple-300 font-bold hover:text-white transition">
                {t("sign_up")}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/30 font-body">
          <Link href="/privacy-policy" className="hover:text-white/60 transition">{t("privacy")}</Link>
          <span>•</span>
          <Link href="/terms-of-service" className="hover:text-white/60 transition">{t("terms")}</Link>
          <span>•</span>
          <Link href="/coppa-compliance" className="hover:text-white/60 transition">COPPA</Link>
        </div>
      </div>
    </div>
  );
}
