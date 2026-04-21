"use client";

import { useState } from "react";
import type { DirectionTokens } from "./tokens";

type Props = { t: DirectionTokens };

export function DirectionShowcase({ t }: Props) {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [comfortOpen, setComfortOpen] = useState(false);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const c = t.colors;
  const isQuest = t.id === "quest";

  const sectionStyle: React.CSSProperties = {
    padding: "48px 56px",
    borderTop: `1px solid ${c.border}`,
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: t.fonts.headingStack,
    fontSize: t.type.h2,
    fontWeight: 600,
    color: c.text,
    marginBottom: 24,
    letterSpacing: t.id === "stillwater" ? "0.01em" : "normal",
  };

  const baseBtn = (variant: "primary" | "secondary" | "ghost"): React.CSSProperties => {
    const isPrimary = variant === "primary";
    const isSecondary = variant === "secondary";
    return {
      fontFamily: t.fonts.bodyStack,
      fontSize: t.type.body,
      fontWeight: 600,
      padding: variant === "ghost" ? "12px 16px" : "14px 24px",
      borderRadius: t.radius.button,
      border: isSecondary ? `2px solid ${c.accent}` : "none",
      background: isPrimary
        ? isQuest
          ? `linear-gradient(135deg, ${c.primary}, ${c.danger})`
          : c.primary
        : isSecondary
        ? "transparent"
        : "transparent",
      color: isPrimary
        ? c.primaryText
        : isSecondary
        ? c.accentText === c.text
          ? c.text
          : c.accent
        : c.textMuted,
      cursor: "pointer",
      minHeight: 44,
      transition: "transform 180ms ease-out, box-shadow 180ms ease-out, background 180ms ease-out",
      boxShadow: isPrimary && isQuest ? "0 6px 20px rgba(139, 92, 246, 0.4)" : "none",
      transform: pressedBtn === variant ? (isQuest ? "scale(0.96)" : "translateY(1px)") : "none",
      textDecoration: variant === "ghost" ? "underline" : "none",
      textUnderlineOffset: 4,
    };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: t.fonts.bodyStack,
        fontSize: t.type.body,
        lineHeight: t.id === "quest" ? 1.4 : t.id === "lumen" ? 1.5 : 1.65,
      }}
    >
      {/* Topbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 56px",
          background: c.surface,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.primary,
              color: c.primaryText,
              display: "grid",
              placeItems: "center",
              fontFamily: t.fonts.headingStack,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            A
          </div>
          <strong
            style={{
              fontFamily: t.fonts.headingStack,
              fontSize: 20,
              color: c.text,
              fontWeight: 600,
            }}
          >
            AIVO  ·  {t.name}
          </strong>
        </div>
        {isQuest && (
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: c.accent, fontWeight: 700 }}>
              ◆ 1,240
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: c.success, fontWeight: 700 }}>
              ▲ 18
            </span>
          </div>
        )}
        <button
          onClick={() => setComfortOpen((v) => !v)}
          style={{
            ...baseBtn("secondary"),
            padding: "10px 18px",
            fontSize: t.type.small,
          }}
        >
          ⚙ Comfort {comfortOpen ? "▾" : "▸"}
        </button>
      </header>

      {/* Comfort drawer */}
      {comfortOpen && (
        <div
          style={{
            background: c.surfaceAlt,
            borderBottom: `1px solid ${c.border}`,
            padding: "24px 56px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, color: c.text }}>Comfort & accessibility</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {t.comfortControls.map((ctrl) => (
              <div
                key={ctrl.label}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: t.radius.card,
                  padding: "14px 16px",
                }}
              >
                <div style={{ color: c.textMuted, fontSize: t.type.small, marginBottom: 4 }}>
                  {ctrl.label}
                </div>
                <div style={{ fontWeight: 600, color: c.text }}>{ctrl.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{ padding: "56px 56px 48px" }}>
        <div
          style={{
            fontFamily: t.fonts.bodyStack,
            color: c.textMuted,
            textTransform: "uppercase",
            fontSize: 13,
            letterSpacing: "0.12em",
            marginBottom: 12,
          }}
        >
          {t.tagline}
        </div>
        <h1
          style={{
            fontFamily: t.fonts.headingStack,
            fontSize: t.type.display,
            fontWeight: 700,
            margin: "0 0 16px 0",
            color: c.text,
            lineHeight: 1.15,
            maxWidth: 880,
          }}
        >
          {t.id === "stillwater" && "A quieter way to learn — at your pace, with no surprises."}
          {t.id === "lumen" && "Learning as a conversation with someone who really gets you."}
          {t.id === "quest" && "Today's mission is ready, and you're going to crush it."}
        </h1>
        <p style={{ color: c.textMuted, maxWidth: 720, margin: "0 0 28px 0" }}>{t.bestFor}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onMouseDown={() => setPressedBtn("primary")}
            onMouseUp={() => setPressedBtn(null)}
            onMouseLeave={() => setPressedBtn(null)}
            style={baseBtn("primary")}
          >
            {t.ctaCopy.primary} →
          </button>
          <button
            onMouseDown={() => setPressedBtn("secondary")}
            onMouseUp={() => setPressedBtn(null)}
            onMouseLeave={() => setPressedBtn(null)}
            style={baseBtn("secondary")}
          >
            {t.ctaCopy.secondary}
          </button>
          <button
            onMouseDown={() => setPressedBtn("ghost")}
            onMouseUp={() => setPressedBtn(null)}
            onMouseLeave={() => setPressedBtn(null)}
            style={baseBtn("ghost")}
          >
            {t.ctaCopy.ghost}
          </button>
        </div>
      </section>

      {/* AI Tutor card */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>AI Tutor surface</div>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: t.radius.card,
            padding: 28,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 24,
            boxShadow: t.id === "lumen" ? "0 4px 20px rgba(231, 111, 81, 0.08)" : "none",
            position: "relative",
          }}
        >
          {t.id === "lumen" && (
            <div
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 60,
                height: 60,
                borderTop: `3px solid ${c.primary}`,
                borderRight: `3px solid ${c.primary}`,
                borderTopRightRadius: t.radius.card,
              }}
            />
          )}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: t.id === "quest" ? 18 : 36,
              background: t.id === "quest" ? `linear-gradient(135deg, ${c.primary}, ${c.accent})` : c.surfaceAlt,
              border: `2px solid ${c.primary}`,
              display: "grid",
              placeItems: "center",
              fontFamily: t.fonts.headingStack,
              fontWeight: 700,
              fontSize: 28,
              color: t.id === "quest" ? c.primaryText : c.primary,
            }}
          >
            {t.tutorCopy.name[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <strong style={{ fontFamily: t.fonts.headingStack, fontSize: t.type.h2, color: c.text }}>
                {t.tutorCopy.name}
              </strong>
              {isQuest && (
                <span style={{ color: c.accent, fontSize: t.type.small, fontWeight: 700 }}>LV 12</span>
              )}
              <span style={{ color: c.textMuted, fontSize: t.type.small }}>
                {t.id === "quest" ? "your math captain" : t.id === "lumen" ? "your reading guide" : "your tutor"}
              </span>
            </div>
            <div
              style={{
                fontStyle: t.id === "lumen" ? "italic" : "normal",
                color: c.text,
                marginBottom: 16,
                fontSize: t.type.body,
              }}
            >
              {t.tutorCopy.confidence}
            </div>
            <button
              onClick={() => setReasoningOpen((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                color: c.primary,
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
                fontSize: t.type.small,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {reasoningOpen ? "Hide reasoning ▴" : `${t.tutorCopy.pickedHeading} ▾`}
            </button>
            {reasoningOpen && (
              <div
                style={{
                  marginTop: 14,
                  padding: 16,
                  background: c.surfaceAlt,
                  borderRadius: t.radius.input,
                  color: c.text,
                  fontStyle: t.id === "lumen" ? "italic" : "normal",
                  borderLeft: `3px solid ${c.primary}`,
                }}
              >
                {t.tutorCopy.rationale}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button style={{ ...baseBtn("primary"), padding: "10px 18px", fontSize: t.type.small }}>
                Start
              </button>
              <button style={{ ...baseBtn("secondary"), padding: "10px 18px", fontSize: t.type.small }}>
                {t.tutorCopy.altAction}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cards / Stat row */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>{isQuest ? "Mission cards" : "Lesson cards"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { title: isQuest ? "Word Problem Boss" : "Subtraction with regrouping", meta: isQuest ? "+50 XP" : "12 min · math" },
            { title: isQuest ? "Reading: dragon scout" : "Reading: Otto's garden", meta: isQuest ? "+30 XP" : "8 min · reading" },
            { title: isQuest ? "SEL: hero pause" : "Feelings & breathing", meta: isQuest ? "+20 XP" : "5 min · SEL" },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: t.radius.card,
                padding: 24,
                position: "relative",
                boxShadow: isQuest ? "0 4px 14px rgba(139, 92, 246, 0.12)" : "none",
              }}
            >
              {isQuest && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: c.accent,
                    color: c.accentText,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  +50 XP
                </div>
              )}
              <div style={{ color: c.textMuted, fontSize: t.type.small, marginBottom: 10 }}>{card.meta}</div>
              <div
                style={{
                  fontFamily: t.fonts.headingStack,
                  fontSize: t.type.h2,
                  fontWeight: 600,
                  marginBottom: 16,
                  color: c.text,
                  lineHeight: 1.2,
                }}
              >
                {card.title}
              </div>
              <button style={{ ...baseBtn(i === 0 ? "primary" : "secondary"), padding: "10px 16px", fontSize: t.type.small }}>
                {i === 0 ? t.ctaCopy.primary : "Save for later"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Inputs */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Inputs & forms</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <label
              style={{
                display: "block",
                color: c.text,
                fontWeight: 600,
                marginBottom: 8,
                fontSize: t.type.small,
              }}
            >
              {t.id === "lumen" ? "What did you notice?" : "Your name"}
            </label>
            <input
              defaultValue={t.id === "quest" ? "Captain Jamie" : "Jamie"}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: t.radius.input,
                color: c.text,
                fontSize: t.type.body,
                fontFamily: t.fonts.bodyStack,
                outline: "none",
                minHeight: 52,
              }}
            />
            <div style={{ color: c.textMuted, fontSize: t.type.small, marginTop: 6 }}>
              {t.id === "lumen"
                ? "Tell me anything — there is no wrong answer."
                : t.id === "quest"
                ? "This is what we'll call you in your missions."
                : "We use this to greet you. We never share it."}
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: c.text,
                fontWeight: 600,
                marginBottom: 8,
                fontSize: t.type.small,
              }}
            >
              Email address
            </label>
            <input
              defaultValue="not-a-real-email"
              style={{
                width: "100%",
                padding: "14px 16px",
                background: c.surface,
                border: `2px solid ${c.danger}`,
                borderRadius: t.radius.input,
                color: c.text,
                fontSize: t.type.body,
                fontFamily: t.fonts.bodyStack,
                outline: "none",
                minHeight: 52,
              }}
            />
            <div style={{ color: c.danger, fontSize: t.type.small, marginTop: 6, fontWeight: 500 }}>
              {t.id === "lumen"
                ? "Hmm — let's look at this together. We need an @ sign."
                : t.id === "quest"
                ? "Almost! We need an @ sign in there."
                : "This needs an @ sign to be a valid email."}
            </div>
          </div>
        </div>
      </section>

      {/* Progress / Momentum */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Progress & momentum</div>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: t.radius.card,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
            }}
          >
            <span style={{ color: c.textMuted, fontSize: t.type.small }}>{t.progressLabel}</span>
            {isQuest && (
              <span style={{ color: c.accent, fontWeight: 700, fontSize: t.type.h2 }}>250 XP</span>
            )}
          </div>
          <div
            style={{
              width: "100%",
              height: isQuest ? 14 : t.id === "lumen" ? 8 : 4,
              background: c.surfaceAlt,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "37%",
                height: "100%",
                background: isQuest
                  ? `linear-gradient(90deg, ${c.primary}, ${c.success})`
                  : c.primary,
                borderRadius: 999,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 20, color: c.textMuted, fontSize: t.type.small }}>
            <span>
              {t.id === "stillwater" && "🜂 4"}
              {t.id === "lumen" && "We've read together for 4 days"}
              {t.id === "quest" && "🔥 4-day streak  ·  Streak Pause available"}
            </span>
          </div>
        </div>
      </section>

      {/* Color palette */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Color palette</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {t.palette.map((p) => (
            <div
              key={p.hex}
              style={{
                background: p.hex,
                color: p.textOn === "light" ? "#FFFFFF" : "#1A1A1A",
                borderRadius: t.radius.card,
                padding: "20px 16px",
                border: `1px solid ${c.border}`,
                minHeight: 140,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, opacity: 0.85 }}>{p.hex}</div>
              <div style={{ fontFamily: t.fonts.headingStack, fontSize: 18, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Type specimen */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Typography</div>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: t.radius.card,
            padding: 28,
          }}
        >
          <div style={{ color: c.textMuted, fontSize: t.type.small, marginBottom: 14 }}>
            {t.fonts.heading} (heading)  ·  {t.fonts.body} (body)
          </div>
          <div style={{ fontFamily: t.fonts.headingStack, fontSize: t.type.display, fontWeight: 700, lineHeight: 1.1, color: c.text }}>
            Display {t.type.display}
          </div>
          <div style={{ fontFamily: t.fonts.headingStack, fontSize: t.type.h1, fontWeight: 600, marginTop: 12, color: c.text }}>
            Heading 1 · {t.type.h1}
          </div>
          <div style={{ fontFamily: t.fonts.headingStack, fontSize: t.type.h2, fontWeight: 600, marginTop: 10, color: c.text }}>
            Heading 2 · {t.type.h2}
          </div>
          <p style={{ fontFamily: t.fonts.bodyStack, fontSize: t.type.body, marginTop: 16, color: c.text, maxWidth: 720 }}>
            Body {t.type.body} — quick brown foxes jump over lazy dogs while learners read with comfort and ease.
          </p>
          <p style={{ fontFamily: t.fonts.bodyStack, fontSize: t.type.small, marginTop: 8, color: c.textMuted }}>
            Small {t.type.small} — secondary text, helper labels, captions.
          </p>
        </div>
      </section>

      {/* Motion + a11y note */}
      <section style={sectionStyle}>
        <div style={sectionTitleStyle}>Motion & accessibility rules</div>
        <div
          style={{
            background: c.surfaceAlt,
            borderRadius: t.radius.card,
            padding: 24,
            border: `1px solid ${c.border}`,
            color: c.text,
          }}
        >
          {t.motion}
        </div>
      </section>

      <footer style={{ padding: "32px 56px 48px", color: c.textMuted, fontSize: t.type.small }}>
        AIVO design direction · {t.name} · interactive showcase · click Comfort to open the panel · click "Why this lesson?" to expand reasoning
      </footer>
    </div>
  );
}
