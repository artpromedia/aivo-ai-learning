"use client";
import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    { icon: "🧠", text: t("signup_feature_brain_clone") },
    { icon: "👨‍🏫", text: t("signup_feature_tutors") },
    { icon: "🎮", text: t("signup_feature_levels") },
    { icon: "🛡️", text: t("signup_feature_coppa") },
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/arab-boy-chromebook.webp"
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

      <div className="relative z-10 w-full max-w-5xl mx-4 pt-32 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block space-y-8">
            <div>
              <h2 className="text-4xl font-heading font-bold text-white leading-tight mb-4">
                {t("join_headline")}
              </h2>
              <p className="text-lg text-white/60 font-body leading-relaxed">
                {t("join_message")}
              </p>
            </div>

            <div className="space-y-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                >
                  <span className="text-2xl w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl flex-shrink-0">
                    {f.icon}
                  </span>
                  <span className="text-white/80 font-body font-semibold">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-white/40 text-sm font-body">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400/60" />
                {t("signup_free_trial")}
              </span>
              <span>•</span>
              <span>{t("signup_no_credit_card")}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            <div className="text-center mb-6 lg:text-left">
              <div className="lg:hidden mb-4">
                <Image
                  src="/images/aivo-logo-white.png"
                  alt="AIVO"
                  width={120}
                  height={36}
                  style={{ width: "auto", height: "auto" }}
                  className="mx-auto lg:mx-0"
                />
              </div>
              <h1 className="text-2xl font-heading font-bold text-white mb-1">{t("create_account")}</h1>
              <p className="text-sm text-white/50 font-body">{t("signup_subtitle")}</p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-white/70 mb-1.5">{t("full_name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition font-body"
                  placeholder={t("name_placeholder")}
                />
              </div>
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
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition font-body"
                  placeholder="••••••••"
                />
                <p className="text-xs text-white/30 mt-1.5 font-body">{t("password_hint")}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg hover:from-primary-dark hover:to-purple-700 transition-all shadow-xl shadow-purple-900/40 disabled:opacity-50"
              >
                {loading ? t("signing_up") : t("create_account")}
              </button>
            </form>

            <p className="text-xs text-white/30 text-center mt-4 font-body">
              {t("agree_terms_prefix")}{" "}
              <Link href="/terms-of-service" className="text-purple-300 hover:text-white transition">{t("terms")}</Link>
              {" "}{t("and")}{" "}
              <Link href="/privacy-policy" className="text-purple-300 hover:text-white transition">{t("privacy")}</Link>
            </p>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-white/50 font-body">
                {t("have_account")}{" "}
                <Link href="/login" className="text-purple-300 font-bold hover:text-white transition">
                  {t("sign_in")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
