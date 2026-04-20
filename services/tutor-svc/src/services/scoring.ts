/**
 * Tutor session scoring. Implementation lives in learning-svc/services/scoring.ts;
 * it is re-implemented here to avoid coupling the two services at the package
 * boundary. Keep the formulas in sync with docs/xp-quality-metrics.md.
 */

export interface TutorSignals {
  durationSeconds: number;
  functioningLevel: string;
  messageCount: number;
  beatsCompleted?: number;
  beatsTotal?: number;
  correctAnswers?: number;
  attemptedAnswers?: number;
  engagementBeats?: number;
  breaksUsed?: number;
  masteryDelta?: number;
}

const FUNCTIONING_LEVEL_ENGAGEMENT_WEIGHT: Record<string, number> = {
  STANDARD: 1.0,
  SUPPORTED: 1.5,
  LOW_VERBAL: 2.0,
  NON_VERBAL: 2.5,
  PRE_SYMBOLIC: 3.5,
};

const PRE_SYMBOLIC_LEVELS = new Set(["NON_VERBAL", "PRE_SYMBOLIC"]);

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function computeTutorXp(s: TutorSignals): number {
  const durationMinutes = (s.durationSeconds || 0) / 60;
  const correct = s.correctAnswers ?? 0;
  const masteryDelta = s.masteryDelta ?? 0;
  const engagementBeats =
    s.engagementBeats ?? Math.max(0, Math.floor(s.messageCount / 2));
  const levelWeight =
    FUNCTIONING_LEVEL_ENGAGEMENT_WEIGHT[s.functioningLevel] ??
    FUNCTIONING_LEVEL_ENGAGEMENT_WEIGHT.STANDARD;

  if (PRE_SYMBOLIC_LEVELS.has(s.functioningLevel)) {
    const engagementXp = engagementBeats * levelWeight * 4;
    const durationBonus = Math.min(durationMinutes * 2, 20);
    const masteryBonus = Math.max(0, masteryDelta) * 50;
    return Math.round(clamp(engagementXp + durationBonus + masteryBonus, 0, 100));
  }

  const baseXp = correct * 10;
  const durationBonus = Math.min(durationMinutes * 2, 20);
  const masteryBonus = Math.max(0, masteryDelta) * 50;
  const levelEngagementBonus = levelWeight * engagementBeats;
  return Math.round(clamp(baseXp + durationBonus + masteryBonus + levelEngagementBonus, 0, 100));
}

export function computeTutorQuality(s: TutorSignals): number {
  const completionRate =
    s.beatsTotal && s.beatsTotal > 0
      ? clamp((s.beatsCompleted ?? 0) / s.beatsTotal, 0, 1)
      : clamp(s.messageCount / 6, 0, 1);

  const correctnessRate =
    s.attemptedAnswers && s.attemptedAnswers > 0
      ? clamp((s.correctAnswers ?? 0) / s.attemptedAnswers, 0, 1)
      : PRE_SYMBOLIC_LEVELS.has(s.functioningLevel)
        ? 0.7
        : 0.5;

  const breaks = s.breaksUsed ?? 0;
  const engagementScore = clamp(1 - breaks * 0.1, 0.3, 1);

  const minutes = (s.durationSeconds || 0) / 60;
  let timeOnTaskScore: number;
  if (minutes < 2) timeOnTaskScore = 0.4;
  else if (minutes < 5) timeOnTaskScore = 0.7;
  else if (minutes <= 25) timeOnTaskScore = 1.0;
  else if (minutes <= 45) timeOnTaskScore = 0.8;
  else timeOnTaskScore = 0.5;

  const score =
    completionRate * 0.30 +
    correctnessRate * 0.35 +
    engagementScore * 0.15 +
    timeOnTaskScore * 0.20;

  return Math.round(clamp(score, 0, 1) * 100) / 100;
}
