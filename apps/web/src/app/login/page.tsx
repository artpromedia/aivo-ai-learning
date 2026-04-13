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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark items-center justify-center p-12">
        <div className="text-white space-y-6 max-w-md">
          <Image src="/images/aivo-logo-white.png" alt="AIVO" width={180} height={54} />
          <h2 className="text-3xl font-heading font-bold">{t("welcome_back")}</h2>
          <p className="text-purple-100 text-lg">{t("continue_description")}</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center">
            <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} />
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setMode("email")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "email" ? "bg-white shadow text-primary" : "text-slate-500"}`}>
              {t("email_login")}
            </button>
            <button onClick={() => setMode("pin")} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "pin" ? "bg-white shadow text-primary" : "text-slate-500"}`}>
              {t("learner_pin")}
            </button>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

          {mode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("password")}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50">
                {loading ? t("signing_in") : t("sign_in")}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("parent_email_or_id")}</label>
                <input type="text" value={parentId} onChange={(e) => setParentId(e.target.value)} required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("learner_pin_label")}</label>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition text-center text-2xl tracking-widest" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-secondary text-white font-semibold hover:bg-cyan-600 transition disabled:opacity-50">
                {loading ? t("signing_in") : t("sign_in")}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            {t("no_account")}{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">{t("sign_up")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
