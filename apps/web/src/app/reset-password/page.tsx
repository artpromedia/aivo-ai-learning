"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

const STRENGTH_COLORS = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

function reasonText(r: string): string {
  switch (r) {
    case "too_short": return "Too short — at least 12 characters required";
    case "too_weak": return "Not strong enough — add more length or variety";
    case "breached": return "This password has appeared in a public breach";
    case "reused": return "You've used this password before — pick a new one";
    case "missing_diversity": return "Use at least 3 of: lowercase, uppercase, digits, symbols";
    default: return r;
  }
}

interface PolicyCheck { ok: boolean; reasons: string[]; strengthScore: number; }

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyCheck | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing reset token. Please request a new reset link.");
  }, [token]);

  // Local strength estimate (no breach check) for instant UX. The server
  // performs the authoritative check on submit.
  useEffect(() => {
    if (!password) { setPolicy(null); return; }
    const handle = setTimeout(() => {
      setChecking(true);
      const len = password.length;
      let score = 0;
      const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
      let entropy = Math.min(len, 32) * 2 + classes * 6;
      if (/(.)\1{2,}/.test(password)) entropy -= 8;
      if (entropy < 18) score = 0;
      else if (entropy < 30) score = 1;
      else if (entropy < 42) score = 2;
      else if (entropy < 56) score = 3;
      else score = 4;
      const reasons: string[] = [];
      if (len < 12) reasons.push("too_short");
      if (score < 3) reasons.push("too_weak");
      setPolicy({ ok: reasons.length === 0, reasons, strengthScore: score });
      setChecking(false);
    }, 200);
    return () => clearTimeout(handle);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (Array.isArray(data.reasons) && data.reasons.length) {
          throw new Error(data.reasons.map(reasonText).join(" • "));
        }
        throw new Error(data.error || "Could not reset password");
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const score = policy?.strengthScore ?? 0;
  const submitDisabled = loading || !token || password.length < 12 || password !== confirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex justify-center mb-6">
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} priority style={{ width: "auto", height: "auto" }} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 text-center">Reset your password</h1>
        <p className="text-sm text-slate-500 text-center mt-2">Choose a new password for your account.</p>

        {success ? (
          <div className="mt-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <p className="text-slate-700 font-semibold">Password updated</p>
            <p className="text-sm text-slate-500 mt-2">Redirecting you to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reset-password-new" className="block text-sm font-semibold text-slate-700 mb-2">New password</label>
              <div className="relative">
                <input
                  id="reset-password-new"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="At least 12 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >{showPassword ? "Hide" : "Show"}</button>
              </div>
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? STRENGTH_COLORS[score] : "bg-slate-200"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${score >= 3 ? "text-emerald-600" : "text-slate-500"}`}>
                    {checking ? "Checking..." : STRENGTH_LABELS[score]}
                  </p>
                  {policy && policy.reasons.length > 0 && (
                    <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                      {policy.reasons.map((r) => <li key={r}>{reasonText(r)}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="reset-password-confirm" className="block text-sm font-semibold text-slate-700 mb-2">Confirm new password</label>
              <input
                id="reset-password-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition"
              />
              {confirm && confirm !== password && (
                <p className="mt-1 text-xs text-red-600">Passwords don&apos;t match yet</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                ← Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
