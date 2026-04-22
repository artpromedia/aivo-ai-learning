"use client";

import { useState, useEffect } from "react";

/* ============================================================
   STILLWATER · 9–12 — "FOCUS STUDIO"
   Editorial. No mascot. Ambient assistant Atlas appears as text.
   Spotify-meets-Linear aesthetic. Deep teal + cream + warm sienna.
   Generous whitespace, large editorial type, mood-driven gradients.
   ============================================================ */

const C = {
  paper: "#F4EFE6",
  paperWarm: "#EDE6D6",
  ink: "#1B1F26",
  inkSoft: "#5C5F66",
  inkWhisper: "#94969C",
  teal: "#1F3D40",
  tealDeep: "#0F2226",
  tealAccent: "#2E6E70",
  sienna: "#B85C3C",
  siennaSoft: "#D77E5E",
  cream: "#FAF6EE",
  border: "#E0D9C8",
  glassDark: "rgba(15, 34, 38, 0.7)",
};

const FONT_HEAD = "'Fraunces', 'Tiempos', Georgia, serif";
const FONT_BODY = "'Inter', 'Söhne', system-ui, -apple-system, sans-serif";

function FrameHigh({ step, label, theme = "light", children }: { step: string; label: string; theme?: "light" | "dark"; children: React.ReactNode }) {
  const bg = theme === "light" ? C.paper : C.tealDeep;
  const fg = theme === "light" ? C.ink : C.cream;
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", color: fg, fontFamily: FONT_BODY, background: bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes orb-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px, -15px) scale(1.05); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes wave { 0% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } 100% { transform: scaleY(0.3); } }
        button:focus-visible { outline: 2px solid ${C.sienna}; outline-offset: 3px; }
      `}</style>
      <div style={{
        position: "absolute", top: 24, left: 36, right: 36, zIndex: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: theme === "light" ? C.inkWhisper : "rgba(244, 239, 230, 0.55)",
        pointerEvents: "none",
      }}>
        <span>AIVO · Stillwater · 9–12</span>
        <span>{step} — {label}</span>
      </div>
      {children}
    </div>
  );
}

function GhostButton({ children, primary = false, onClick, theme = "light" }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; theme?: "light" | "dark" }) {
  const [hover, setHover] = useState(false);
  const isDark = theme === "dark";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "14px 24px",
        minHeight: 50,
        borderRadius: 10,
        border: primary ? "none" : `1.5px solid ${isDark ? "rgba(244, 239, 230, 0.25)" : C.border}`,
        cursor: "pointer",
        fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600,
        letterSpacing: "-0.005em",
        color: primary ? C.cream : (isDark ? C.cream : C.ink),
        background: primary ? C.sienna : "transparent",
        transition: "all 220ms",
        transform: hover ? "translateY(-1px)" : "none",
        boxShadow: hover ? (primary ? `0 8px 18px ${C.sienna}55` : "none") : "none",
        ...(hover && !primary ? { background: isDark ? "rgba(244, 239, 230, 0.06)" : "rgba(27, 31, 38, 0.04)" } : {}),
      }}
    >
      {children}
    </button>
  );
}

function GradientOrb({ x, y, size, colors }: { x: string; y: string; size: number; colors: [string, string] }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${colors[0]}, ${colors[1]})`,
      filter: "blur(60px)", opacity: 0.7,
      animation: "orb-drift 16s ease-in-out infinite",
      pointerEvents: "none",
    }} />
  );
}

/* ============================================================
   SCENE 1 — ARRIVE  ("Tuesday, 3:42pm")
   ============================================================ */
