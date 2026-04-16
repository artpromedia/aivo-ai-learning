"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useTranslations } from "next-intl";

export function MfaSettings({ accentColor = "violet" }: { accentColor?: string }) {
  const { user, accessToken } = useAuth();
  const t = useTranslations("parent");
  const tc = useTranslations("common");

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaForced, setMfaForced] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState("");
  const [mfaErr, setMfaErr] = useState("");
  const [mfaPassword, setMfaPassword] = useState("");
  const [showMfaConfirm, setShowMfaConfirm] = useState(false);
  const [mfaEnableToken, setMfaEnableToken] = useState("");
  const [mfaEnableCode, setMfaEnableCode] = useState("");
  const [mfaResendCooldown, setMfaResendCooldown] = useState(0);
  const mfaCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (mfaCooldownRef.current) clearInterval(mfaCooldownRef.current); };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/auth/mfa/status", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(data => { setMfaEnabled(data.mfaEnabled); setMfaForced(data.mfaForced); })
      .catch(() => {});
  }, [accessToken]);

  const handleMfaToggle = async () => {
    if (!mfaPassword) return;
    setMfaLoading(true);
    setMfaMsg("");
    setMfaErr("");
    try {
      if (mfaEnabled) {
        const res = await fetch("/api/auth/mfa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ password: mfaPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setMfaEnabled(false);
          setMfaMsg(t("mfa_disabled"));
          setShowMfaConfirm(false);
          setMfaPassword("");
        } else {
          setMfaErr(data.error || tc("error"));
        }
      } else {
        const res = await fetch("/api/auth/mfa/enable", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ password: mfaPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setMfaEnableToken(data.mfaToken);
          setMfaPassword("");
        } else {
          setMfaErr(data.error || tc("error"));
        }
      }
    } catch { setMfaErr(tc("error")); }
    setMfaLoading(false);
  };

  const handleMfaConfirmEnable = async () => {
    if (mfaEnableCode.length !== 6) return;
    setMfaLoading(true);
    setMfaMsg("");
    setMfaErr("");
    try {
      const res = await fetch("/api/auth/mfa/confirm-enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken: mfaEnableToken, code: mfaEnableCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMfaEnabled(true);
        setMfaMsg(t("mfa_enabled"));
        setMfaEnableToken("");
        setMfaEnableCode("");
        setShowMfaConfirm(false);
      } else {
        setMfaErr(data.error || tc("error"));
        setMfaEnableCode("");
      }
    } catch { setMfaErr(tc("error")); }
    setMfaLoading(false);
  };

  const handleMfaResendEnable = async () => {
    if (mfaResendCooldown > 0) return;
    setMfaErr("");
    try {
      const res = await fetch("/api/auth/mfa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken: mfaEnableToken }),
      });
      if (res.ok) {
        setMfaMsg(t("mfa_code_resent") || "Code resent.");
        setMfaResendCooldown(30);
        if (mfaCooldownRef.current) clearInterval(mfaCooldownRef.current);
        mfaCooldownRef.current = setInterval(() => setMfaResendCooldown(v => { if (v <= 1) { if (mfaCooldownRef.current) clearInterval(mfaCooldownRef.current); mfaCooldownRef.current = null; return 0; } return v - 1; }), 1000);
      } else {
        const data = await res.json();
        setMfaErr(data.error || "Resend failed");
      }
    } catch { setMfaErr(t("network_error")); }
  };

  const colorClasses = {
    violet: { bg: "bg-violet-600", hover: "hover:bg-violet-700", text: "text-violet-600", badge: "bg-violet-100 text-violet-700" },
    blue: { bg: "bg-blue-600", hover: "hover:bg-blue-700", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
    pink: { bg: "bg-pink-600", hover: "hover:bg-pink-700", text: "text-pink-600", badge: "bg-pink-100 text-pink-700" },
    green: { bg: "bg-green-600", hover: "hover:bg-green-700", text: "text-green-600", badge: "bg-green-100 text-green-700" },
  }[accentColor] || { bg: "bg-violet-600", hover: "hover:bg-violet-700", text: "text-violet-600", badge: "bg-violet-100 text-violet-700" };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900">{t("two_factor_auth")}</h2>
          <p className="text-sm text-slate-500">{t("mfa_description")}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${mfaEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {mfaEnabled ? tc("on") : tc("off")}
        </span>
      </div>
      {mfaMsg && <p className="text-sm text-green-600 mb-3">{mfaMsg}</p>}
      {mfaErr && <p className="text-sm text-red-600 mb-3">{mfaErr}</p>}

      {mfaEnableToken ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{t("mfa_enter_code")}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={mfaEnableCode}
            onChange={e => setMfaEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-[0.5em] font-bold px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
          />
          <div className="flex gap-3">
            <button onClick={handleMfaConfirmEnable} disabled={mfaLoading || mfaEnableCode.length !== 6}
              className={`flex-1 py-2.5 rounded-xl ${colorClasses.bg} text-white font-bold text-sm ${colorClasses.hover} transition disabled:opacity-50`}>
              {mfaLoading ? tc("saving") : tc("confirm")}
            </button>
            <button onClick={handleMfaResendEnable} disabled={mfaResendCooldown > 0}
              className={`px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold ${colorClasses.text} disabled:opacity-50`}>
              {mfaResendCooldown > 0 ? `${tc("wait")} ${mfaResendCooldown}s` : (t("mfa_resend") || "Resend code")}
            </button>
            <button onClick={() => { setMfaEnableToken(""); setMfaEnableCode(""); setShowMfaConfirm(false); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              {tc("cancel")}
            </button>
          </div>
        </div>
      ) : !showMfaConfirm ? (
        <button
          onClick={() => setShowMfaConfirm(true)}
          disabled={mfaForced && mfaEnabled}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 ${
            mfaEnabled
              ? "border border-red-200 text-red-600 hover:bg-red-50"
              : `${colorClasses.bg} text-white ${colorClasses.hover}`
          }`}
        >
          {mfaEnabled ? t("disable_mfa") : t("enable_mfa")}
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="password"
            value={mfaPassword}
            onChange={e => setMfaPassword(e.target.value)}
            placeholder={t("enter_password")}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
          />
          <div className="flex gap-3">
            <button onClick={handleMfaToggle} disabled={mfaLoading || !mfaPassword}
              className={`flex-1 py-2.5 rounded-xl ${colorClasses.bg} text-white font-bold text-sm ${colorClasses.hover} transition disabled:opacity-50`}>
              {mfaLoading ? tc("saving") : tc("confirm")}
            </button>
            <button onClick={() => { setShowMfaConfirm(false); setMfaPassword(""); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              {tc("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
