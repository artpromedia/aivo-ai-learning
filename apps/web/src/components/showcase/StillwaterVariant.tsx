"use client";

import { useState } from "react";
import { STILLWATER } from "./tokens";

type Mode = "hierarchy" | "affordance" | "readability";

const VARIANT_META: Record<Mode, { title: string; subtitle: string; tradeoff: string }> = {
  hierarchy: {
    title: "V1 · Hierarchy-first",
    subtitle: "Optimizes: clarity of information hierarchy",
    tradeoff:
      "TRADEOFF — single-column rhythm with strong section numbering and generous whitespace. Costs: more scrolling, fewer items visible at once, less density per screen.",
  },
  affordance: {
    title: "V2 · Affordance-first",
    subtitle: "Optimizes: ease of interaction, visibility of what's clickable",
    tradeoff:
      "TRADEOFF — every interactive element is heavily outlined, hint-labelled, and chevron-marked; persistent action bar at bottom. Costs: more visual noise (a Stillwater anti-pattern made explicit) — sensory-sensitive learners may find it busy.",
  },
  readability: {
    title: "V3 · Readability-first",
    subtitle: "Optimizes: accessibility, dyslexia-friendly reading load",
    tradeoff:
      "TRADEOFF — Atkinson Hyperlegible at 19px / 1.85 line-height, max 60ch lines, sentence-case, single accent color, AAA contrast pairs. Costs: takes ~40% more vertical space, less information density, longer scroll.",
  },
};

