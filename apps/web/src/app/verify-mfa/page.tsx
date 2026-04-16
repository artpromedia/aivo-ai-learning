"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function VerifyMfaPage() {
  const { refreshToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("mfa");
  const tc = useTranslations("common");

  const mfaToken = searchParams.get("token") || "";
  const returnTo = searchParams.get("returnTo") || "/";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(t("enter_full_code"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code: fullCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("verification_failed"));
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        await refreshToken();
        router.push(returnTo);
      }
    } catch {
      setError(t("verification_failed"));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (code.every((d) => d !== "")) {
      handleSubmit();
    }
  }, [code]);

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      const res = await fetch("/api/auth/resend-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMsg(t("code_resent"));
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || t("resend_failed"));
      }
    } catch {
      setError(t("resend_failed"));
    }
    setResending(false);
  };

  if (!mfaToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">{t("session_expired")}</p>
          <Link href="/login" className="text-violet-600 font-bold hover:underline">{t("back_to_login")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={120} height={38} className="mx-auto" style={{ width: "auto", height: "auto" }} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{t("check_email")}</h1>
            <p className="text-gray-500 text-sm mt-2 font-body">{t("code_sent_desc")}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
              {error}
            </div>
          )}

          {resendMsg && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-4">{resendMsg}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition"
                  aria-label={`${t("digit")} ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.some((d) => !d)}
              className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  {t("verifying")}
                </span>
              ) : t("verify_code")}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-violet-600 font-semibold hover:text-violet-800 transition disabled:opacity-50"
            >
              {resending ? t("resending") : t("resend_code")}
            </button>
            <div>
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition">{t("back_to_login")}</Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 font-body">{t("code_expires")}</p>
      </div>
    </div>
  );
}
