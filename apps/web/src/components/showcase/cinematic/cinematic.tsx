"use client";

import { useState, useEffect } from "react";

/* ============================================================
   PALETTE — soft daylight, ND-friendly warm pastels
   Backgrounds are cream/sky/peach, never near-black.
   Text is warm dark plum (#3D3050), never pure black.
   ============================================================ */
/* AIVO brand alignment — primary #7C3AED violet, accent #FFB700 gold,
   text #292F3D, fonts Fredoka (display) + Nunito (body). */
const C = {
  cream: "#FFFAEF",
  creamSoft: "#FBF1DE",
  sky: "#EDE3FE",
  skyDeep: "#7BC2E5",
  mint: "#EDE3FE",
  mintDeep: "#C4B0F0",
  peach: "#F8C4A0",
  peachDeep: "#EFA47A",
  coral: "#7C3AED",
  butter: "#FFB700",
  lavender: "#E5DBF5",
  text: "#292F3D",
  textSoft: "#5C5067",
  textWhisper: "#9189A1",
  cardBg: "#FFFCF4",
  shadowSoft: "rgba(124, 58, 237, 0.18)",
};

const FONT = "'Nunito', 'Lexend', system-ui, sans-serif";
const FONT_DISPLAY = "'Fredoka', 'Nunito', system-ui, sans-serif";

/* ============================================================
   CHARACTER — Sora, a round friendly creature.
   Peach body, mint belly, big closed-smile eyes (no eye contact pressure).
   Always smiling. Always soft.
   ============================================================ */
export function Sora({
  size = 240,
  pose = "calm",
}: {
  size?: number;
  pose?: "calm" | "curious" | "joyful";
}) {
  // closed-smile eyes — same friendly expression always; "joyful" arcs more
  const eyeArc =
    pose === "joyful"
      ? "M 0 6 Q 12 -8 24 6"
      : pose === "curious"
      ? "M 0 4 Q 12 -6 24 4"
      : "M 0 4 Q 12 -4 24 4";

  return (
    <svg viewBox="0 0 240 260" width={size} height={size * (260 / 240)} style={{ filter: `drop-shadow(0 18px 24px ${C.shadowSoft})` }}>
      <defs>
        <radialGradient id="bodyGrad" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFD9BE" />
          <stop offset="55%" stopColor={C.peach} />
          <stop offset="100%" stopColor={C.peachDeep} />
        </radialGradient>
        <radialGradient id="bellyGrad" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#E8F8EE" />
          <stop offset="65%" stopColor={C.mint} />
          <stop offset="100%" stopColor={C.mintDeep} />
        </radialGradient>
        <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB89A" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFB89A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* tiny ear tufts */}
      <path d="M 70 90 Q 60 60 88 72 Q 90 86 82 96 Z" fill={C.peachDeep} />
      <path d="M 170 90 Q 180 60 152 72 Q 150 86 158 96 Z" fill={C.peachDeep} />

      {/* round body */}
      <ellipse cx="120" cy="155" rx="88" ry="88" fill="url(#bodyGrad)" />

      {/* belly */}
      <ellipse cx="120" cy="175" rx="58" ry="58" fill="url(#bellyGrad)" />

      {/* cheeks */}
      <ellipse cx="76" cy="160" rx="18" ry="14" fill="url(#cheekGrad)" />
      <ellipse cx="164" cy="160" rx="18" ry="14" fill="url(#cheekGrad)" />

      {/* eyes — always closed-smile, predictable, calm */}
      <g stroke={C.text} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d={eyeArc} transform="translate(80,134)" />
        <path d={eyeArc} transform="translate(136,134)" />
      </g>

      {/* small smile */}
      <path d="M 108 168 Q 120 178 132 168" stroke={C.text} strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* feet */}
      <ellipse cx="98" cy="240" rx="18" ry="8" fill={C.peachDeep} />
      <ellipse cx="142" cy="240" rx="18" ry="8" fill={C.peachDeep} />

      {/* gentle breathing */}
      <animateTransform attributeName="transform" type="scale" values="1;1.018;1" dur="5s" repeatCount="indefinite" additive="sum" />
    </svg>
  );
}