export function StillwaterVariant({ mode }: { mode: Mode }) {
  const t = STILLWATER;
  const c = t.colors;
  const v = VARIANT_META[mode];
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [comfortOpen, setComfortOpen] = useState(false);

  // Per-mode style derivations
  const isHierarchy = mode === "hierarchy";
  const isAffordance = mode === "affordance";
  const isReadability = mode === "readability";

  const bodyFont = isReadability
    ? "'Atkinson Hyperlegible', 'Inter', system-ui, sans-serif"
    : t.fonts.bodyStack;
  const headingFont = isReadability
    ? "'Atkinson Hyperlegible', 'Inter Tight', system-ui, sans-serif"
    : t.fonts.headingStack;

  const bodySize = isReadability ? 19 : t.type.body;
  const lineHeight = isReadability ? 1.85 : 1.65;
  const maxReadableWidth = isReadability ? "60ch" : "none";

  const sectionPad = isReadability ? "64px 56px" : isHierarchy ? "72px 56px" : "40px 56px";
  const sectionBorder = isHierarchy
    ? `1px solid ${c.border}`
    : isAffordance
    ? `1px dashed ${c.border}`
    : `1px solid ${c.border}`;

  const interactiveOutline = isAffordance
    ? `2px solid ${c.primary}`
    : `1px solid ${c.border}`;

  const inputBorder = isAffordance
    ? `2px solid ${c.primary}`
    : isReadability
    ? `2px solid ${c.text}`
    : `1px solid ${c.border}`;

  const cardShadow = isAffordance
    ? `0 0 0 1px ${c.border}, 0 4px 12px rgba(91, 124, 255, 0.18)`
    : "none";

  // Section helper — V1 prepends a step number, V2 highlights, V3 just plain
  const SectionTitle = ({ n, label }: { n: number; label: string }) => (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        marginBottom: isReadability ? 28 : 24,
      }}
    >
      {isHierarchy && (
        <span
          style={{
            fontFamily: headingFont,
            fontSize: 48,
            fontWeight: 700,
            color: c.primary,
            lineHeight: 1,
            minWidth: 56,
          }}
        >
          {String(n).padStart(2, "0")}
        </span>
      )}
      <h2
        style={{
          fontFamily: headingFont,
          fontSize: isHierarchy ? 30 : isReadability ? 26 : t.type.h2,
          fontWeight: 600,
          color: c.text,
          margin: 0,
          letterSpacing: isReadability ? "0.005em" : "normal",
        }}
      >
        {label}
        {isAffordance && (
          <span style={{ marginLeft: 12, color: c.primary, fontSize: 14, fontWeight: 600 }}>
            ↓ {n} of 7
          </span>
        )}
      </h2>
    </div>
  );

  const PrimaryCTA = ({ children }: { children: React.ReactNode }) => (
    <button
      style={{
        fontFamily: bodyFont,
        fontSize: isReadability ? 18 : t.type.body,
        fontWeight: 600,
        padding: isReadability ? "16px 28px" : "14px 24px",
        borderRadius: t.radius.button,
        border: "none",
        background: c.primary,
        color: c.primaryText,
        cursor: "pointer",
        minHeight: isReadability ? 56 : 48,
        boxShadow: isAffordance ? "0 6px 16px rgba(91, 124, 255, 0.4)" : "none",
        transform: isAffordance ? "translateY(0)" : "none",
      }}
    >
      {children} {isAffordance ? "→" : ""}
    </button>
  );

  const SecondaryCTA = ({ children }: { children: React.ReactNode }) => (
    <button
      style={{
        fontFamily: bodyFont,
        fontSize: isReadability ? 18 : t.type.body,
        fontWeight: 600,
        padding: isReadability ? "16px 28px" : "12px 22px",
        borderRadius: t.radius.button,
        border: `2px solid ${c.primary}`,
        background: "transparent",
        color: c.primary,
        cursor: "pointer",
        minHeight: isReadability ? 56 : 48,
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: bodyFont,
        fontSize: bodySize,
        lineHeight,
      }}
    >
      {/* Variant banner */}
      <div
        style={{
          background: c.primary,
          color: c.primaryText,
          padding: "14px 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          fontSize: 14,
        }}
      >
        <div>
          <strong style={{ marginRight: 12 }}>{v.title}</strong>
          <span style={{ opacity: 0.9 }}>{v.subtitle}</span>
        </div>
        <span style={{ opacity: 0.85 }}>Stillwater · interactive variant</span>
      </div>

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
              fontFamily: headingFont,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            A
          </div>
          <strong
            style={{
              fontFamily: headingFont,
              fontSize: isReadability ? 22 : 20,
              color: c.text,
              fontWeight: 600,
            }}
          >
            AIVO · Stillwater
          </strong>
        </div>
        <button
          onClick={() => setComfortOpen((x) => !x)}
          style={{
            fontFamily: bodyFont,
            fontSize: isReadability ? 17 : 14,
            fontWeight: 600,
            padding: isReadability ? "12px 22px" : "10px 18px",
            borderRadius: t.radius.button,
            border: `2px solid ${c.primary}`,
            background: isAffordance ? c.surfaceAlt : "transparent",
            color: c.primary,
            cursor: "pointer",
            minHeight: isReadability ? 48 : 40,
          }}
        >
          ⚙ Comfort {isAffordance ? (comfortOpen ? "▾" : "▸ click to open") : comfortOpen ? "▾" : "▸"}
        </button>
      </header>

      {/* Comfort drawer */}
      {comfortOpen && (
        <div style={{ background: c.surfaceAlt, borderBottom: `1px solid ${c.border}`, padding: "24px 56px" }}>
          <div style={{ fontWeight: 700, marginBottom: 16, color: c.text, fontSize: isReadability ? 19 : 17 }}>
            Comfort & accessibility
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isReadability ? "repeat(2, 1fr)" : isHierarchy ? "repeat(3, 1fr)" : "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {t.comfortControls.map((ctrl) => (
              <div
                key={ctrl.label}
                style={{
                  background: c.surface,
                  border: interactiveOutline,
                  borderRadius: t.radius.card,
                  padding: "14px 16px",
                }}
              >
                <div style={{ color: c.textMuted, fontSize: isReadability ? 16 : 14, marginBottom: 4 }}>{ctrl.label}</div>
                <div style={{ fontWeight: 600, color: c.text, fontSize: isReadability ? 18 : 16 }}>{ctrl.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: isHierarchy ? "88px 56px 64px" : sectionPad }}>
        <div
          style={{
            color: c.textMuted,
            textTransform: "uppercase",
            fontSize: isReadability ? 14 : 13,
            letterSpacing: "0.12em",
            marginBottom: isHierarchy ? 20 : 12,
          }}
        >
          calm · minimal · focus-first
        </div>
        <h1
          style={{
            fontFamily: headingFont,
            fontSize: isHierarchy ? 52 : isReadability ? 38 : t.type.display,
            fontWeight: 700,
            margin: "0 0 20px 0",
            color: c.text,
            lineHeight: isHierarchy ? 1.1 : 1.2,
            maxWidth: isHierarchy ? 860 : maxReadableWidth,
          }}
        >
          {isReadability
            ? "A quieter way to learn. At your pace. With no surprises."
            : "A quieter way to learn — at your pace, with no surprises."}
        </h1>
        <p
          style={{
            color: c.textMuted,
            maxWidth: isReadability ? "60ch" : 720,
            margin: "0 0 32px 0",
            fontSize: isReadability ? 19 : t.type.body,
            lineHeight: isReadability ? 1.85 : 1.6,
          }}
        >
          {isReadability
            ? "Built for learners who need calm. Soft colors. Slow motion. Plain words. One thing at a time."
            : t.bestFor}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <PrimaryCTA>{isReadability ? "Start now" : "Continue"}</PrimaryCTA>
          <SecondaryCTA>Save for later</SecondaryCTA>
          {isAffordance && (
            <span style={{ color: c.textMuted, fontSize: 14, marginLeft: 8 }}>
              ← these are buttons. Press one.
            </span>
          )}
        </div>
      </section>

      {/* AI TUTOR */}
      <section style={{ padding: sectionPad, borderTop: sectionBorder }}>
        <SectionTitle n={1} label={isHierarchy ? "Meet your tutor" : "AI tutor surface"} />
        <div
          style={{
            background: c.surface,
            border: interactiveOutline,
            borderRadius: t.radius.card,
            padding: isReadability ? 32 : 28,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: isReadability ? 32 : 24,
            boxShadow: cardShadow,
            maxWidth: isHierarchy ? 820 : "none",
          }}
        >
          <div
            style={{
              width: isReadability ? 84 : 72,
              height: isReadability ? 84 : 72,
              borderRadius: 999,
              background: c.surfaceAlt,
              border: `2px solid ${c.primary}`,
              display: "grid",
              placeItems: "center",
              fontFamily: headingFont,
              fontWeight: 700,
              fontSize: isReadability ? 32 : 28,
              color: c.primary,
            }}
          >
            S
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
              <strong style={{ fontFamily: headingFont, fontSize: isReadability ? 26 : t.type.h2, color: c.text }}>
                Sam
              </strong>
              <span style={{ color: c.textMuted, fontSize: isReadability ? 17 : 15 }}>your tutor</span>
            </div>
            <div style={{ marginBottom: 16, color: c.text, maxWidth: isReadability ? "55ch" : "none" }}>
              {isReadability ? "I am picking this lesson for you." : t.tutorCopy.confidence}
            </div>
            <button
              onClick={() => setReasoningOpen((x) => !x)}
              style={{
                background: isAffordance ? c.surfaceAlt : "transparent",
                border: isAffordance ? `2px solid ${c.primary}` : "none",
                color: c.primary,
                cursor: "pointer",
                fontWeight: 600,
                padding: isAffordance ? "10px 16px" : 0,
                fontSize: isReadability ? 17 : 15,
                textDecoration: isAffordance ? "none" : "underline",
                textUnderlineOffset: 3,
                borderRadius: t.radius.button,
              }}
            >
              {reasoningOpen ? "Hide reasoning ▴" : `${t.tutorCopy.pickedHeading} ${isAffordance ? "▾  click to expand" : "▾"}`}
            </button>
            {reasoningOpen && (
              <div
                style={{
                  marginTop: 14,
                  padding: 16,
                  background: c.surfaceAlt,
                  borderRadius: t.radius.input,
                  color: c.text,
                  borderLeft: `3px solid ${c.primary}`,
                  maxWidth: isReadability ? "55ch" : "none",
                }}
              >
                {isReadability
                  ? "Last time you finished 7 of 8 problems. You did better when we drew the math out. So I am picking that way again."
                  : t.tutorCopy.rationale}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <PrimaryCTA>Start</PrimaryCTA>
              <SecondaryCTA>{t.tutorCopy.altAction}</SecondaryCTA>
            </div>
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section style={{ padding: sectionPad, borderTop: sectionBorder }}>
        <SectionTitle n={2} label={isHierarchy ? "Today's lessons" : "Lesson cards"} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isHierarchy ? "1fr" : isReadability ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
            gap: isReadability ? 24 : 20,
            maxWidth: isHierarchy ? 720 : "none",
          }}
        >
          {[
            { title: "Subtraction with regrouping", meta: "12 min · math" },
            { title: "Reading: Otto's garden", meta: "8 min · reading" },
            { title: "Feelings & breathing", meta: "5 min · SEL" },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: c.surface,
                border: interactiveOutline,
                borderRadius: t.radius.card,
                padding: isReadability ? 28 : 24,
                boxShadow: cardShadow,
                position: "relative",
              }}
            >
              {isAffordance && (
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 14,
                    color: c.primary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ▸ tap card
                </span>
              )}
              <div style={{ color: c.textMuted, fontSize: isReadability ? 16 : 14, marginBottom: 10 }}>{card.meta}</div>
              <div
                style={{
                  fontFamily: headingFont,
                  fontSize: isHierarchy ? 26 : isReadability ? 22 : t.type.h2,
                  fontWeight: 600,
                  marginBottom: 16,
                  color: c.text,
                  lineHeight: 1.25,
                }}
              >
                {card.title}
              </div>
              <PrimaryCTA>{i === 0 ? "Continue" : "Save for later"}</PrimaryCTA>
            </div>
          ))}
        </div>
      </section>

      {/* INPUTS */}
      <section style={{ padding: sectionPad, borderTop: sectionBorder }}>
        <SectionTitle n={3} label="Inputs & forms" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isHierarchy || isReadability ? "1fr" : "1fr 1fr",
            gap: 24,
            maxWidth: isReadability ? "60ch" : isHierarchy ? 640 : "none",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                color: c.text,
                fontWeight: 700,
                marginBottom: 8,
                fontSize: isReadability ? 17 : 15,
              }}
            >
              Your name
            </label>
            <input
              defaultValue="Jamie"
              style={{
                width: "100%",
                padding: isReadability ? "18px 18px" : "14px 16px",
                background: c.surface,
                border: inputBorder,
                borderRadius: t.radius.input,
                color: c.text,
                fontSize: isReadability ? 19 : t.type.body,
                fontFamily: bodyFont,
                outline: "none",
                minHeight: isReadability ? 60 : 52,
              }}
            />
            <div style={{ color: c.textMuted, fontSize: isReadability ? 16 : 14, marginTop: 8 }}>
              {isReadability ? "We use this to greet you. We never share it." : "We use this to greet you. We never share it."}
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: c.text, fontWeight: 700, marginBottom: 8, fontSize: isReadability ? 17 : 15 }}>
              Email address
            </label>
            <input
              defaultValue="not-a-real-email"
              style={{
                width: "100%",
                padding: isReadability ? "18px 18px" : "14px 16px",
                background: c.surface,
                border: `2px solid ${c.danger}`,
                borderRadius: t.radius.input,
                color: c.text,
                fontSize: isReadability ? 19 : t.type.body,
                fontFamily: bodyFont,
                outline: "none",
                minHeight: isReadability ? 60 : 52,
              }}
            />
            <div style={{ color: c.danger, fontSize: isReadability ? 16 : 14, marginTop: 8, fontWeight: 600 }}>
              {isReadability ? "This needs an at-sign to be a valid email." : "This needs an @ sign to be a valid email."}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESS */}
      <section style={{ padding: sectionPad, borderTop: sectionBorder }}>
        <SectionTitle n={4} label="Progress" />
        <div
          style={{
            background: c.surface,
            border: interactiveOutline,
            borderRadius: t.radius.card,
            padding: isReadability ? 32 : 28,
            maxWidth: isHierarchy ? 640 : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ color: c.textMuted, fontSize: isReadability ? 17 : 15 }}>{t.progressLabel}</span>
            <span style={{ color: c.text, fontWeight: 700, fontSize: isReadability ? 22 : isHierarchy ? 24 : 18 }}>
              37%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: isReadability ? 12 : isHierarchy ? 8 : 4,
              background: c.surfaceAlt,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div style={{ width: "37%", height: "100%", background: c.primary, borderRadius: 999 }} />
          </div>
        </div>
      </section>

      {/* Tradeoff footer */}
      <section
        style={{
          padding: "32px 56px 56px",
          borderTop: sectionBorder,
          background: c.surfaceAlt,
        }}
      >
        <div
          style={{
            fontFamily: bodyFont,
            color: c.text,
            fontSize: isReadability ? 17 : 14,
            lineHeight: 1.6,
            maxWidth: isReadability ? "60ch" : 800,
          }}
        >
          {v.tradeoff}
        </div>
      </section>

      {/* V2 only — sticky action bar */}
      {isAffordance && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: c.surface,
            borderTop: `2px solid ${c.primary}`,
            padding: "14px 56px",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            boxShadow: "0 -4px 12px rgba(46, 58, 79, 0.08)",
          }}
        >
          <SecondaryCTA>Save & exit</SecondaryCTA>
          <PrimaryCTA>Continue to next lesson</PrimaryCTA>
        </div>
      )}
    </div>
  );
}
