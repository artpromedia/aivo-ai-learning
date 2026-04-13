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

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12">
        <div className="text-white space-y-6 max-w-md">
          <Image src="/images/aivo-logo-white.png" alt="AIVO" width={180} height={54} />
          <h2 className="text-3xl font-heading font-bold">{t("create_account")}</h2>
          <p className="text-purple-100 text-lg">{t("join_message")}</p>
          <div className="space-y-3 text-purple-100">
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> 14 specialized AI tutors</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> 5 functioning levels</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> Adaptive brain-clone technology</div>
            <div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white" /> COPPA compliant</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{t("create_account")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("join_message")}</p>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("full_name")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-purple-100 outline-none transition" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50">
              {loading ? t("signing_up") : t("create_account")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {t("have_account")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">{t("sign_in")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
