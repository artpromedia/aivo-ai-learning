"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://app.aivolearning.com";

export default function SignupRedirectPage() {
  useEffect(() => {
    window.location.href = `${WEB_APP_URL}/signup`;
  }, []);

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
        <h1 className="text-3xl font-heading font-bold text-slate-900 mb-4">Create Account</h1>
        <p className="text-slate-500 font-body mb-8">
          Redirecting you to the sign up page...
        </p>
        <a
          href={`${WEB_APP_URL}/signup`}
          className="flex items-center justify-center gap-2 w-full px-8 py-3.5 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700 transition shadow-lg shadow-violet-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Create Free Account
        </a>
        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-slate-400 font-body">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Free trial included
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>No credit card required</span>
        </div>
        <p className="text-sm text-slate-400 font-body mt-6">
          Already have an account?{" "}
          <a href={`${WEB_APP_URL}/login`} className="text-violet-600 font-semibold hover:text-violet-800 transition">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
