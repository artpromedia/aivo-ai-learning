"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginRedirectPage() {
  const webAppUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || "";

  useEffect(() => {
    if (webAppUrl) {
      window.location.href = `${webAppUrl}/login`;
    }
  }, [webAppUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/images/aivo-logo-purple.png"
            alt="AIVO"
            width={160}
            height={50}
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4">Sign In</h1>
        <p className="text-slate-500 font-body mb-8">
          Sign in to your AIVO Learning account to access your dashboard, manage learners, and track progress.
        </p>
        <Link
          href={webAppUrl ? `${webAppUrl}/login` : "/"}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700 transition shadow-lg shadow-violet-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Go to Sign In
        </Link>
        <p className="text-sm text-slate-400 font-body mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-violet-600 font-semibold hover:text-violet-800 transition">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
