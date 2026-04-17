"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send reset link");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex justify-center mb-6">
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} priority style={{ width: "auto", height: "auto" }} />
        </div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 text-center">Forgot password?</h1>
        <p className="text-sm text-slate-500 text-center mt-2">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="mt-6 text-center">
            <div className="text-4xl mb-3">✉️</div>
            <p className="text-slate-700 font-semibold">Check your inbox</p>
            <p className="text-sm text-slate-500 mt-2">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. The link expires in 1 hour.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm font-semibold text-violet-600 hover:text-violet-700">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="parent@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
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
