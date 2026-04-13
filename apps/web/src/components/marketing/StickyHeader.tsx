"use client";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function StickyHeader({ scrollY }: { scrollY: number }) {
  const isScrolled = scrollY > 20;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/aivo-logo-purple.png"
            alt="AIVO"
            width={130}
            height={40}
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-primary transition">Features</a>
          <a href="#tutors" className="text-sm font-semibold text-slate-600 hover:text-primary transition">Tutors</a>
          <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-primary transition">Pricing</a>
          <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-primary transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg text-slate-600 font-semibold hover:text-primary transition hidden sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
