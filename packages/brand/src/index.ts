export const BRAND = {
  name: "AIVO",
  tagline: "AI-Powered Adaptive Learning for Every Child",
  colors: {
    primary: "#7C3AED",
    primaryLight: "#A78BFA",
    primaryDark: "#5B21B6",
    secondary: "#06B6D4",
    accent: "#F59E0B",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    surfaceHover: "#F1F5F9",
    text: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
  },
  fonts: {
    heading: "'Fredoka', sans-serif",
    body: "'Nunito', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radii: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  logos: {
    dark: "/images/aivo-logo-dark.png",
    purple: "/images/aivo-logo-purple.png",
    white: "/images/aivo-logo-white.png",
    favicon: "/images/favicon-192.png",
  },
} as const;

export const TUTORS = {
  nova: { name: "Nova", domain: "Mathematics", icon: "🔢", color: "#7C3AED", tier: "core", avatar: "/images/tutors/nova.png" },
  sage: { name: "Sage", domain: "English Language Arts", icon: "📚", color: "#10B981", tier: "core", avatar: "/images/tutors/sage.png" },
  spark: { name: "Spark", domain: "Science", icon: "🔬", color: "#F59E0B", tier: "core", avatar: "/images/tutors/spark.png" },
  chrono: { name: "Chrono", domain: "History & Social Studies", icon: "🏛️", color: "#6366F1", tier: "core", avatar: "/images/tutors/chrono.png" },
  pixel: { name: "Pixel", domain: "Coding & Computational Thinking", icon: "💻", color: "#06B6D4", tier: "core", avatar: "/images/tutors/pixel.png" },
  echo: { name: "Echo", domain: "Speech & Language Therapy", icon: "🗣️", color: "#EC4899", tier: "core", avatar: "/images/tutors/echo.png" },
  harmony: { name: "Harmony", domain: "Social-Emotional Learning", icon: "💜", color: "#8B5CF6", tier: "core", avatar: "/images/tutors/harmony.png" },
  atlas: { name: "Atlas", domain: "Geography & World Cultures", icon: "🌍", color: "#14B8A6", tier: "expansion", avatar: "/images/tutors/atlas.png" },
  cadence: { name: "Cadence", domain: "Music & Rhythm", icon: "🎵", color: "#D946EF", tier: "expansion", avatar: "/images/tutors/cadence.png" },
  vigor: { name: "Vigor", domain: "Physical Education & Health", icon: "🏃", color: "#22C55E", tier: "expansion", avatar: "/images/tutors/vigor.png" },
  lingua: { name: "Lingua", domain: "World Languages", icon: "🌐", color: "#0EA5E9", tier: "expansion", avatar: "/images/tutors/lingua.png" },
  forge: { name: "Forge", domain: "STEM & Engineering", icon: "⚙️", color: "#EF4444", tier: "expansion", avatar: "/images/tutors/forge.png" },
  compass: { name: "Compass", domain: "Life Skills & Executive Function", icon: "🧭", color: "#F97316", tier: "expansion", avatar: "/images/tutors/compass.png" },
  muse: { name: "Muse", domain: "Creative Arts & Expression", icon: "🎨", color: "#A855F7", tier: "expansion", avatar: "/images/tutors/muse.png" },
} as const;

export const FUNCTIONING_LEVELS = {
  STANDARD: {
    label: "Standard",
    description: "Full curriculum with grade-level content",
    assessmentMode: "STANDARD",
  },
  SUPPORTED: {
    label: "Supported",
    description: "Modified curriculum with scaffolding and accommodations",
    assessmentMode: "MODIFIED",
  },
  LOW_VERBAL: {
    label: "Low Verbal",
    description: "Picture-based interactions with reduced text",
    assessmentMode: "PICTURE_BASED",
  },
  NON_VERBAL: {
    label: "Non-Verbal",
    description: "Switch scanning and partner-assisted access",
    assessmentMode: "SWITCH_SCAN",
  },
  PRE_SYMBOLIC: {
    label: "Pre-Symbolic",
    description: "Cause-effect activities with observational assessment",
    assessmentMode: "OBSERVATIONAL",
  },
} as const;

export const ROLES = {
  PARENT: { label: "Parent / Guardian", canManageLearners: true },
  LEARNER: { label: "Learner", canManageLearners: false },
  TEACHER: { label: "Teacher", canManageLearners: false },
  CAREGIVER: { label: "Caregiver", canManageLearners: false },
  THERAPIST: { label: "Therapist", canManageLearners: false },
  DISTRICT_ADMIN: { label: "District Admin", canManageLearners: false },
  PLATFORM_ADMIN: { label: "Platform Admin", canManageLearners: false },
} as const;

export type TutorKey = keyof typeof TUTORS;
export type FunctioningLevel = keyof typeof FUNCTIONING_LEVELS;
export type UserRole = keyof typeof ROLES;
