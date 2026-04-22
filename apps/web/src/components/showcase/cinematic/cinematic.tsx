"use client";

import { useState, useEffect } from "react";

/* ============================================================
   SHARED ATMOSPHERIC PRIMITIVES — Pixar-feel layered illustrations
   ============================================================ */

export function Sora({
  size = 220,
  pose = "calm",
  glow = "#FFE9A8",
}: {
  size?: number;
  pose?: "calm" | "curious" | "joyful";
  glow?: string;
}) {
  // Sora — a small luminous owl-cat creature. Round, soft, no sharp edges.
  // Belly glows. Big closed-arc eyes (predictable, low-eye-contact-pressure).
  const eyeArc =
    pose === "joyful"
      ? "M 0 0 q 14 -16 28 0"
      : pose === "curious"
      ? "M 0 0 q 14 -10 28 0"
      : "M 0 0 q 14 -8 28 0";

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} style={{ filter: "drop-shadow(0 14px 28px rgba(40, 30, 70, 0.45))" }}>
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#7A6FA8" />
          <stop offset="60%" stopColor="#4D4378" />
          <stop offset="100%" stopColor="#2A2349" />
        </radialGradient>
        <radialGradient id="bellyGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity="1" />
          <stop offset="50%" stopColor={glow} stopOpacity="0.65" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* halo */}
      <circle cx="120" cy="130" r="115" fill="url(#haloGrad)">
        <animate attributeName="r" values="110;120;110" dur="6s" repeatCount="indefinite" />
      </circle>

      {/* body */}
      <ellipse cx="120" cy="145" rx="78" ry="80" fill="url(#bodyGrad)" />

      {/* belly glow */}
      <ellipse cx="120" cy="160" rx="46" ry="50" fill="url(#bellyGrad)">
        <animate attributeName="rx" values="44;48;44" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* ear tufts */}
      <path d="M 60 80 Q 50 50 75 60 Q 78 75 70 88 Z" fill="#3A325C" />
      <path d="M 180 80 Q 190 50 165 60 Q 162 75 170 88 Z" fill="#3A325C" />

      {/* face — top arc */}
      <path d="M 70 120 Q 120 85 170 120 Q 165 145 120 145 Q 75 145 70 120 Z" fill="#5C5187" opacity="0.45" />

      {/* eyes — closed arcs, predictable, calm */}
      <g stroke="#FFF8E2" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d={eyeArc} transform="translate(78,128)" />
        <path d={eyeArc} transform="translate(134,128)" />
      </g>

      {/* tiny beak */}
      <path d="M 116 148 Q 120 156 124 148 Z" fill={glow} opacity="0.85" />

      {/* feet */}
      <ellipse cx="100" cy="222" rx="14" ry="6" fill="#2A2349" />
      <ellipse cx="140" cy="222" rx="14" ry="6" fill="#2A2349" />

      {/* breathing — gentle scale */}
      <animateTransform attributeName="transform" type="scale" values="1;1.012;1" dur="5s" repeatCount="indefinite" additive="sum" />
    </svg>
  );
}

