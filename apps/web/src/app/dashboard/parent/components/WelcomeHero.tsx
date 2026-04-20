"use client";
import Link from "next/link";
import { Sun, Cloud, Moon, Sparkles, Bell } from "lucide-react";

interface WelcomeHeroProps {
  userName: string;
  unreadCount: number;
  lastVisit: string | null;
}

export function WelcomeHero({ userName, unreadCount }: WelcomeHeroProps) {
  const hour = new Date().getHours();
  const firstName = userName?.split(" ")[0] || "";

  let greeting: string;
  let subtext: string;
  let Icon = Sparkles;
  let iconColor = "text-primary";

  if (hour >= 5 && hour < 12) {
    greeting = `Good morning, ${firstName}`;
    subtext = "Here's how your family is doing today.";
    Icon = Sun;
    iconColor = "text-subject-sel";
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good afternoon, ${firstName}`;
    subtext = "Let's check in on today's progress.";
    Icon = Cloud;
    iconColor = "text-subject-reading";
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good evening, ${firstName}`;
    subtext = "Let's see what happened today.";
    Icon = Moon;
    iconColor = "text-primary";
  } else {
    greeting = `Hey ${firstName}`;
    subtext = "Quick check-in — everything's on track.";
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-white to-cyan-50 rounded-3xl p-6 lg:p-8 border-2 border-purple-100/60 shadow-sm">
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center ${iconColor} shrink-0`}>
            <Icon size={28} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 leading-tight">
              {greeting}
            </h1>
            <p className="text-slate-600 mt-1 text-sm lg:text-base font-medium">{subtext}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Link
            href="/dashboard/parent/inbox"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border-2 border-purple-200 text-purple-700 text-sm font-bold hover:bg-purple-50 transition flex-shrink-0 shadow-sm"
          >
            <span className="relative">
              <Bell size={18} strokeWidth={2.5} aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
            <span>Need attention</span>
          </Link>
        )}
      </div>
    </div>
  );
}
