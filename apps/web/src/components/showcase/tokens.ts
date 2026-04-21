export type DirectionTokens = {
  id: "stillwater" | "lumen" | "quest";
  name: string;
  tagline: string;
  bestFor: string;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryText: string;
    accent: string;
    accentText: string;
    success: string;
    warning: string;
    danger: string;
    focusRing: string;
  };
  palette: { hex: string; name: string; role: string; textOn: "light" | "dark" }[];
  fonts: {
    heading: string;
    body: string;
    headingStack: string;
    bodyStack: string;
  };
  type: { display: number; h1: number; h2: number; body: number; small: number };
  radius: { card: number; button: number; input: number };
  motion: string;
  ctaCopy: { primary: string; secondary: string; ghost: string };
  tutorCopy: {
    name: string;
    pickedHeading: string;
    rationale: string;
    confidence: string;
    altAction: string;
  };
  comfortControls: { label: string; value: string }[];
  progressLabel: string;
};

export const STILLWATER: DirectionTokens = {
  id: "stillwater",
  name: "Stillwater",
  tagline: "calm  ·  minimal  ·  focus-first",
  bestFor:
    "ND learners with high sensory sensitivity · autism with overwhelm patterns · anxiety profiles · clinical sessions · evening lessons.",
  colors: {
    bg: "#F8FAFD",
    surface: "#FFFFFF",
    surfaceAlt: "#E8EEF6",
    text: "#2E3A4F",
    textMuted: "#A8B2C5",
    border: "#D7DEEA",
    primary: "#5B7CFF",
    primaryText: "#FFFFFF",
    accent: "#5B7CFF",
    accentText: "#FFFFFF",
    success: "#5B7CFF",
    warning: "#9C6B3F",
    danger: "#9C4F4F",
    focusRing: "#5B7CFF",
  },
  palette: [
    { hex: "#2E3A4F", name: "Slate", role: "primary text", textOn: "light" },
    { hex: "#5B7CFF", name: "Cobalt", role: "single accent", textOn: "light" },
    { hex: "#E8EEF6", name: "Mist", role: "surface", textOn: "dark" },
    { hex: "#F8FAFD", name: "Paper", role: "background", textOn: "dark" },
    { hex: "#A8B2C5", name: "Silver", role: "secondary text", textOn: "dark" },
  ],
  fonts: {
    heading: "Inter Tight",
    body: "Inter",
    headingStack:
      "'Inter Tight', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    bodyStack: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  type: { display: 36, h1: 28, h2: 22, body: 17, small: 15 },
  radius: { card: 12, button: 8, input: 8 },
  motion: "200ms ease-out · single transform (opacity + 4px lift) · reduced-motion = OFF",
  ctaCopy: {
    primary: "Continue",
    secondary: "Save for later",
    ghost: "Not today",
  },
  tutorCopy: {
    name: "Sam",
    pickedHeading: "Why this lesson?",
    rationale:
      "Last session you finished 7 of 8 problems. You found subtraction with regrouping easier when we drew it out. I am picking that approach again.",
    confidence: "I am picking this lesson.",
    altAction: "Pick a different one",
  },
  comfortControls: [
    { label: "Quiet mode", value: "on" },
    { label: "Reading font", value: "Atkinson Hyperlegible" },
    { label: "Larger text", value: "+15%" },
    { label: "Single color surface", value: "Mist" },
    { label: "Captions", value: "on" },
    { label: "Sound", value: "muted" },
    { label: "Take a break", value: "10 min" },
  ],
  progressLabel: "Lesson 3 of 8",
};

export const LUMEN: DirectionTokens = {
  id: "lumen",
  name: "Lumen",
  tagline: "warm  ·  narrative  ·  companion-driven",
  bestFor:
    "Learners who thrive on story and relationship · SEL · literacy and language · family co-learning · ages 6–10.",
  colors: {
    bg: "#FBF1E5",
    surface: "#FFF8EE",
    surfaceAlt: "#F4E3CC",
    text: "#2A1810",
    textMuted: "#6F4E37",
    border: "#E5D2B3",
    primary: "#E76F51",
    primaryText: "#FFF8EE",
    accent: "#F2A66B",
    accentText: "#2A1810",
    success: "#6F8B4A",
    warning: "#C9722A",
    danger: "#A8443A",
    focusRing: "#E76F51",
  },
  palette: [
    { hex: "#2A1810", name: "Espresso", role: "primary text", textOn: "light" },
    { hex: "#E76F51", name: "Terracotta", role: "primary accent", textOn: "light" },
    { hex: "#F2A66B", name: "Amber", role: "secondary accent", textOn: "dark" },
    { hex: "#FBF1E5", name: "Cream", role: "background", textOn: "dark" },
    { hex: "#6F4E37", name: "Coffee", role: "secondary text", textOn: "light" },
  ],
  fonts: {
    heading: "Fraunces",
    body: "Source Serif 4",
    headingStack: "'Fraunces', Georgia, 'Times New Roman', serif",
    bodyStack: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  },
  type: { display: 40, h1: 30, h2: 24, body: 18, small: 16 },
  radius: { card: 18, button: 12, input: 12 },
  motion: "280ms ease-in-out · cross-fade transitions · soft glow on tutor speech · reduced-motion = static",
  ctaCopy: {
    primary: "Let's read together",
    secondary: "Show me what you found",
    ghost: "Maybe another time",
  },
  tutorCopy: {
    name: "Ms. Iris",
    pickedHeading: "Why this story?",
    rationale:
      "I picked this story for us because last time you got curious about whales — and this one is about an octopus that keeps a garden. I think you'll love meeting Otto.",
    confidence: "I'd love to read this with you.",
    altAction: "Try a different one",
  },
  comfortControls: [
    { label: "Tutor voice", value: "warm" },
    { label: "Reading pace", value: "steady" },
    { label: "Background sound", value: "soft café" },
    { label: "Reading font", value: "Lexend" },
    { label: "Larger text", value: "+10%" },
    { label: "Captions", value: "on" },
    { label: "Take a break", value: "10 min" },
  ],
  progressLabel: "Today's landmark · 3 of 8 along our path",
};

export const QUEST: DirectionTokens = {
  id: "quest",
  name: "Quest",
  tagline: "playful  ·  gamified  ·  momentum",
  bestFor:
    "Learners with ADHD · younger learners (4–9) · engagement-recovery contexts · daily-habit building · subjects the learner has previously struggled with.",
  colors: {
    bg: "#1A1B3A",
    surface: "#252652",
    surfaceAlt: "#2F3168",
    text: "#FFFFFF",
    textMuted: "#A5A6CC",
    border: "#3A3D7A",
    primary: "#8B5CF6",
    primaryText: "#FFFFFF",
    accent: "#FBBF24",
    accentText: "#1A1B3A",
    success: "#34D399",
    warning: "#FBBF24",
    danger: "#F472B6",
    focusRing: "#FBBF24",
  },
  palette: [
    { hex: "#1A1B3A", name: "Deep Indigo", role: "primary surface", textOn: "light" },
    { hex: "#8B5CF6", name: "Electric Violet", role: "primary CTA", textOn: "light" },
    { hex: "#34D399", name: "Mint", role: "progress + success", textOn: "dark" },
    { hex: "#FBBF24", name: "Gold", role: "rewards + coins", textOn: "dark" },
    { hex: "#F472B6", name: "Pink", role: "celebration", textOn: "light" },
  ],
  fonts: {
    heading: "Fredoka",
    body: "Nunito",
    headingStack:
      "'Fredoka', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    bodyStack: "Nunito, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  type: { display: 44, h1: 32, h2: 24, body: 18, small: 16 },
  radius: { card: 20, button: 16, input: 14 },
  motion: "180ms ease-out · spring physics on celebration · count-ups · reduced-motion forces Reward Intensity = OFF",
  ctaCopy: {
    primary: "Continue quest",
    secondary: "Pick a side mission",
    ghost: "Take a break",
  },
  tutorCopy: {
    name: "Captain Nova",
    pickedHeading: "Why this mission?",
    rationale:
      "You crushed yesterday's word problems — 8 of 10 with regrouping. This mission is the boss version: same skill, harder numbers. I think you're ready for it.",
    confidence: "Next-level mission unlocked.",
    altAction: "Pick a different mission",
  },
  comfortControls: [
    { label: "Reward intensity", value: "Standard" },
    { label: "Streak pause", value: "available" },
    { label: "Sound", value: "on" },
    { label: "Haptics", value: "light" },
    { label: "Reading font", value: "Lexend" },
    { label: "Larger text", value: "+15%" },
    { label: "Take a break", value: "10 min" },
  ],
  progressLabel: "Mission 3 of 8 · 250 XP earned today",
};

export const ALL_DIRECTIONS: Record<string, DirectionTokens> = {
  stillwater: STILLWATER,
  lumen: LUMEN,
  quest: QUEST,
};
