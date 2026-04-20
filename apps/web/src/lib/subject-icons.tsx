import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  BookOpen,
  FlaskConical,
  Landmark,
  Code2,
  Users2,
  Heart,
  MessageCircle,
  Puzzle,
  Home,
  Target,
  Palette,
  Eye,
  GraduationCap,
} from "lucide-react";

export const SUBJECT_ICON: Record<string, LucideIcon> = {
  math: Calculator,
  ela: BookOpen,
  reading: BookOpen,
  english: BookOpen,
  science: FlaskConical,
  history: Landmark,
  social_studies: Landmark,
  coding: Code2,
  computer_science: Code2,
  social: Users2,
  sel: Heart,
  speech: MessageCircle,
  communication: MessageCircle,
  executive_function: Puzzle,
  daily_living: Home,
  cause_effect: Target,
  sensory_engagement: Palette,
  social_awareness: Eye,
  other: GraduationCap,
};

export function subjectIcon(key?: string): LucideIcon {
  if (!key) return GraduationCap;
  return SUBJECT_ICON[key.toLowerCase()] || GraduationCap;
}
