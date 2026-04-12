export const EVENTS = {
  ASSESSMENT_COMPLETED: "assessment.completed",
  ASSESSMENT_STARTED: "assessment.started",
  BRAIN_CLONE_REQUESTED: "brain.clone.requested",
  BRAIN_CLONE_COMPLETED: "brain.clone.completed",
  BRAIN_SNAPSHOT_CREATED: "brain.snapshot.created",
  BRAIN_RECOMMENDATION_CREATED: "brain.recommendation.created",
  BRAIN_RECOMMENDATION_RESOLVED: "brain.recommendation.resolved",
  USER_REGISTERED: "user.registered",
  USER_LOGGED_IN: "user.logged_in",
  LEARNER_CREATED: "learner.created",
  LEARNER_LEVEL_CHANGED: "learner.level_changed",
  IEP_UPLOADED: "iep.uploaded",
  IEP_PARSED: "iep.parsed",
  XP_EARNED: "engagement.xp_earned",
  BADGE_AWARDED: "engagement.badge_awarded",
  STREAK_UPDATED: "engagement.streak_updated",
  TUTOR_ACTIVATED: "tutor.activated",
  TUTOR_DEACTIVATED: "tutor.deactivated",
  TUTOR_SESSION_STARTED: "tutor.session.started",
  TUTOR_SESSION_COMPLETED: "tutor.session.completed",
  LESSON_SESSION_STARTED: "learner.session.started",
  LESSON_SESSION_COMPLETED: "learner.session.completed",
  CONTENT_GENERATED: "content.generated",
  CONTENT_QUALITY_FAILED: "content.quality.failed",
  MASTERY_UPDATED: "brain.mastery.updated",
  CONSENT_GRANTED: "consent.granted",
  CONSENT_REVOKED: "consent.revoked",
  SUBSCRIPTION_CHANGED: "subscription.changed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface AivoEvent<T = unknown> {
  id: string;
  type: EventName;
  tenantId: string;
  timestamp: string;
  payload: T;
  source: string;
}

export interface AssessmentCompletedPayload {
  attemptId: string;
  learnerId: string;
  type: string;
  domainScores: Record<string, number>;
}

export interface BrainCloneRequestedPayload {
  learnerId: string;
  assessmentId: string;
  functioningLevel: string;
  parentAssessmentId?: string;
  iepProfileId?: string;
}

export interface BrainCloneCompletedPayload {
  learnerId: string;
  brainStateId: string;
  snapshotId: string;
  version: number;
}

export interface LearnerLevelChangedPayload {
  learnerId: string;
  previousLevel: string;
  newLevel: string;
  reason: string;
}

export interface TutorSessionCompletedPayload {
  sessionId: string;
  learnerId: string;
  tutorSku: string;
  tutorName: string;
  skillsFocused: string[];
  masteryUpdates: Record<string, number>;
  durationSeconds: number;
  completionQuality: number;
  xpEarned: number;
}

export interface LessonSessionCompletedPayload {
  sessionId: string;
  learnerId: string;
  subject: string;
  contentType: string;
  masteryBefore: Record<string, number>;
  masteryAfter: Record<string, number>;
  xpEarned: number;
  durationSeconds: number;
}

export interface ContentGeneratedPayload {
  sessionId: string;
  learnerId: string;
  subject: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  qualityScore: number;
}

export interface MasteryUpdatedPayload {
  learnerId: string;
  subject: string;
  skill: string;
  previousScore: number;
  newScore: number;
  source: string;
}
