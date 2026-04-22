"use client";

import { useState, useEffect } from "react";

/* ============================================================
   STILLWATER · 6–8 — "STUDY TREEHOUSE"
   Studio Ghibli forest discovery, illustrated peer companion Kai,
   warm woods + moss + parchment + lantern light. Slightly older feel
   without losing calm. Sentence-case Lexend, no italics.
   ============================================================ */

/* AIVO brand alignment — keep wood tones (real material), but
   swap mascot accent (rust → brand violet #7C3AED) and lantern
   light (ochre → brand accent gold #FFB700). Brand fonts. */
const C = {
  wood: "#8B6F47",
  woodDeep: "#5D4830",
  woodLight: "#B89A72",
  moss: "#5D7A5C",
  mossDeep: "#3F5840",
  ochre: "#FFB700",
  rust: "#7C3AED",
  parchment: "#F5EBD8",
  parchmentSoft: "#FAF1DD",
  inkNavy: "#1F1535",
  ink: "#292F3D",
  inkSoft: "#5B5067",
  starGlow: "#FFE6A8",
  cream: "#FFF8E8",
};

const FONT_HEAD = "'Fredoka', 'Nunito', system-ui, sans-serif";
const FONT_BODY = "'Nunito', 'Lexend', system-ui, sans-serif";

/* Kai — a chibi-style explorer in a hooded cloak. Soft, friendly. */
function Kai({ size = 200, expression = "calm" }: { size?: number; expression?: "calm" | "smile" | "wave" }) {
  const eyeArc = expression === "smile" ? "M 0 4 Q 8 -6 16 4" : "M 0 4 Q 8 -3 16 4";
  return (
    <svg viewBox="0 0 220 260" width={size} height={size * (260 / 220)} style={{ filter: `drop-shadow(0 12px 22px rgba(40, 30, 20, 0.35))` }}>
      <defs>
        <linearGradient id="cloak" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.rust} />
          <stop offset="100%" stopColor="#8C4B33" />
        </linearGradient>
        <linearGradient id="hood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.rust} />
          <stop offset="100%" stopColor="#A0563A" />
        </linearGradient>
      </defs>
      {/* cloak body */}
      <path d="M 30 240 Q 30 140 110 130 Q 190 140 190 240 Z" fill="url(#cloak)" />
      {/* face */}
      <ellipse cx="110" cy="120" rx="48" ry="52" fill="#F5D6B0" />
      {/* hood over head */}
      <path d="M 50 110 Q 60 50 110 50 Q 160 50 170 110 Q 165 130 145 130 Q 110 100 75 130 Q 55 130 50 110 Z" fill="url(#hood)" />
      {/* hood shadow on face */}
      <path d="M 65 100 Q 110 90 155 100 Q 150 116 110 116 Q 70 116 65 100 Z" fill={C.inkNavy} opacity="0.18" />
      {/* eyes */}
      <g stroke={C.inkNavy} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d={eyeArc} transform="translate(82,128)" />
        <path d={eyeArc} transform="translate(122,128)" />
      </g>
      {/* cheeks */}
      <ellipse cx="80" cy="148" rx="10" ry="6" fill="#E89A85" opacity="0.6" />
      <ellipse cx="140" cy="148" rx="10" ry="6" fill="#E89A85" opacity="0.6" />
      {/* smile */}
      <path d="M 100 156 Q 110 164 120 156" stroke={C.inkNavy} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* satchel strap */}
      <path d="M 70 158 Q 110 175 150 158" stroke={C.ochre} strokeWidth="4" fill="none" />
      <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="6s" repeatCount="indefinite" />
    </svg>
  );
}

