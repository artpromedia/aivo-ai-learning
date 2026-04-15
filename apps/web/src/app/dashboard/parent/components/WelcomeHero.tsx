"use client";
import Link from "next/link";

interface WelcomeHeroProps {
  userName: string;
  unreadCount: number;
  lastVisit: string | null;
}

export function WelcomeHero({ userName, unreadCount, lastVisit }: WelcomeHeroProps) {
  const hour = new Date().getHours();
  const firstName = userName?.split(" ")[0] || "";

  let greeting: string;
  let emoji: string;
  let subtext: string;

  if (hour >= 5 && hour < 12) {
    greeting = `Good morning, ${firstName}`;
    emoji = "☀️";
    subtext = "Here's how your family is doing today.";
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good afternoon, ${firstName}`;
    emoji = "🌤️";
    subtext = "Let's check in on today's progress.";
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good evening, ${firstName}`;
    emoji = "🌙";
    subtext = "Let's see what happened today.";
  } else {
    greeting = `Hey ${firstName}`;
    emoji = "🌟";
    subtext = "Quick check-in — everything's on track.";
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-2xl p-6 lg:p-8 border border-purple-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">
            {greeting} {emoji}
          </h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">{subtext}</p>
        </div>
        {unreadCount > 0 && (
          <Link href="/dashboard/parent/inbox"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition flex-shrink-0">
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            items need attention
          </Link>
        )}
      </div>
    </div>
  );
}
