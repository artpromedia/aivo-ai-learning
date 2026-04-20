/**
 * Multi-signal XP & completion-quality scoring for lesson and tutor sessions.
 * See docs/xp-quality-metrics.md for the full formula and rationale.
 */

export interface LessonSignals {
  durationSeconds: number;
  functioningLevel: string;
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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeLessonXp(s: LessonSignals): number {
  const durationMinutes = (s.durationSeconds || 0) / 60;
  const correct = s.correctAnswers ?? 0;
  const masteryDelta = s.masteryDelta ?? 0;
  const engagementBeats =
    s.engagementBeats ?? s.beatsCompleted ?? 0;
  const levelWeight =
    FUNCTIONING_LEVEL_ENGAGEMENT_WEIGHT[s.functioningLevel] ??
    FUNCTIONING_LEVEL_ENGAGEMENT_WEIGHT.STANDARD;

  // Pre-symbolic / non-verbal learners earn primarily for engagement,
  // not correctness — they may not produce "answers" at all.
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
  const total = baseXp + durationBonus + masteryBonus + levelEngagementBonus;
  return Math.round(clamp(total, 0, 100));
}

export function computeCompletionQuality(s: LessonSignals): number {
  const completionRate =
    s.beatsTotal && s.beatsTotal > 0
      ? clamp((s.beatsCompleted ?? 0) / s.beatsTotal, 0, 1)
      : 0.5;

  const correctnessRate =
    s.attemptedAnswers && s.attemptedAnswers > 0
      ? clamp((s.correctAnswers ?? 0) / s.attemptedAnswers, 0, 1)
      : PRE_SYMBOLIC_LEVELS.has(s.functioningLevel)
        ? 0.7 // Don't punish learners who can't produce answers.
        : 0.5;

  // Engagement: penalize high break usage, reward presence.
  const breaks = s.breaksUsed ?? 0;
  const engagementScore = clamp(1 - breaks * 0.1, 0.3, 1);

  // Time-on-task: ideal ~10–25 min for STANDARD; outside is penalized.
  const minutes = (s.durationSeconds || 0) / 60;
  let timeOnTaskScore: number;
  if (minutes < 2) timeOnTaskScore = 0.4; // too fast → guessing or skipped
  else if (minutes < 5) timeOnTaskScore = 0.7;
  else if (minutes <= 25) timeOnTaskScore = 1.0;
  else if (minutes <= 45) timeOnTaskScore = 0.8;
  else timeOnTaskScore = 0.5; // too slow → likely disengaged

  // Weighted: completion 0.30, correctness 0.35, engagement 0.15, time 0.20
  const score =
    completionRate * 0.30 +
    correctnessRate * 0.35 +
    engagementScore * 0.15 +
    timeOnTaskScore * 0.20;

  return Math.round(clamp(score, 0, 1) * 100) / 100;
}

export interface TutorSignals extends LessonSignals {
  messageCount: number;
}

export function computeTutorXp(s: TutorSignals): number {
  // For tutor sessions we treat each user message as an engagement beat unless
  // an explicit count was provided.
  return computeLessonXp({
    ...s,
    engagementBeats: s.engagementBeats ?? Math.max(0, Math.floor(s.messageCount / 2)),
  });
}

export function computeTutorQuality(s: TutorSignals): number {
  // Lacking beats data, treat messageCount as a proxy: ≥6 messages == full
  // completion, scaled linearly below that.
  const completionFromMessages =
    s.beatsTotal && s.beatsCompleted !== undefined
      ? undefined
      : clamp(s.messageCount / 6, 0, 1);

  return computeCompletionQuality({
    ...s,
    beatsCompleted: s.beatsCompleted ?? (completionFromMessages !== undefined ? Math.round(completionFromMessages * 10) : undefined),
    beatsTotal: s.beatsTotal ?? (completionFromMessages !== undefined ? 10 : undefined),
  });
}