/* Soft floating motes — tiny pollen specks, not stars */
export function FloatingMotes({ count = 14 }: { count?: number }) {
  const dots = Array.from({ length: count }).map((_, i) => {
    const cx = (i * 137) % 1280;
    const cy = ((i * 53) % 600) + 60;
    const r = 2 + ((i * 7) % 30) / 12;
    const dur = 9 + (i % 6);
    const dy = 30 + (i % 4) * 18;
    const colors = [C.butter, C.peach, C.mint, "#FFFFFF"];
    const col = colors[i % colors.length];
    return (
      <circle key={i} cx={cx} cy={cy} r={r} fill={col} opacity={0.55}>
        <animate attributeName="cy" values={`${cy};${cy - dy};${cy}`} dur={`${dur}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${dur}s`} repeatCount="indefinite" />
      </circle>
    );
  });
  return (
    <svg viewBox="0 0 1280 720" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {dots}
    </svg>
  );
}

/* Layered rolling hills — soft sage greens */
export function MeadowHills() {
  return (
    <svg viewBox="0 0 1280 400" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "55%", pointerEvents: "none" }}>
      <path d="M 0 280 C 200 220 360 320 540 240 C 700 170 880 290 1040 230 C 1180 180 1280 230 1280 230 L 1280 400 L 0 400 Z" fill={C.mint} opacity="0.85" />
      <path d="M 0 320 C 220 270 380 360 580 290 C 760 230 920 340 1100 280 C 1200 250 1280 280 1280 280 L 1280 400 L 0 400 Z" fill={C.mintDeep} opacity="0.9" />
      <path d="M 0 360 C 260 320 420 390 640 350 C 820 320 1000 380 1180 350 C 1240 340 1280 350 1280 350 L 1280 400 L 0 400 Z" fill="#7FBE9A" />
    </svg>
  );
}

/* Soft sun with gentle ray glow */
export function Sun() {
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        right: 130,
        width: 130,
        height: 130,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #FFFBE2, #FFE3A0 55%, #FFC56B)",
        boxShadow: "0 0 80px 30px rgba(255, 227, 160, 0.55)",
        animation: "soft-pulse 8s ease-in-out infinite",
      }}
    />
  );
}

/* Big rounded sky-and-cream pebble button — friendly candy-piece feel */
export function PebbleButton({
  children,
  primary = false,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        appearance: "none",
        border: "none",
        cursor: "pointer",
        padding: "20px 34px",
        minHeight: 64,
        borderRadius: 32,
        fontFamily: FONT,
        fontSize: 19,
        fontWeight: 600,
        letterSpacing: "0.005em",
        color: primary ? C.text : C.text,
        background: primary
          ? `linear-gradient(180deg, #FFD79A 0%, ${C.peach} 60%, ${C.peachDeep} 100%)`
          : C.cardBg,
        boxShadow: hover
          ? `0 0 0 4px ${primary ? "rgba(248, 196, 160, 0.45)" : "rgba(166, 213, 232, 0.45)"}, 0 14px 28px ${C.shadowSoft}`
          : `0 8px 20px ${C.shadowSoft}, inset 0 -3px 0 rgba(0,0,0,0.06)`,
        transition: "transform 280ms cubic-bezier(.2,.8,.2,1), box-shadow 280ms",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        outline: primary ? "none" : `2px solid ${C.skyDeep}`,
      }}
    >
      {children}
    </button>
  );
}

/* Speech bubble — cream, rounded, NO italics, Lexend */
export function SoraSpeech({ children, tail = "left" }: { children: React.ReactNode; tail?: "left" | "right" }) {
  return (
    <div
      style={{
        position: "relative",
        background: C.cardBg,
        color: C.text,
        padding: "18px 24px",
        borderRadius: tail === "left" ? "24px 24px 24px 6px" : "24px 24px 6px 24px",
        fontFamily: FONT,
        fontSize: 19,
        fontWeight: 500,
        lineHeight: 1.55,
        maxWidth: 380,
        boxShadow: `0 14px 28px ${C.shadowSoft}`,
      }}
    >
      {children}
    </div>
  );
}

