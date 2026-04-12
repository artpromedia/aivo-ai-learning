"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  PARENT: "/dashboard/parent",
  LEARNER: "/dashboard/learner",
  TEACHER: "/dashboard/teacher",
  CAREGIVER: "/dashboard/caregiver",
  THERAPIST: "/dashboard/therapist",
  PLATFORM_ADMIN: "/dashboard/admin",
  DISTRICT_ADMIN: "/dashboard/admin",
};

const TUTORS = [
  {
    name: "Nova",
    domain: "Mathematics",
    color: "#7C3AED",
    bg: "from-violet-500 to-purple-600",
    tagline: "Numbers come alive with Nova.",
    bullets: [
      "Adaptive problem sets that grow with the learner",
      "Visual math manipulatives for hands-on discovery",
      "Real-time hint system with multiple approaches",
    ],
    img: "/images/tutors/nova.png",
  },
  {
    name: "Sage",
    domain: "English Language Arts",
    color: "#10B981",
    bg: "from-emerald-500 to-green-600",
    tagline: "Every child has a story worth telling.",
    bullets: [
      "Turns reading comprehension into detective work",
      "Writing workshops with encouraging, constructive feedback",
      "Vocabulary building woven naturally into engaging stories",
    ],
    img: "/images/tutors/sage.png",
  },
  {
    name: "Spark",
    domain: "Science",
    color: "#F59E0B",
    bg: "from-amber-400 to-orange-500",
    tagline: "Curiosity is the best experiment.",
    bullets: [
      "Interactive virtual labs and simulations",
      "Guided scientific method explorations",
      "Connects concepts to real-world phenomena",
    ],
    img: "/images/tutors/spark.png",
  },
  {
    name: "Chrono",
    domain: "History & Social Studies",
    color: "#6366F1",
    bg: "from-indigo-500 to-blue-600",
    tagline: "Travel through time, one lesson at a time.",
    bullets: [
      "Immersive timeline-based adventures",
      "Primary source analysis made engaging",
      "Cultural perspectives and critical thinking",
    ],
    img: "/images/tutors/chrono.png",
  },
  {
    name: "Pixel",
    domain: "Coding & Technology",
    color: "#06B6D4",
    bg: "from-cyan-500 to-teal-600",
    tagline: "Build the future, one block at a time.",
    bullets: [
      "Block-based to text-based coding progression",
      "Game design and interactive project creation",
      "Computational thinking across subjects",
    ],
    img: "/images/tutors/pixel.png",
  },
  {
    name: "Echo",
    domain: "Speech & Communication",
    color: "#EC4899",
    bg: "from-pink-500 to-rose-600",
    tagline: "Find your voice, at your own pace.",
    bullets: [
      "AAC-integrated communication support",
      "Speech pattern recognition and coaching",
      "Social communication scenario practice",
    ],
    img: "/images/tutors/echo.png",
  },
  {
    name: "Harmony",
    domain: "Social-Emotional Learning",
    color: "#8B5CF6",
    bg: "from-violet-400 to-purple-500",
    tagline: "Feelings are superpowers when you understand them.",
    bullets: [
      "Emotion recognition and regulation tools",
      "Guided mindfulness and calming exercises",
      "Social scenario role-playing and reflection",
    ],
    img: "/images/tutors/harmony.png",
  },
  {
    name: "Atlas",
    domain: "Geography & World Studies",
    color: "#14B8A6",
    bg: "from-teal-500 to-emerald-600",
    tagline: "Explore every corner of the world.",
    bullets: [
      "Interactive map-based learning journeys",
      "Cultural exploration and global awareness",
      "Climate, ecology, and human geography",
    ],
    img: "/images/tutors/atlas.png",
  },
  {
    name: "Cadence",
    domain: "Music & Rhythm",
    color: "#D946EF",
    bg: "from-fuchsia-500 to-pink-600",
    tagline: "Every learner has a rhythm inside.",
    bullets: [
      "Rhythm and beat pattern recognition",
      "Music theory through playful composition",
      "Sensory-friendly audio experiences",
    ],
    img: "/images/tutors/cadence.png",
  },
  {
    name: "Vigor",
    domain: "Physical Education & Wellness",
    color: "#22C55E",
    bg: "from-green-500 to-lime-600",
    tagline: "Move, play, and grow stronger.",
    bullets: [
      "Adaptive movement and exercise routines",
      "Motor skills development activities",
      "Health and wellness habit building",
    ],
    img: "/images/tutors/vigor.png",
  },
  {
    name: "Lingua",
    domain: "World Languages",
    color: "#EF4444",
    bg: "from-red-500 to-rose-600",
    tagline: "Open doors with every new word.",
    bullets: [
      "Immersive language learning environments",
      "Speech recognition and pronunciation practice",
      "Cultural context integrated into every lesson",
    ],
    img: "/images/tutors/lingua.png",
  },
  {
    name: "Forge",
    domain: "STEM & Engineering",
    color: "#92400E",
    bg: "from-amber-700 to-yellow-800",
    tagline: "Design, build, and engineer the future.",
    bullets: [
      "Hands-on engineering design challenges",
      "Iterative prototyping and testing cycles",
      "Math, science, and technology integration",
    ],
    img: "/images/tutors/forge.png",
  },
  {
    name: "Compass",
    domain: "Executive Function & Life Skills",
    color: "#1E40AF",
    bg: "from-blue-700 to-indigo-800",
    tagline: "Navigate life with confidence.",
    bullets: [
      "Time management and planning practice",
      "Decision-making and problem-solving skills",
      "Self-advocacy and independence building",
    ],
    img: "/images/tutors/compass.png",
  },
  {
    name: "Muse",
    domain: "Creative Arts & Expression",
    color: "#A855F7",
    bg: "from-purple-500 to-fuchsia-600",
    tagline: "Create without limits.",
    bullets: [
      "Digital art tools and guided drawing",
      "Creative expression across mediums",
      "Art history and appreciation adventures",
    ],
    img: "/images/tutors/muse.png",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const scrollY = useParallax();
  const [activeTutor, setActiveTutor] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push(ROLE_DASHBOARDS[user.role] || "/dashboard/parent");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveTutor((prev) => (prev + 1) % TUTORS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveTutor(index);
    setIsAutoPlaying(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), 15000);
  }, []);

  const toggleAutoPlay = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsAutoPlaying((prev) => !prev);
  }, []);

  const goPrev = useCallback(() => {
    goTo((activeTutor - 1 + TUTORS.length) % TUTORS.length);
  }, [activeTutor, goTo]);

  const goNext = useCallback(() => {
    goTo((activeTutor + 1) % TUTORS.length);
  }, [activeTutor, goTo]);

  const getOffset = (index: number) => {
    const diff = index - activeTutor;
    const len = TUTORS.length;
    if (diff === 0) return 0;
    if (diff === 1 || diff === -(len - 1)) return 1;
    if (diff === -1 || diff === len - 1) return -1;
    if (diff === 2 || diff === -(len - 2)) return 2;
    if (diff === -2 || diff === len - 2) return -2;
    return diff > 0 ? 3 : -3;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50">
        <div className="animate-pulse">
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={200} height={60} priority />
        </div>
      </div>
    );
  }

  const current = TUTORS[activeTutor];

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
        <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={140} height={42} priority />
        <nav className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2 rounded-lg text-slate-600 font-semibold hover:text-primary transition">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200">
            Get Started
          </Link>
        </nav>
      </header>

      <main>
        <section className="max-w-5xl mx-auto px-8 pt-20 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
            <div className="absolute -top-10 -right-32 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl" style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
            <div className="absolute top-40 left-1/2 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
          </div>
          <div className="text-center space-y-6 relative z-10" style={{ transform: `translateY(${scrollY * -0.12}px)` }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">The adaptive learning platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-heading font-bold text-slate-900 leading-tight tracking-tight">
              Learning adventures
              <br />
              <span className="text-primary">for every mind</span>
            </h1>

            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed" style={{ transform: `translateY(${scrollY * 0.03}px)` }}>
              AIVO meets each learner where they are, from standard curriculum to
              pre-symbolic communication, with 14 AI tutors and brain-clone
              technology that truly adapts.
            </p>

            <div className="flex gap-4 justify-center pt-2">
              <Link href="/signup" className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-bold text-lg hover:bg-primary-dark transition shadow-xl shadow-purple-200">
                Start Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/login" className="px-8 py-3.5 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-primary hover:text-primary transition">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-8 pb-20" style={{ transform: `translateY(${Math.max(0, scrollY - 200) * -0.05}px)` }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎮",
                title: "5 Functioning Levels",
                desc: "From standard academics to pre-symbolic cause-and-effect, every child has a path.",
                bg: "bg-purple-50",
                border: "border-purple-100",
                iconBg: "bg-purple-100",
              },
              {
                icon: "🤖",
                title: "14 AI Tutors",
                desc: "Seven core tutors plus seven specialists covering every learning domain.",
                bg: "bg-cyan-50",
                border: "border-cyan-100",
                iconBg: "bg-cyan-100",
              },
              {
                icon: "🧠",
                title: "Brain Clone",
                desc: "An adaptive brain state that evolves with each learner, with snapshots and rollback.",
                bg: "bg-amber-50",
                border: "border-amber-100",
                iconBg: "bg-amber-100",
              },
            ].map((f) => (
              <div key={f.title} className={`${f.bg} border ${f.border} rounded-2xl p-8 space-y-4 hover:shadow-lg transition`}>
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 30%, #f0f9ff 70%, #f8fafc 100%)" }}>
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
                Meet Your AI Learning Team
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Fourteen specialized AI tutors, each with a unique personality and teaching style designed to make every subject engaging and fun.
              </p>
            </div>

            <div className="relative h-[520px] md:h-[560px]">
              <button
                onClick={goPrev}
                className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                aria-label="Previous tutor"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
                aria-label="Next tutor"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                {TUTORS.map((tutor, index) => {
                  const offset = getOffset(index);
                  const isCenter = offset === 0;
                  const isAdjacent = Math.abs(offset) === 1;
                  const isOuter = Math.abs(offset) === 2;
                  const isHidden = Math.abs(offset) >= 3;

                  if (isHidden) return null;

                  const translateX = isCenter ? 0 : offset * (isAdjacent ? 280 : 420);
                  const scale = isCenter ? 1 : isAdjacent ? 0.75 : 0.55;
                  const zIndex = isCenter ? 20 : isAdjacent ? 10 : 5;
                  const opacity = isCenter ? 1 : isAdjacent ? 0.7 : 0.4;

                  return (
                    <button
                      key={tutor.name}
                      onClick={() => !isCenter && goTo(index)}
                      className="absolute transition-all duration-700 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300 rounded-3xl"
                      style={{
                        transform: `translateX(${translateX}px) scale(${scale})`,
                        zIndex,
                        opacity,
                        cursor: isCenter ? "default" : "pointer",
                      }}
                      aria-label={isCenter ? `${tutor.name}, ${tutor.domain} - currently selected` : `View ${tutor.name}, ${tutor.domain}`}
                      tabIndex={isCenter ? -1 : 0}
                    >
                      <div
                        className={`w-[260px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${tutor.bg}`}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div className="relative h-[340px] overflow-hidden">
                          <Image
                            src={tutor.img}
                            alt={`${tutor.name} - ${tutor.domain} tutor`}
                            fill
                            className="object-cover object-top"
                            sizes="260px"
                            priority={isCenter}
                            loading={isCenter ? "eager" : "lazy"}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-left">
                            <p className="text-white font-heading font-bold text-xl">{tutor.name}</p>
                            <p className="text-white/80 text-sm">{tutor.domain}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* center detail panel */}
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[340px] z-25 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-100 pointer-events-auto">
                  <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: current.color }}>
                    {current.domain}
                  </p>
                  <h3 className="text-3xl font-heading font-bold text-slate-900 mb-2">{current.name}</h3>
                  <p className="text-base italic mb-4" style={{ color: current.color }}>
                    {current.tagline}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {current.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: current.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="block w-full py-3 rounded-full text-white font-bold transition hover:opacity-90 shadow-lg text-center"
                    style={{ backgroundColor: current.color }}
                  >
                    Learn with {current.name}
                  </Link>
                </div>
              </div>

              {/* mobile detail card */}
              <div className="md:hidden absolute bottom-0 left-0 right-0 z-25">
                <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl p-6 shadow-xl border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: current.color }}>{current.domain}</p>
                      <h3 className="text-xl font-heading font-bold text-slate-900">{current.name}</h3>
                    </div>
                    <Link
                      href="/signup"
                      className="px-4 py-2 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: current.color }}
                    >
                      Learn
                    </Link>
                  </div>
                  <p className="text-sm italic" style={{ color: current.color }}>{current.tagline}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={toggleAutoPlay}
                className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition mr-2"
                aria-label={isAutoPlaying ? "Pause carousel" : "Play carousel"}
              >
                {isAutoPlaying ? (
                  <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              {TUTORS.map((tutor, i) => (
                <button
                  key={tutor.name}
                  onClick={() => goTo(i)}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === activeTutor ? tutor.color : "#CBD5E1",
                    transform: i === activeTutor ? "scale(1.3)" : "scale(1)",
                  }}
                  aria-label={`Go to ${tutor.name}`}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p className="font-body">AIVO Learning Platform | AI-Powered Adaptive Learning for Every Child</p>
      </footer>
    </div>
  );
}