function LanternGlow({ x, y, size = 80 }: { x: number; y: number; size?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.starGlow} 0%, rgba(255, 230, 168, 0.4) 40%, transparent 70%)`,
        pointerEvents: "none",
        animation: "glow 6s ease-in-out infinite",
      }}
    />
  );
}

function FrameMiddle({ step, label, children }: { step: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", color: C.parchment, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes glow { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        @keyframes float-soft { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes mist-drift { 0% { transform: translateX(-10%); } 100% { transform: translateX(10%); } }
        button:focus-visible { outline: 3px solid ${C.ochre}; outline-offset: 3px; }
      `}</style>
      <div style={{
        position: "absolute", top: 22, left: 28, right: 28, zIndex: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
        letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245, 235, 216, 0.6)",
        pointerEvents: "none",
      }}>
        <span>AIVO · Stillwater · 6–8</span>
        <span>{step} — {label}</span>
      </div>
      {children}
    </div>
  );
}

function PillButton({ children, primary = false, onClick }: { children: React.ReactNode; primary?: boolean; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "16px 28px",
        minHeight: 56,
        borderRadius: 14,
        border: primary ? "none" : `2px solid ${C.ochre}`,
        cursor: "pointer",
        fontFamily: FONT_BODY,
        fontSize: 17,
        fontWeight: 600,
        color: primary ? C.inkNavy : C.parchment,
        background: primary
          ? `linear-gradient(180deg, ${C.starGlow}, ${C.ochre})`
          : "rgba(42, 52, 71, 0.55)",
        boxShadow: hover
          ? `0 0 0 4px rgba(212, 165, 116, 0.25), 0 12px 22px rgba(0, 0, 0, 0.35)`
          : `0 6px 16px rgba(0, 0, 0, 0.35)`,
        backdropFilter: "blur(4px)",
        transition: "transform 220ms, box-shadow 220ms",
        transform: hover ? "translateY(-2px)" : "none",
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   SCENE 1 — ARRIVE  ("Welcome to the treehouse")
   ============================================================ */
export function SceneArriveMiddle() {
  return (
    <FrameMiddle step="Scene 01" label="entering the treehouse">
      {/* misty forest sky */}
      <div style={{ position: "absolute", inset: 0,
        background: `linear-gradient(180deg, ${C.inkNavy} 0%, #3D4A5C 40%, #6B6850 75%, #8B7A55 100%)` }} />

      {/* stars */}
      <svg viewBox="0 0 1280 720" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "60%" }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 173) % 1280;
          const y = (i * 71) % 380;
          const r = 1 + ((i * 7) % 5) / 3;
          return (
            <circle key={i} cx={x} cy={y} r={r} fill={C.starGlow}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {/* mist layer */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: "30%", height: 200,
        background: "linear-gradient(180deg, transparent, rgba(245, 235, 216, 0.18), transparent)",
        animation: "mist-drift 18s ease-in-out infinite alternate",
      }} />

      {/* pine silhouettes */}
      <svg viewBox="0 0 1280 400" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "55%", pointerEvents: "none" }}>
        {[80, 240, 420, 580, 760, 920, 1080, 1220].map((x, i) => {
          const h = 180 + ((i * 31) % 80);
          return (
            <path key={i} d={`M ${x - 40} 400 L ${x} ${400 - h} L ${x + 40} 400 Z`} fill={i % 2 ? C.mossDeep : "#1F2A2A"} opacity={0.85} />
          );
        })}
      </svg>

      {/* treehouse frame */}
      <div style={{
        position: "absolute", left: "50%", top: "18%", transform: "translateX(-50%)",
        width: 720, height: 460, zIndex: 8,
      }}>
        {/* roof */}
        <svg viewBox="0 0 720 460" width="100%" height="100%">
          <defs>
            <linearGradient id="wallGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={C.wood} />
              <stop offset="100%" stopColor={C.woodDeep} />
            </linearGradient>
            <linearGradient id="windowGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFD78A" />
              <stop offset="100%" stopColor={C.ochre} />
            </linearGradient>
          </defs>
          {/* roof */}
          <path d="M 60 140 L 360 30 L 660 140 L 660 160 L 60 160 Z" fill={C.woodDeep} />
          <path d="M 100 140 L 360 50 L 620 140" stroke="#3A2B1A" strokeWidth="3" fill="none" />
          {/* main wall */}
          <rect x="100" y="140" width="520" height="280" fill="url(#wallGrad)" />
          {/* plank lines */}
          {[180, 220, 260, 300, 340, 380].map((y, i) => (
            <line key={i} x1="100" y1={y} x2="620" y2={y} stroke="#3A2B1A" strokeWidth="1" opacity="0.4" />
          ))}
          {/* big window with warm light */}
          <rect x="200" y="180" width="320" height="180" rx="14" fill="url(#windowGrad)" />
          <rect x="200" y="180" width="320" height="180" rx="14" fill="none" stroke={C.woodDeep} strokeWidth="6" />
          <line x1="360" y1="180" x2="360" y2="360" stroke={C.woodDeep} strokeWidth="4" />
          <line x1="200" y1="270" x2="520" y2="270" stroke={C.woodDeep} strokeWidth="4" />
          {/* hanging lantern */}
          <line x1="160" y1="140" x2="160" y2="200" stroke="#3A2B1A" strokeWidth="2" />
          <rect x="148" y="200" width="24" height="32" rx="3" fill={C.ochre} />
          <rect x="146" y="196" width="28" height="6" rx="2" fill="#3A2B1A" />
        </svg>
        {/* lantern glow */}
        <LanternGlow x={120} y={190} size={120} />
        {/* window glow */}
        <div style={{
          position: "absolute", left: 200, top: 180, width: 320, height: 180,
          borderRadius: 14, boxShadow: `0 0 80px 20px rgba(255, 215, 138, 0.45)`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Kai standing on a platform near the treehouse */}
      <div style={{ position: "absolute", left: "calc(50% - 380px)", top: "30%", animation: "float-soft 7s ease-in-out infinite", zIndex: 12 }}>
        <Kai size={170} expression="smile" />
      </div>

      {/* speech bubble */}
      <div style={{
        position: "absolute", left: "calc(50% - 250px)", top: "26%", zIndex: 13,
        background: C.parchment, color: C.ink, padding: "16px 22px",
        borderRadius: "20px 20px 20px 6px", maxWidth: 320,
        fontFamily: FONT_BODY, fontSize: 17, fontWeight: 500, lineHeight: 1.5,
        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.4)",
      }}>
        Welcome back, Jamie. Tonight I thought we could map a few stars together.
      </div>

      {/* bottom UI panel — wooden plaque */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, padding: "32px 48px 44px",
        background: `linear-gradient(180deg, transparent, rgba(31, 41, 55, 0.85) 40%, ${C.inkNavy})`,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "26px 30px",
          background: "rgba(245, 235, 216, 0.08)",
          border: `1px solid rgba(212, 165, 116, 0.3)`,
          borderRadius: 18, backdropFilter: "blur(8px)",
        }}>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
            letterSpacing: "0.2em", textTransform: "uppercase", color: C.ochre, marginBottom: 8,
          }}>
            Tuesday night · the treehouse is open
          </div>
          <h1 style={{
            fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 36,
            margin: "0 0 18px 0", color: C.parchment, lineHeight: 1.15,
          }}>
            Pick how tonight should feel.
          </h1>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <PillButton primary>Map the stars (15 min)</PillButton>
            <PillButton>Read a chapter</PillButton>
            <PillButton>Just sit by the window</PillButton>
          </div>
          <div style={{ marginTop: 16, color: "rgba(245, 235, 216, 0.7)", fontSize: 14, fontWeight: 500 }}>
            You finished 4 nights in a row. Skipping a night does not break anything.
          </div>
        </div>
      </div>
    </FrameMiddle>
  );
}