/* Scene wrapper — handles font import, base layout, scene chip */
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
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", color: C.text, fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=Lexend:wght@400;500;600&display=swap');
        @keyframes soft-pulse { 0%,100% { transform: scale(1); opacity: 0.95; } 50% { transform: scale(1.03); opacity: 1; } }
        @keyframes float-soft { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes drift { 0% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(10px,-8px) rotate(8deg); } 100% { transform: translate(0,0) rotate(0deg); } }
        @keyframes balloon-rise {
          0%   { transform: translate(0, 0) rotate(-2deg); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translate(40px, -120vh) rotate(3deg); opacity: 0; }
        }
        @keyframes flutter {
          0%   { transform: translate(0,0) rotate(-6deg); }
          50%  { transform: translate(8px,-6px) rotate(6deg); }
          100% { transform: translate(0,0) rotate(-6deg); }
        }
        button:focus-visible { outline: 4px solid ${C.skyDeep}; outline-offset: 3px; }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: 22,
          left: 28,
          right: 28,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.textWhisper,
          pointerEvents: "none",
        }}
      >
        <span>AIVO · Stillwater</span>
        <span>{step} — {storyLabel}</span>
      </div>

      {children}
    </div>
  );
}

/* ============================================================
   SCENE 1 — ARRIVE  ("A soft morning in the meadow")
   ============================================================ */

export function SceneArrive() {
  return (
    <SceneFrame step="Scene 01" storyLabel="arriving">
      {/* sky — soft morning */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${C.sky} 0%, #E2F2F8 38%, ${C.cream} 75%, ${C.creamSoft} 100%)`,
        }}
      />

      {/* sun */}
      <Sun />

      {/* fluffy clouds */}
      <svg viewBox="0 0 1280 500" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "60%", pointerEvents: "none" }}>
        <g fill="#FFFFFF" opacity="0.9">
          <ellipse cx="220" cy="130" rx="60" ry="22" />
          <ellipse cx="260" cy="120" rx="46" ry="20" />
          <ellipse cx="180" cy="140" rx="40" ry="16" />
        </g>
        <g fill="#FFFFFF" opacity="0.85">
          <ellipse cx="900" cy="180" rx="80" ry="26" />
          <ellipse cx="950" cy="170" rx="50" ry="22" />
          <ellipse cx="850" cy="190" rx="46" ry="20" />
        </g>
      </svg>

      {/* motes */}
      <FloatingMotes count={10} />

      {/* hills */}
      <MeadowHills />

      {/* wildflowers across foreground */}
      <svg viewBox="0 0 1280 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "16%", pointerEvents: "none" }}>
        {[60, 180, 320, 480, 600, 760, 900, 1020, 1180].map((x, i) => {
          const colors = [C.coral, C.butter, "#F4A8C7", "#C7B8F2", C.peach];
          const col = colors[i % colors.length];
          return (
            <g key={i}>
              <rect x={x - 1.5} y={120} width={3} height={70} fill="#7FBE9A" />
              <circle cx={x} cy={120} r={9} fill={col} />
              <circle cx={x} cy={120} r={3} fill={C.butter} />
            </g>
          );
        })}
      </svg>

      {/* Sora on a soft hill */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "30%",
          transform: "translateX(-50%)",
          animation: "float-soft 6s ease-in-out infinite",
          zIndex: 5,
        }}
      >
        <Sora size={240} pose="calm" />
      </div>

      {/* speech bubble */}
      <div style={{ position: "absolute", left: "calc(50% + 130px)", bottom: "48%", zIndex: 6 }}>
        <SoraSpeech>Good morning, Jamie. It is calm here. We can take our time.</SoraSpeech>
      </div>

      {/* Bottom UI overlay — cream card on cream background */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "32px 48px 48px",
          background: `linear-gradient(180deg, transparent, ${C.cream} 35%)`,
          zIndex: 8,
        }}
      >
        <div
          style={{
            background: C.cardBg,
            borderRadius: 28,
            padding: "28px 32px",
            boxShadow: `0 18px 40px ${C.shadowSoft}`,
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.textWhisper,
              marginBottom: 8,
            }}
          >
            today is tuesday · a calm day
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: "-0.005em",
              margin: "0 0 22px 0",
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            Welcome back, Jamie.
          </h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <PebbleButton primary>Continue our story</PebbleButton>
            <PebbleButton>Try something gentle</PebbleButton>
            <PebbleButton>Just look around</PebbleButton>
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 500,
              color: C.textSoft,
              lineHeight: 1.5,
            }}
          >
            Nothing has changed since last time. There are no surprises waiting for you.
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}