/* Soft floating particles (fireflies / motes / sparks) */
export function Particles({
  count = 18,
  color = "#FFE9A8",
  area = { w: 1280, h: 720 },
  speed = "slow",
}: {
  count?: number;
  color?: string;
  area?: { w: number; h: number };
  speed?: "slow" | "med";
}) {
  const dots = Array.from({ length: count }).map((_, i) => {
    const cx = (i * 137) % area.w;
    const cy = ((i * 53) % area.h) + 40;
    const r = 1.5 + ((i * 7) % 30) / 10;
    const dur = (speed === "slow" ? 8 : 5) + (i % 5);
    const dy = 30 + (i % 4) * 14;
    return (
      <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.55 + ((i % 5) / 10)}>
        <animate attributeName="cy" values={`${cy};${cy - dy};${cy}`} dur={`${dur}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${dur}s`} repeatCount="indefinite" />
      </circle>
    );
  });
  return (
    <svg
      viewBox={`0 0 ${area.w} ${area.h}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      preserveAspectRatio="none"
    >
      {dots}
    </svg>
  );
}

/* Layered hill silhouettes for parallax depth */
export function Hills({ palette }: { palette: string[] }) {
  return (
    <svg
      viewBox="0 0 1280 400"
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "60%", pointerEvents: "none" }}
    >
      <path d="M 0 280 C 200 220 360 320 540 240 C 700 170 880 290 1040 230 C 1180 180 1280 230 1280 230 L 1280 400 L 0 400 Z" fill={palette[0]} opacity="0.55" />
      <path d="M 0 320 C 220 270 380 360 580 290 C 760 230 920 340 1100 280 C 1200 250 1280 280 1280 280 L 1280 400 L 0 400 Z" fill={palette[1]} opacity="0.75" />
      <path d="M 0 360 C 260 320 420 390 640 350 C 820 320 1000 380 1180 350 C 1240 340 1280 350 1280 350 L 1280 400 L 0 400 Z" fill={palette[2]} />
    </svg>
  );
}

/* Lake reflection (gentle ripple) */
export function Lake({ tint = "#3D2F5C" }: { tint?: string }) {
  return (
    <svg viewBox="0 0 1280 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "28%" }}>
      <defs>
        <linearGradient id="lakeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0F0820" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1280" height="200" fill="url(#lakeGrad)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse key={i} cx={200 + i * 180} cy={40 + i * 15} rx={120} ry={2} fill="#FFE9A8" opacity={0.18}>
          <animate attributeName="opacity" values="0.05;0.22;0.05" dur={`${5 + i}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
    </svg>
  );
}

