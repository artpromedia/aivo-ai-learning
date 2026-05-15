/**
 * Authorization helpers for the AIVO v2 BFF.
 *
 * These assertions decide whether a session may touch a given
 * learner profile. The policy is deliberately conservative: the
 * default outcome is "no", and each role widens the answer only for
 * learners that exist in its scope.
 *
 * The lookups are performed against identity-svc's
 * `/api/users/learners` endpoint — the same source the existing
 * parent and learner dashboards use. We do not duplicate the access
 * graph here; we read it.
 */
import { BffErrorException, bffError } from "./errors.js";
import { callService } from "./service-client.js";
import type { BffSession } from "./session.js";

export interface LearnerRecord {
  id: string;
  userId?: string | null;
  parentId?: string | null;
  tenantId?: string | null;
  name?: string;
  gradeLevel?: string;
  [key: string]: unknown;
}

export interface LearnerAccess {
  learner: LearnerRecord;
  relationship: "self" | "parent" | "caregiver" | "teacher" | "therapist" | "platform_admin" | "district_admin";
}

export interface AuthorizationDeps {
  /** Returns the learner records the session may see. */
  listAccessibleLearners(session: BffSession, requestId: string): Promise<LearnerRecord[]>;
}

/**
 * Default deps that hit identity-svc. Pure functions in this file
 * accept a `deps` argument so unit tests can stub the lookup
 * without mocking the global fetch.
 */
export const defaultAuthorizationDeps: AuthorizationDeps = {
  async listAccessibleLearners(session, requestId) {
    const tenantId = session.tenantId ?? "";
    const res = await callService<LearnerRecord[]>({
      service: "identity",
      path: "/api/users/learners",
      method: "GET",
      session,
      tenantId,
      requestId,
    });
    return Array.isArray(res.data) ? res.data : [];
  },
};

function relationshipFor(session: BffSession, learner: LearnerRecord): LearnerAccess["relationship"] | null {
  switch (session.role) {
    case "LEARNER":
      return learner.userId === session.userId || learner.id === session.userId ? "self" : null;
    case "PARENT":
      return learner.parentId === session.userId ? "parent" : null;
    case "CAREGIVER":
      return "caregiver";
    case "TEACHER":
      return "teacher";
    case "THERAPIST":
      return "therapist";
    case "DISTRICT_ADMIN":
      return "district_admin";
    case "PLATFORM_ADMIN":
      return "platform_admin";
    default:
      return null;
  }
}

/**
 * Assert that the session may access the given learner. Returns the
 * resolved `LearnerAccess` record (caller can use it to derive
 * tenant). Throws `INVALID_LEARNER_ACCESS` if the learner is not
 * reachable, `LEARNER_NOT_FOUND` if it does not exist at all.
 */
export async function assertCanAccessLearner(
  session: BffSession,
  learnerId: string,
  requestId: string,
  deps: AuthorizationDeps = defaultAuthorizationDeps,
): Promise<LearnerAccess> {
  const learners = await deps.listAccessibleLearners(session, requestId);
  const match = learners.find((l) => l.id === learnerId);
  if (!match) {
    // A learner the session cannot list is treated as `INVALID_LEARNER_ACCESS`
    // rather than `LEARNER_NOT_FOUND` so we don't leak the existence of
    // unrelated learner profiles to unrelated callers.
    throw new BffErrorException(bffError("INVALID_LEARNER_ACCESS"));
  }
  const relationship = relationshipFor(session, match);
  if (!relationship) throw new BffErrorException(bffError("INVALID_LEARNER_ACCESS"));
  return { learner: match, relationship };
}

/**
 * Same as `assertCanAccessLearner`, but additionally requires that
 * the caller may modify the learner profile (settings, IEP,
 * accommodations, onboarding). LEARNER itself cannot manage its own
 * profile in v2; that is a parent/caregiver/admin operation.
 */
export async function assertCanManageLearner(
  session: BffSession,
  learnerId: string,
  requestId: string,
  deps: AuthorizationDeps = defaultAuthorizationDeps,
): Promise<LearnerAccess> {
  const access = await assertCanAccessLearner(session, learnerId, requestId, deps);
  if (access.relationship === "self") {
    throw new BffErrorException(
      bffError("FORBIDDEN", { message: "Learner accounts cannot manage their own profile" }),
    );
  }
  if (access.relationship === "teacher" || access.relationship === "therapist") {
    throw new BffErrorException(
      bffError("FORBIDDEN", { message: "Educator roles cannot manage parent-owned profile fields" }),
    );
  }
  return access;
}

export async function assertCanViewLearnerProgress(
  session: BffSession,
  learnerId: string,
  requestId: string,
  deps: AuthorizationDeps = defaultAuthorizationDeps,
): Promise<LearnerAccess> {
  // Progress is readable to every role that may access the learner.
  // We keep the function distinct so a future tightening (e.g.
  // hiding progress from a connected caregiver) is a one-line edit.
  return assertCanAccessLearner(session, learnerId, requestId, deps);
}