/* ============================================================
   SCENE 2 — EXPLORE  ("A sunny butterfly garden")
   ============================================================ */

export function SceneExplore() {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [caught, setCaught] = useState(3);
  const [butterflies, setButterflies] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    const palette = [C.coral, "#F4A8C7", "#C7B8F2", C.butter, C.skyDeep];
    const arr = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: 18 + ((i * 13) % 64),
      y: 24 + ((i * 7) % 32),
      color: palette[i % palette.length],
    }));
    setButterflies(arr);
  }, []);

  const catchOne = (id: number) => {
    setButterflies((b) => b.filter((x) => x.id !== id));
    setCaught((c) => c + 1);
  };

  return (
    <SceneFrame step="Scene 02" storyLabel="inside a lesson">
      {/* sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${C.sky} 0%, #E8F4FB 50%, ${C.cream} 100%)`,
        }}
      />
      <Sun />
      <FloatingMotes count={12} />

      {/* meadow ground with flowers */}
      <svg viewBox="0 0 1280 400" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "55%" }}>
        <path d="M 0 200 C 200 160 360 240 540 180 C 700 130 880 220 1040 170 C 1180 130 1280 170 1280 170 L 1280 400 L 0 400 Z" fill={C.mint} opacity="0.85" />
        <path d="M 0 250 C 220 220 380 280 580 240 C 760 200 920 270 1100 230 C 1200 210 1280 230 1280 230 L 1280 400 L 0 400 Z" fill={C.mintDeep} />
        <path d="M 0 300 C 260 270 420 320 640 290 C 820 270 1000 310 1180 290 C 1240 285 1280 290 1280 290 L 1280 400 L 0 400 Z" fill="#7FBE9A" />

        {/* tulips & flowers */}
        {[80, 200, 340, 460, 600, 720, 860, 980, 1110, 1220].map((x, i) => {
          const colors = [C.coral, "#F4A8C7", "#C7B8F2", C.butter, "#FFB089"];
          const col = colors[i % colors.length];
          const h = 50 + (i % 3) * 12;
          return (
            <g key={i}>
              <rect x={x - 2} y={320 - h} width={4} height={h} fill="#5FA688" />
              <ellipse cx={x - 6} cy={320 - h + 12} rx={9} ry={3} fill="#5FA688" transform={`rotate(-25 ${x - 6} ${320 - h + 12})`} />
              <path d={`M ${x} ${320 - h - 14} q -14 -4 -14 14 q 14 6 14 -2 q 14 8 14 -2 q 0 -18 -14 -10 Z`} fill={col} />
              <circle cx={x} cy={320 - h - 6} r={3} fill={C.butter} />
            </g>
          );
        })}
      </svg>

      {/* catchable butterflies */}
      {butterflies.map((b) => (
        <button
          key={b.id}
          onClick={() => catchOne(b.id)}
          aria-label="catch butterfly"
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: 56,
            height: 44,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            animation: `flutter ${3.5 + (b.id % 3)}s ease-in-out infinite`,
            zIndex: 8,
            padding: 0,
          }}
        >
          <svg viewBox="0 0 56 44" width="56" height="44">
            <ellipse cx="18" cy="18" rx="14" ry="14" fill={b.color} opacity="0.95" />
            <ellipse cx="38" cy="18" rx="14" ry="14" fill={b.color} opacity="0.95" />
            <ellipse cx="18" cy="32" rx="10" ry="9" fill={b.color} opacity="0.85" />
            <ellipse cx="38" cy="32" rx="10" ry="9" fill={b.color} opacity="0.85" />
            <rect x="27" y="10" width="2" height="26" rx="1" fill={C.text} />
            <circle cx="28" cy="9" r="2.5" fill={C.text} />
          </svg>
        </button>
      ))}

      {/* Sora — friendly companion lower-left */}
      <div style={{ position: "absolute", left: 80, bottom: 130, animation: "float-soft 7s ease-in-out infinite", zIndex: 10 }}>
        <Sora size={180} pose="curious" />
      </div>
      <div style={{ position: "absolute", left: 250, bottom: 250, zIndex: 11 }}>
        <SoraSpeech>You have <strong>{caught}</strong> in the basket. Can you find one more?</SoraSpeech>
      </div>

      {/* Basket — bottom right, shows caught butterflies */}
      <div
        style={{
          position: "absolute",
          right: 80,
          bottom: 120,
          width: 160,
          height: 130,
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -28,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.textSoft,
          }}
        >
          {caught} of 8 butterflies
        </div>
        {/* basket body */}
        <svg viewBox="0 0 160 130" width="160" height="130" style={{ position: "absolute", inset: 0 }}>
          <path d="M 12 38 Q 80 22 148 38 L 138 120 Q 80 130 22 120 Z" fill="#D9A36A" />
          <path d="M 12 38 Q 80 22 148 38 L 148 50 Q 80 34 12 50 Z" fill="#B88550" />
          {/* weave lines */}
          {[55, 75, 95, 115].map((y, i) => (
            <path key={i} d={`M 18 ${y} Q 80 ${y - 8} 142 ${y}`} stroke="#8E5F32" strokeWidth="2" fill="none" opacity="0.5" />
          ))}
          <path d="M 28 38 Q 80 8 132 38" stroke="#8E5F32" strokeWidth="4" fill="none" />
        </svg>
        {/* butterflies sitting in the basket */}
        {Array.from({ length: caught }).map((_, i) => {
          const palette = [C.coral, "#F4A8C7", "#C7B8F2", C.butter, C.skyDeep];
          const col = palette[i % palette.length];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${15 + ((i * 19) % 65)}%`,
                top: `${42 + ((i * 11) % 35)}%`,
                width: 22,
                height: 18,
                animation: `flutter ${2 + (i % 3)}s ease-in-out infinite`,
              }}
            >
              <svg viewBox="0 0 56 44" width="22" height="18">
                <ellipse cx="18" cy="18" rx="14" ry="14" fill={col} opacity="0.95" />
                <ellipse cx="38" cy="18" rx="14" ry="14" fill={col} opacity="0.95" />
                <rect x="27" y="10" width="2" height="20" rx="1" fill={C.text} />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Comfort sun-icon top-right */}
      <button
        aria-label="comfort settings"
        style={{
          position: "absolute",
          top: 24,
          right: 120,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "radial-gradient(circle at 35% 35%, #FFFBE2, #FFC56B)",
          cursor: "pointer",
          boxShadow: `0 8px 18px ${C.shadowSoft}`,
          zIndex: 30,
        }}
        title="Comfort"
      />

      {/* Why-this card — soft cream paper, rounded */}
      <div style={{ position: "absolute", left: 40, top: 90, maxWidth: 380, zIndex: 20 }}>
        <button
          onClick={() => setReasoningOpen((x) => !x)}
          style={{
            background: C.cardBg,
            color: C.text,
            border: "none",
            padding: "14px 22px",
            borderRadius: 22,
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: `0 8px 20px ${C.shadowSoft}`,
          }}
        >
          {reasoningOpen ? "Close the note" : "Why are we in this garden?"}
        </button>
        {reasoningOpen && (
          <div
            style={{
              marginTop: 12,
              background: C.cardBg,
              color: C.text,
              padding: "22px 24px",
              borderRadius: 20,
              fontFamily: FONT,
              fontSize: 17,
              fontWeight: 500,
              lineHeight: 1.55,
              boxShadow: `0 14px 32px ${C.shadowSoft}`,
              borderLeft: `5px solid ${C.peach}`,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>From Sora&apos;s notebook</div>
            Last week you liked counting things you could see. Eight is a number we are practicing.
            Butterflies are easy to spot, and they wait for you.
            <div style={{ marginTop: 12, fontSize: 14, color: C.textSoft }}>
              You can ask me to choose differently any time.
            </div>
          </div>
        )}
      </div>
    </SceneFrame>
  );
}

/* ============================================================
   SCENE 3 — CELEBRATE  ("Afternoon balloon launch")
   ============================================================ */

export function SceneCelebrate() {
  return (
    <SceneFrame step="Scene 03" storyLabel="a calm goodbye">
      {/* warm afternoon sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${C.sky} 0%, #FFE6D2 55%, ${C.cream} 100%)`,
        }}
      />
      <Sun />
      <FloatingMotes count={16} />

      {/* balloons rising */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const left = 6 + ((i * 13) % 86);
          const delay = i * 1.4;
          const dur = 22 + (i % 6);
          const size = 36 + (i % 4) * 10;
          const palette = [C.coral, "#F4A8C7", C.butter, "#C7B8F2", C.skyDeep, C.peach];
          const col = palette[i % palette.length];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${left}%`,
                bottom: "-80px",
                width: size,
                animation: `balloon-rise ${dur}s ${delay}s linear infinite`,
              }}
            >
              <div
                style={{
                  width: size,
                  height: size * 1.18,
                  borderRadius: "50% 50% 48% 48%",
                  background: `radial-gradient(circle at 30% 28%, #FFFFFF, ${col} 65%)`,
                  boxShadow: `0 6px 16px ${C.shadowSoft}`,
                }}
              />
              <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `8px solid ${col}`, margin: "0 auto" }} />
              <div style={{ width: 1, height: 80, background: C.textSoft, margin: "0 auto", opacity: 0.5 }} />
            </div>
          );
        })}
      </div>

      {/* hills */}
      <MeadowHills />

      {/* Sora — center, holding a balloon */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "35%",
          transform: "translateX(-50%)",
          animation: "float-soft 6s ease-in-out infinite",
          zIndex: 10,
        }}
      >
        <Sora size={220} pose="joyful" />
        {/* balloon string + balloon above */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "85%",
            transform: "translateX(-50%)",
            width: 1,
            height: 90,
            background: C.textSoft,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(85% + 90px)",
            transform: "translateX(-50%)",
            width: 56,
            height: 66,
            borderRadius: "50% 50% 48% 48%",
            background: `radial-gradient(circle at 30% 28%, #FFFFFF, ${C.coral} 65%)`,
            boxShadow: `0 6px 16px ${C.shadowSoft}`,
            animation: "soft-pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Big calm card */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 50,
          transform: "translateX(-50%)",
          width: "min(680px, 92%)",
          padding: "36px 40px",
          background: C.cardBg,
          color: C.text,
          borderRadius: 28,
          textAlign: "center",
          boxShadow: `0 24px 48px ${C.shadowSoft}`,
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textSoft,
            marginBottom: 10,
          }}
        >
          you stayed with us
        </div>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: 28,
            margin: "0 0 16px 0",
            lineHeight: 1.3,
          }}
        >
          You found <strong style={{ color: C.coral }}>8 butterflies</strong>.
          <br />
          One flew away — and you stayed calm. That was brave.
        </h2>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 17,
            fontWeight: 500,
            color: C.textSoft,
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