/* Rising lanterns for celebrate scene */
export function Lanterns({ count = 8 }: { count?: number }) {
  const items = Array.from({ length: count }).map((_, i) => {
    const left = 8 + ((i * 13) % 80);
    const delay = i * 1.4;
    const dur = 18 + (i % 5);
    const size = 18 + (i % 4) * 6;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${left}%`,
          bottom: "-60px",
          width: size,
          height: size * 1.2,
          animation: `lantern-rise ${dur}s ${delay}s linear infinite`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at 50% 40%, #FFE0A8, #E89A52 55%, #8C4A1A)",
            borderRadius: "45% 45% 50% 50%",
            boxShadow: "0 0 24px 6px rgba(255, 200, 120, 0.55)",
          }}
        />
      </div>
    );
  });
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>{items}</div>;
}

/* Pebble button — soft, glowing, organic shape (not a flat rectangle) */
export function PebbleButton({
  children,
  primary = false,
  onClick,
  glow = "#FFE9A8",
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  glow?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        appearance: "none",
        border: "none",
        cursor: "pointer",
        padding: "20px 36px",
        minHeight: 64,
        borderRadius: "32px 36px 28px 34px",
        fontFamily: "'Fraunces', 'Iowan Old Style', Georgia, serif",
        fontSize: 19,
        fontWeight: 500,
        letterSpacing: "0.005em",
        color: primary ? "#1A1233" : "#F4ECD9",
        background: primary
          ? `radial-gradient(circle at 30% 30%, #FFE9A8, #E8B66F 65%, #A87838)`
          : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), rgba(255,255,255,0.04) 60%, rgba(0,0,0,0.25))`,
        boxShadow: hover
          ? `0 0 0 4px rgba(255, 233, 168, 0.25), 0 16px 32px rgba(0, 0, 0, 0.45), inset 0 -3px 8px rgba(0,0,0,0.18)`
          : `0 10px 22px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0,0,0,0.18)`,
        transition: "transform 480ms cubic-bezier(.2,.8,.2,1), box-shadow 480ms",
        transform: hover ? "translateY(-2px) scale(1.015)" : "translateY(0) scale(1)",
        backdropFilter: primary ? "none" : "blur(6px)",
      }}
    >
      {children}
      {primary && (
        <span
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "inherit",
            background: `radial-gradient(circle, ${glow}40, transparent 60%)`,
            zIndex: -1,
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
}

/* Speech parchment for character dialogue */
export function SoraSpeech({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        background: "rgba(255, 248, 226, 0.92)",
        color: "#2A2349",
        padding: "16px 22px",
        borderRadius: "22px 22px 22px 6px",
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: 18,
        lineHeight: 1.5,
        fontStyle: "italic",
        maxWidth: 360,
        boxShadow: "0 12px 28px rgba(20, 10, 40, 0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </div>
  );
}

/* Tiny trailhead label for the variant banner */
export function SceneFrame({
  step,
  storyLabel,
  children,
}: {
  step: string;
  storyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", color: "#F4ECD9", fontFamily: "'Fraunces', Georgia, serif" }}>
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 28,
          right: 28,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(244, 236, 217, 0.7)",
          pointerEvents: "none",
        }}
      >
        <span>AIVO · Stillwater</span>
        <span>{step} — {storyLabel}</span>
      </div>
      <style>{`
        @keyframes lantern-rise {
          0%   { transform: translate(0, 0) rotate(-2deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.9; }
          100% { transform: translate(40px, -120vh) rotate(3deg); opacity: 0; }
        }
        @keyframes float-soft { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes drift { 0% { transform: translate(0,0); } 50% { transform: translate(8px,-6px); } 100% { transform: translate(0,0); } }
      `}</style>
      {children}
    </div>
  );
}

/* ============================================================
   SCENE 1 — ARRIVE  ("Soft dawn at the lake")
   Usability story beat: predictable, low-stim welcome. Same character
   greets you. Three calm choices, no overwhelm, no notifications.
   ============================================================ */

export function SceneArrive() {
  return (
    <SceneFrame step="Scene 01" storyLabel="arriving">
      {/* sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #1B1438 0%, #3A2A5C 28%, #6E4A7A 55%, #C18B85 78%, #F2C8A0 100%)",
        }}
      />
      {/* stars */}
      <Particles count={30} color="#FFF6D8" area={{ w: 1280, h: 1100 }} speed="slow" />

      {/* hills */}
      <Hills palette={["#1A0F2E", "#2A1A45", "#0E0820"]} />

      {/* lake */}
      <Lake tint="#1A0F2E" />

      {/* moon */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 140,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #FFF8E2, #F5DCA8 60%, #C9A26E)",
          boxShadow: "0 0 60px 20px rgba(255, 232, 168, 0.35)",
          animation: "pulse-glow 8s ease-in-out infinite",
        }}
      />

      {/* Sora on a stone */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "26%",
          transform: "translateX(-50%)",
          animation: "float-soft 6s ease-in-out infinite",
        }}
      >
        <Sora size={260} pose="calm" />
        {/* stone */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -28,
            transform: "translateX(-50%)",
            width: 220,
            height: 36,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 30%, #4A3A6E, #1A0F2E)",
            boxShadow: "0 14px 32px rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Speech */}
      <div style={{ position: "absolute", left: "calc(50% + 130px)", bottom: "44%" }}>
        <SoraSpeech>It&apos;s quiet here, Jamie. I&apos;ve been waiting for you.</SoraSpeech>
      </div>

      {/* Bottom UI overlay — soft glass */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "32px 48px 56px",
          background: "linear-gradient(180deg, transparent, rgba(15, 8, 32, 0.6) 35%, rgba(15, 8, 32, 0.85))",
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 13,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(244, 236, 217, 0.6)",
            marginBottom: 8,
          }}
        >
          a calm place · today is tuesday
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontSize: 42,
            letterSpacing: "-0.01em",
            margin: "0 0 28px 0",
            color: "#F4ECD9",
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          Welcome back, Jamie.
        </h1>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <PebbleButton primary>Continue our story</PebbleButton>
          <PebbleButton>Try something gentle</PebbleButton>
          <PebbleButton>Just look around</PebbleButton>
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 15,
            color: "rgba(244, 236, 217, 0.55)",
            fontStyle: "italic",
          }}
        >
          Nothing has changed since you last visited. There are no surprises waiting.
        </div>
      </div>
    </SceneFrame>
  );
}

/* ============================================================
   SCENE 2 — EXPLORE  ("Inside the firefly garden")
   Same character, now beside the learner. Lesson IS a place,
   not a screen. AI tutor reasoning lives on a parchment scroll.
   ============================================================ */

export function SceneExplore() {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [caught, setCaught] = useState(3);
  const [flies, setFlies] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: 18 + ((i * 13) % 64),
      y: 30 + ((i * 7) % 30),
    }));
    setFlies(arr);
  }, []);

  const catchFly = (id: number) => {
    setFlies((f) => f.filter((x) => x.id !== id));
    setCaught((c) => c + 1);
  };

  return (
    <SceneFrame step="Scene 02" storyLabel="inside a lesson">
      {/* deeper twilight garden sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #1B0F35 0%, #2E1850 38%, #4F2D6A 65%, #6A3A5C 100%)",
        }}
      />
      <Particles count={22} color="#FFD89A" area={{ w: 1280, h: 1100 }} />

      {/* glowing plants — silhouettes with edge glow */}
      <svg viewBox="0 0 1280 600" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "55%" }}>
        <defs>
          <radialGradient id="plantGlow" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#FFA86B" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFA86B" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[100, 320, 580, 820, 1080].map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={500} rx={140} ry={70} fill="url(#plantGlow)" />
            <path
              d={`M ${x} 600 Q ${x - 30} 450 ${x - 50} 380 Q ${x - 10} 360 ${x} 380 Q ${x + 10} 360 ${x + 50} 380 Q ${x + 30} 450 ${x} 600 Z`}
              fill="#1A0E2E"
            />
            <circle cx={x} cy={380} r={8} fill="#FFE0A0">
              <animate attributeName="opacity" values="0.5;1;0.5" dur={`${3 + i}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>

      {/* fireflies you can catch */}
      {flies.map((f) => (
        <button
          key={f.id}
          onClick={() => catchFly(f.id)}
          aria-label="catch firefly"
          style={{
            position: "absolute",
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "radial-gradient(circle, #FFF4C0, #FFB060 55%, transparent 70%)",
            boxShadow: "0 0 28px 8px rgba(255, 200, 100, 0.55)",
            cursor: "pointer",
            animation: `drift ${4 + (f.id % 3)}s ease-in-out infinite`,
            zIndex: 5,
          }}
        />
      ))}

      {/* Sora — small, beside you, lower-left */}
      <div style={{ position: "absolute", left: 60, bottom: 200, animation: "float-soft 7s ease-in-out infinite", zIndex: 10 }}>
        <Sora size={180} pose="curious" glow="#FFD89A" />
      </div>
      <div style={{ position: "absolute", left: 240, bottom: 320, zIndex: 10 }}>
        <SoraSpeech>
          You have <strong>{caught}</strong> in the jar. Can you find one more?
        </SoraSpeech>
      </div>

      {/* Jar — bottom right, fills as you catch */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 180,
          width: 140,
          height: 180,
          borderRadius: "12px 12px 28px 28px",
          background: "linear-gradient(180deg, rgba(255,248,226,0.08), rgba(255,248,226,0.18))",
          border: "2px solid rgba(255, 232, 168, 0.4)",
          backdropFilter: "blur(4px)",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${Math.min(100, caught * 12)}%`,
            background: "linear-gradient(180deg, rgba(255, 200, 100, 0.4), rgba(255, 160, 60, 0.7))",
            transition: "height 800ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
        {Array.from({ length: caught }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${15 + ((i * 23) % 70)}%`,
              bottom: `${10 + ((i * 17) % 50)}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "radial-gradient(circle, #FFF4C0, #FFB060)",
              boxShadow: "0 0 12px 3px rgba(255, 200, 100, 0.6)",
              animation: `drift ${3 + (i % 3)}s ease-in-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: -22,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "#F4ECD9",
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "'Fraunces', Georgia, serif",
            opacity: 0.7,
          }}
        >
          {caught} of 8 fireflies
        </div>
      </div>

      {/* Top-right — Comfort moon */}
      <button
        aria-label="comfort settings"
        style={{
          position: "absolute",
          top: 28,
          right: 120,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(255, 248, 226, 0.3)",
          background: "radial-gradient(circle at 35% 35%, #FFF4D8, #C9A26E)",
          cursor: "pointer",
          boxShadow: "0 0 28px 6px rgba(255, 232, 168, 0.35)",
          zIndex: 30,
        }}
        title="Comfort"
      />

      {/* Why-this parchment scroll */}
      <div style={{ position: "absolute", left: 60, top: 100, maxWidth: 360, zIndex: 20 }}>
        <button
          onClick={() => setReasoningOpen((x) => !x)}
          style={{
            background: "rgba(255, 248, 226, 0.92)",
            color: "#3A2A5C",
            border: "none",
            padding: "12px 20px",
            borderRadius: "20px 20px 6px 20px",
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16,
            fontStyle: "italic",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(20, 10, 40, 0.4)",
          }}
        >
          {reasoningOpen ? "Close the note" : "Why are we here?"}
        </button>
        {reasoningOpen && (
          <div
            style={{
              marginTop: 10,
              background: "linear-gradient(180deg, #FFF8E2, #F5E6BE)",
              color: "#2A2349",
              padding: "20px 22px",
              borderRadius: "4px 24px 4px 24px",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 16,
              lineHeight: 1.55,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              borderLeft: "4px solid #C9A26E",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>From Sora&apos;s notebook</div>
            Last week you liked counting things you could see. Eight is a number we are practicing.
            We are in the garden because it is dark and the fireflies are easy to spot.
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
              You can ask me to choose differently any time.
            </div>
          </div>
        )}
      </div>
    </SceneFrame>
  );
}

/* ============================================================
   SCENE 3 — CELEBRATE  ("Lanterns on the lake")
   Soft, calm celebration. No confetti, no points popup.
   Two gentle choices: rest or one more.
   ============================================================ */

export function SceneCelebrate() {
  return (
    <SceneFrame step="Scene 03" storyLabel="a calm goodbye">
      {/* night sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0E0820 0%, #1B1245 40%, #2C1A4F 70%, #4A2350 100%)",
        }}
      />
      <Particles count={40} color="#FFF6D8" area={{ w: 1280, h: 1200 }} speed="slow" />

      {/* lanterns rising */}
      <Lanterns count={14} />

      {/* hills */}
      <Hills palette={["#0E0820", "#1A0F2E", "#080414"]} />

      {/* lake */}
      <Lake tint="#0E0820" />

      {/* Sora — center, holding a lantern */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "32%",
          transform: "translateX(-50%)",
          animation: "float-soft 6s ease-in-out infinite",
          zIndex: 10,
        }}
      >
        <Sora size={240} pose="joyful" glow="#FFC68A" />
        {/* lantern in hand */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -40,
            transform: "translateX(-50%)",
            width: 36,
            height: 44,
            background: "radial-gradient(circle at 50% 40%, #FFE0A8, #E89A52 60%, #8C4A1A)",
            borderRadius: "45% 45% 50% 50%",
            boxShadow: "0 0 30px 10px rgba(255, 200, 120, 0.6)",
            animation: "pulse-glow 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Big calm card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 60,
          transform: "translateX(-50%)",
          width: "min(640px, 90%)",
          padding: "36px 40px",
          background: "rgba(255, 248, 226, 0.96)",
          color: "#2A2349",
          borderRadius: 28,
          textAlign: "center",
          boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 13,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#7A6FA8",
            marginBottom: 10,
          }}
        >
          you stayed with us
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontSize: 30,
            margin: "0 0 14px 0",
            lineHeight: 1.25,
          }}
        >
          You found <strong>8 fireflies</strong>. <br />
          One flew away — and you stayed calm. That was brave.
        </h2>
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16,
            fontStyle: "italic",
            color: "#5C5187",
            marginBottom: 26,
            lineHeight: 1.5,
          }}
        >
          Sora will remember this. Tomorrow we can try the same garden, or somewhere new.
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <PebbleButton>Rest now</PebbleButton>
          <PebbleButton primary>One more, gently</PebbleButton>
        </div>
      </div>
    </SceneFrame>
  );
}