/* ============================================================
   SCENE 2 — ENGAGE  ("Mapping a constellation")
   ============================================================ */
export function SceneEngageMiddle() {
  const [connected, setConnected] = useState<number[]>([]);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const stars = [
    { id: 0, x: 38, y: 28 },
    { id: 1, x: 46, y: 38 },
    { id: 2, x: 56, y: 35 },
    { id: 3, x: 60, y: 50 },
    { id: 4, x: 70, y: 58 },
  ];

  const tap = (id: number) => {
    setConnected((c) => (c.includes(id) ? c : [...c, id]));
  };

  return (
    <FrameMiddle step="Scene 02" label="mapping a constellation">
      {/* deep night sky */}
      <div style={{ position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 70% 30%, #3F2D6E 0%, ${C.inkNavy} 50%, #14102A 100%)` }} />

      {/* faint stars background */}
      <svg viewBox="0 0 1280 720" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 173) % 1280;
          const y = (i * 71) % 720;
          const r = 0.6 + ((i * 7) % 5) / 4;
          return (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.5}>
              <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${2 + (i % 5)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {/* horizon pines */}
      <svg viewBox="0 0 1280 200" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "20%" }}>
        {[0, 100, 220, 340, 460, 580, 700, 820, 940, 1060, 1180].map((x, i) => {
          const h = 100 + ((i * 17) % 60);
          return <path key={i} d={`M ${x - 30} 200 L ${x} ${200 - h} L ${x + 30} 200 Z`} fill="#0E141C" />;
        })}
      </svg>

      {/* connection lines (drawn between connected stars in order) */}
      <svg viewBox="0 0 1280 720" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {connected.length > 1 && connected.slice(1).map((id, i) => {
          const prev = stars.find(s => s.id === connected[i])!;
          const cur = stars.find(s => s.id === id)!;
          return <line key={`${i}-${id}`} x1={(prev.x / 100) * 1280} y1={(prev.y / 100) * 720} x2={(cur.x / 100) * 1280} y2={(cur.y / 100) * 720} stroke={C.starGlow} strokeWidth="2" opacity="0.8" />;
        })}
      </svg>

      {/* tappable stars */}
      {stars.map((s) => {
        const lit = connected.includes(s.id);
        return (
          <button
            key={s.id}
            onClick={() => tap(s.id)}
            aria-label={`star ${s.id + 1}`}
            style={{
              position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: "transparent", cursor: "pointer", padding: 0,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div style={{
              width: lit ? 22 : 14, height: lit ? 22 : 14,
              borderRadius: "50%",
              background: lit ? `radial-gradient(circle, #FFFFFF, ${C.starGlow})` : `radial-gradient(circle, #FFFFFF, rgba(255,255,255,0.5))`,
              boxShadow: lit ? `0 0 30px 8px rgba(255, 230, 168, 0.7)` : `0 0 14px 3px rgba(255, 255, 255, 0.3)`,
              margin: "0 auto",
              transition: "all 280ms",
            }} />
          </button>
        );
      })}

      {/* Kai in lower-left in a small panel */}
      <div style={{
        position: "absolute", left: 32, bottom: 32, zIndex: 30,
        display: "flex", gap: 14, alignItems: "flex-end",
      }}>
        <div style={{ animation: "float-soft 7s ease-in-out infinite" }}>
          <Kai size={120} expression="calm" />
        </div>
        <div style={{
          background: C.parchment, color: C.ink, padding: "14px 20px",
          borderRadius: "18px 18px 18px 4px", maxWidth: 280,
          fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500, lineHeight: 1.5,
          marginBottom: 30, boxShadow: "0 10px 22px rgba(0, 0, 0, 0.45)",
        }}>
          {connected.length === 0 && "Tap any star to start. There is no wrong order."}
          {connected.length > 0 && connected.length < 5 && `Nice. ${connected.length} of 5 connected.`}
          {connected.length === 5 && "There she is — the Hunter. You found her."}
        </div>
      </div>

      {/* progress badge top-right */}
      <div style={{
        position: "absolute", top: 24, right: 28, zIndex: 30,
        background: "rgba(245, 235, 216, 0.1)", padding: "10px 18px",
        borderRadius: 14, border: `1px solid rgba(212, 165, 116, 0.35)`,
        fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: C.parchment,
        backdropFilter: "blur(6px)",
      }}>
        Constellation · {connected.length}/5 stars
      </div>

      {/* Why-this — open notebook style */}
      <div style={{ position: "absolute", left: 32, top: 80, maxWidth: 360, zIndex: 30 }}>
        <button
          onClick={() => setReasoningOpen((x) => !x)}
          style={{
            background: "rgba(245, 235, 216, 0.1)", color: C.parchment,
            border: `1px solid rgba(212, 165, 116, 0.4)`,
            padding: "10px 18px", borderRadius: 12, cursor: "pointer",
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
            backdropFilter: "blur(6px)",
          }}
        >
          {reasoningOpen ? "Close Kai's notes" : "Why this constellation?"}
        </button>
        {reasoningOpen && (
          <div style={{
            marginTop: 10, background: C.parchment, color: C.ink,
            padding: "20px 22px", borderRadius: 12,
            fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 500, lineHeight: 1.55,
            boxShadow: "0 14px 28px rgba(0, 0, 0, 0.5)",
            borderLeft: `5px solid ${C.ochre}`,
          }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>From Kai&apos;s notebook</div>
            Last week you liked finding patterns. Orion has 5 main stars and they form a clear shape.
            We are practicing seeing groups before details — that helps in math too.
            <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft }}>
              You can ask me to choose differently any time.
            </div>
          </div>
        )}
      </div>
    </FrameMiddle>
  );
}

/* ============================================================
   SCENE 3 — CLOSE  ("Closing the journal")
   ============================================================ */
export function SceneCloseMiddle() {
  return (
    <FrameMiddle step="Scene 03" label="closing the journal">
      <div style={{ position: "absolute", inset: 0,
        background: `linear-gradient(180deg, ${C.inkNavy} 0%, #3D4A5C 50%, #6B6850 100%)` }} />

      {/* warm window glow effect across scene */}
      <div style={{
        position: "absolute", left: "50%", top: "30%", transform: "translate(-50%, -50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(255, 215, 138, 0.25) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* journal — open book at center */}
      <div style={{
        position: "absolute", left: "50%", top: "12%", transform: "translateX(-50%)",
        width: "min(820px, 92%)", zIndex: 10,
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
          background: C.parchment, borderRadius: 8,
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.6)",
          color: C.ink, fontFamily: FONT_HEAD,
          minHeight: 380,
          backgroundImage: `linear-gradient(90deg, transparent 49.5%, rgba(0,0,0,0.12) 50%, transparent 50.5%)`,
        }}>
          {/* left page */}
          <div style={{ padding: "36px 40px" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}>
              Tuesday · entry 24
            </div>
            <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 30, margin: "0 0 16px 0", lineHeight: 1.2 }}>
              We mapped Orion tonight.
            </h2>
            <div style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 500 }}>
              You connected all 5 stars. You took a break in the middle and came back.
              That counts as finishing.
            </div>
          </div>
          {/* right page */}
          <div style={{ padding: "36px 40px", borderLeft: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}>
              Kai&apos;s note
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontStyle: "normal", lineHeight: 1.55, fontWeight: 500 }}>
              Tomorrow we could try the Big Dipper, or revisit Orion if you want it to feel familiar first. Both are good.
            </div>
            <div style={{ marginTop: 26, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.inkSoft, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Tonight&apos;s focus
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["seeing patterns", "staying calm during a break", "naming what you see"].map((t) => (
                <span key={t} style={{ background: C.ochre + "33", color: C.inkNavy, padding: "6px 12px", borderRadius: 999, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kai sitting beside the journal */}
      <div style={{ position: "absolute", left: "calc(50% - 460px)", bottom: "26%", animation: "float-soft 7s ease-in-out infinite", zIndex: 5 }}>
        <Kai size={140} expression="smile" />
      </div>

      {/* bottom choices */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, padding: "28px 48px 44px",
        background: `linear-gradient(180deg, transparent, rgba(20, 24, 42, 0.9))`,
        display: "flex", justifyContent: "center", gap: 14, zIndex: 30,
      }}>
        <PillButton>Pack up for tonight</PillButton>
        <PillButton primary>One more constellation</PillButton>
      </div>
    </FrameMiddle>
  );
}