export function SceneArriveHigh() {
  return (
    <FrameHigh step="Scene 01" label="arriving">
      {/* ambient orbs */}
      <GradientOrb x="-10%" y="-5%" size={520} colors={["#F2C2A8", "#E89C7A"]} />
      <GradientOrb x="65%" y="55%" size={460} colors={["#A8D6D2", "#5FA7A4"]} />

      <div style={{
        position: "relative", zIndex: 10,
        padding: "120px 64px 64px", maxWidth: 1100, margin: "0 auto",
      }}>
        {/* meta */}
        <div style={{
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
          letterSpacing: "0.08em", color: C.inkSoft, marginBottom: 16,
        }}>
          Tuesday · 3:42 pm · 21°C, soft afternoon
        </div>

        {/* hero question */}
        <h1 style={{
          fontFamily: FONT_HEAD, fontWeight: 400, fontSize: 76,
          letterSpacing: "-0.02em", lineHeight: 1.05,
          margin: "0 0 28px 0", color: C.ink,
          maxWidth: 900,
        }}>
          What&apos;s on your mind today, <em style={{ fontStyle: "italic", color: C.sienna }}>Jamie</em>?
        </h1>

        {/* atlas line */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "10px 16px", borderRadius: 999,
          background: "rgba(31, 61, 64, 0.06)",
          color: C.teal, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
          marginBottom: 56,
        }}>
          <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
            {[12, 18, 14, 20, 12].map((h, i) => (
              <span key={i} style={{
                display: "inline-block", width: 3, height: h,
                background: C.teal, borderRadius: 2, transformOrigin: "center",
                animation: `wave ${1 + (i % 3) * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </span>
          Atlas is ready when you are
        </div>

        {/* mood / focus row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          gap: 18,
          marginBottom: 36,
        }}>
          {/* primary suggested session */}
          <div style={{
            padding: "30px 32px", borderRadius: 18,
            background: C.cream, border: `1px solid ${C.border}`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${C.siennaSoft}66, transparent 70%)`, filter: "blur(20px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sienna, marginBottom: 12 }}>Suggested for now</div>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 500, fontSize: 30, lineHeight: 1.15, marginBottom: 10, color: C.ink }}>
                25 minutes on Algebra II — solving systems
              </div>
              <div style={{ fontSize: 15, color: C.inkSoft, marginBottom: 22, lineHeight: 1.55 }}>
                You said this felt clearer last Wednesday. Atlas is starting where you left off.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <GhostButton primary>Start session</GhostButton>
                <GhostButton>Pick something else</GhostButton>
              </div>
            </div>
          </div>

          {/* mood card */}
          <div style={{ padding: "26px 28px", borderRadius: 18, background: C.cream, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}>Quick check-in</div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, lineHeight: 1.25, marginBottom: 18, color: C.ink }}>How is your energy?</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Low", "Steady", "Ready", "Wired"].map((m, i) => (
                <button key={m} style={{
                  flex: 1, padding: "12px 8px", border: `1px solid ${C.border}`,
                  background: i === 1 ? C.teal : "transparent",
                  color: i === 1 ? C.cream : C.ink,
                  borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: FONT_BODY,
                }}>{m}</button>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: C.inkWhisper }}>
              We&apos;ll match the next session to this.
            </div>
          </div>

          {/* focus space card */}
          <div style={{ padding: "26px 28px", borderRadius: 18, background: C.teal, color: C.cream, border: `1px solid ${C.tealDeep}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.2, background: `radial-gradient(circle at 70% 30%, ${C.siennaSoft}, transparent 60%)` }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(244, 239, 230, 0.7)", marginBottom: 14 }}>Focus space</div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, lineHeight: 1.25, marginBottom: 6 }}>Library at dusk</div>
              <div style={{ fontSize: 13, color: "rgba(244, 239, 230, 0.7)", marginBottom: 18 }}>Soft rain · low warm light · 65 dB</div>
              <GhostButton theme="dark">Switch space →</GhostButton>
            </div>
          </div>
        </div>

        {/* footer note */}
        <div style={{ fontSize: 13, color: C.inkWhisper, fontWeight: 500 }}>
          You are 4 sessions into your week. There is nothing scheduled — this is yours to shape.
        </div>
      </div>
    </FrameHigh>
  );
}

/* ============================================================
   SCENE 2 — ENGAGE  ("Inside a focus session")
   ============================================================ */
export function SceneEngageHigh() {
  const [paused, setPaused] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  // dummy progress 41%
  const progress = 0.41;

  return (
    <FrameHigh step="Scene 02" label="inside a focus session" theme="dark">
      {/* ambient breathing background */}
      <GradientOrb x="-15%" y="20%" size={500} colors={["#2E6E70", "#1B4244"]} />
      <GradientOrb x="60%" y="-5%" size={420} colors={["#B85C3C44", "#1F3D4044"]} />

      {/* central layout */}
      <div style={{ position: "relative", zIndex: 10, padding: "100px 64px 56px", maxWidth: 1180, margin: "0 auto" }}>

        {/* session header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 56 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(244, 239, 230, 0.55)", marginBottom: 8 }}>
              Algebra II · solving systems · session 4
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 38, fontWeight: 500, color: C.cream, letterSpacing: "-0.01em" }}>
              Find x and y where the lines meet.
            </div>
          </div>
          <button
            onClick={() => setReasoningOpen((x) => !x)}
            style={{
              padding: "10px 18px", borderRadius: 999,
              background: "rgba(244, 239, 230, 0.08)", color: C.cream,
              border: `1px solid rgba(244, 239, 230, 0.18)`,
              fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            {reasoningOpen ? "Hide Atlas's note" : "Why this problem?"}
          </button>
        </div>

        {/* central focus area: timer + task */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 56, alignItems: "center", marginBottom: 56 }}>
          {/* timer ring */}
          <div style={{ position: "relative", width: 320, height: 320 }}>
            {/* pulse ring */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${C.sienna}`, opacity: 0.4, animation: paused ? "none" : "pulse-ring 3s ease-out infinite" }} />
            {/* SVG ring */}
            <svg viewBox="0 0 320 320" style={{ position: "absolute", inset: 0 }}>
              <circle cx="160" cy="160" r="140" fill="none" stroke="rgba(244, 239, 230, 0.08)" strokeWidth="6" />
              <circle cx="160" cy="160" r="140" fill="none" stroke={C.siennaSoft} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 140 * progress} ${2 * Math.PI * 140}`}
                transform="rotate(-90 160 160)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 56, fontWeight: 400, color: C.cream, letterSpacing: "-0.02em" }}>14:32</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(244, 239, 230, 0.6)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>remaining</div>
              <button onClick={() => setPaused(p => !p)} style={{
                marginTop: 22, padding: "10px 22px", borderRadius: 999,
                background: paused ? C.sienna : "transparent",
                color: paused ? C.cream : C.cream,
                border: `1.5px solid ${paused ? C.sienna : "rgba(244, 239, 230, 0.3)"}`,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
              }}>
                {paused ? "Resume" : "Pause · take a breath"}
              </button>
            </div>
          </div>

          {/* current task */}
          <div>
            <div style={{
              padding: "32px 36px", borderRadius: 18,
              background: "rgba(244, 239, 230, 0.05)",
              border: `1px solid rgba(244, 239, 230, 0.12)`,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.siennaSoft, marginBottom: 14 }}>
                Problem 3 of 7
              </div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 400, lineHeight: 1.25, color: C.cream, marginBottom: 22 }}>
                <div>2x + y = 11</div>
                <div>x − y = 1</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <input
                  defaultValue="x = 4"
                  style={{
                    flex: 1, padding: "14px 18px", borderRadius: 10,
                    background: "rgba(244, 239, 230, 0.1)",
                    border: `1px solid rgba(244, 239, 230, 0.2)`,
                    color: C.cream, fontSize: 18, fontFamily: FONT_HEAD,
                    outline: "none",
                  }}
                />
                <input
                  defaultValue="y = ?"
                  style={{
                    flex: 1, padding: "14px 18px", borderRadius: 10,
                    background: "rgba(244, 239, 230, 0.1)",
                    border: `1px solid rgba(244, 239, 230, 0.2)`,
                    color: C.cream, fontSize: 18, fontFamily: FONT_HEAD,
                    outline: "none",
                  }}
                />
                <button style={{
                  padding: "14px 26px", borderRadius: 10, border: "none",
                  background: C.sienna, color: C.cream,
                  fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
                }}>Check</button>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10, fontSize: 13, color: "rgba(244, 239, 230, 0.6)" }}>
                <button style={{ background: "none", border: "none", color: C.siennaSoft, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13, fontFamily: FONT_BODY }}>Show me a small hint</button>
                <span>·</span>
                <button style={{ background: "none", border: "none", color: "rgba(244, 239, 230, 0.6)", cursor: "pointer", padding: 0, fontSize: 13, fontFamily: FONT_BODY }}>Skip without losing progress</button>
              </div>
            </div>

            {reasoningOpen && (
              <div style={{
                marginTop: 18, padding: "20px 24px", borderRadius: 14,
                background: "rgba(184, 92, 60, 0.12)",
                border: `1px solid rgba(184, 92, 60, 0.3)`,
                color: C.cream, fontSize: 15, lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.siennaSoft, marginBottom: 8 }}>From Atlas</div>
                Last session, your first attempts on substitution were faster than elimination. I&apos;m putting two-variable systems back on the table because that win was real and I want to build on it.
                You can switch methods or ask me to explain a different way any time.
              </div>
            )}
          </div>
        </div>

        {/* breath bar */}
        <div style={{
          padding: "16px 24px", borderRadius: 14,
          background: "rgba(244, 239, 230, 0.04)",
          border: `1px solid rgba(244, 239, 230, 0.08)`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          color: "rgba(244, 239, 230, 0.7)", fontSize: 13,
        }}>
          <span>You&apos;ve been at this for 11 minutes. Atlas suggests a 30-second breath at minute 20.</span>
          <button style={{ background: "none", border: "none", color: C.siennaSoft, cursor: "pointer", fontWeight: 600, fontFamily: FONT_BODY, fontSize: 13 }}>Take it now →</button>
        </div>
      </div>
    </FrameHigh>
  );
}

/* ============================================================
   SCENE 3 — CLOSE  ("Reflection")
   ============================================================ */
export function SceneCloseHigh() {
  const [mood, setMood] = useState<number | null>(2);
  return (
    <FrameHigh step="Scene 03" label="closing the session">
      <GradientOrb x="-10%" y="50%" size={520} colors={["#F2C2A8", "#E89C7A"]} />
      <GradientOrb x="70%" y="-10%" size={460} colors={["#A8D6D2", "#5FA7A4"]} />

      <div style={{ position: "relative", zIndex: 10, padding: "120px 64px 64px", maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 16 }}>
          Session closed · 23 min · 4:18 pm
        </div>

        {/* hero */}
        <h1 style={{
          fontFamily: FONT_HEAD, fontWeight: 400, fontSize: 64,
          letterSpacing: "-0.02em", lineHeight: 1.1,
          margin: "0 0 24px 0", color: C.ink,
          maxWidth: 800,
        }}>
          You stayed with it for 23 minutes.<br />
          <span style={{ color: C.inkSoft }}>You stopped twice — that&apos;s okay.</span>
        </h1>

        {/* atlas note */}
        <div style={{
          display: "inline-block",
          padding: "20px 26px", borderRadius: 14,
          background: C.cream, border: `1px solid ${C.border}`,
          color: C.ink, fontSize: 16, lineHeight: 1.65, maxWidth: 680,
          fontFamily: FONT_BODY,
          marginBottom: 44,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sienna, marginBottom: 8 }}>From Atlas</div>
          You finished 5 of 7 problems. You used the hint once. The two you skipped — I&apos;ll bring those back tomorrow when you&apos;re fresher, not now.
        </div>

        {/* mood check */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 500, color: C.ink, marginBottom: 16, letterSpacing: "-0.01em" }}>
            How does it feel right now?
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["Drained", "Off", "Steady", "Clearer", "Lit up"].map((m, i) => (
              <button
                key={m}
                onClick={() => setMood(i)}
                style={{
                  padding: "12px 22px", borderRadius: 999,
                  border: mood === i ? "none" : `1.5px solid ${C.border}`,
                  background: mood === i ? C.teal : "transparent",
                  color: mood === i ? C.cream : C.ink,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
                  transition: "all 220ms",
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: C.inkWhisper }}>
            Atlas uses this to tune tomorrow&apos;s start time, not to score you.
          </div>
        </div>

        {/* what's next */}
        <div style={{
          padding: "26px 30px", borderRadius: 16,
          background: C.cream, border: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap",
          marginBottom: 36,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 6 }}>
              Tomorrow, if you want
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.25 }}>
              20 minutes — the two systems you skipped, slower this time.
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>
            Or pick something else when you arrive.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <GhostButton>Close for the day</GhostButton>
          <GhostButton primary>One more, shorter</GhostButton>
        </div>
      </div>
    </FrameHigh>
  );
}
