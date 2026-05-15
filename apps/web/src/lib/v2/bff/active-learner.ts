/**
 * Active-learner resolver.
 *
 * The "active learner" is the learner profile a session is currently
 * working on. It is stored in an HTTP-only cookie scoped to the
 * v2 surface so the value is never readable from the browser and
 * never leaks across users. The cookie carries only the learner id;
 * the BFF re-validates it against the caller's access scope on
 * every read.
 *
 * Cookie name: `aivo_active_learner_v2`
 * Cookie path: `/`
 * Cookie lifetime: 30 days; rotates on every successful set.
 */
import { cookies } from "next/headers";
import { BffErrorException, bffError } from "./errors.js";
import type { BffSession } from "./session.js";

const COOKIE_NAME = "aivo_active_learner_v2";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const LEARNER_ID_PATTERN = /^[a-zA-Z0-9._\-:]{4,128}$/;

export interface ActiveLearnerRecord {
  learnerId: string;
}

/**
 * Read the active-learner cookie. Returns `null` if no cookie is
 * present or if the cookie value fails shape validation.
 *
 * NOTE: this function does NOT verify that the caller still has
 * access to the learner. Callers must run authorization separately
 * (`assertCanAccessLearner`) before trusting the result.
 */
export async function getActiveLearner(_session: BffSession): Promise<ActiveLearnerRecord | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;
  if (!LEARNER_ID_PATTERN.test(value)) return null;
  return { learnerId: value };
}

export async function setActiveLearner(
  _session: BffSession,
  learnerId: string,
): Promise<ActiveLearnerRecord> {
  if (!LEARNER_ID_PATTERN.test(learnerId)) {
    throw new BffErrorException(
      bffError("VALIDATION_ERROR", {
        message: "learnerId failed shape validation",
        userMessage: "That learner profile is not valid.",
      }),
    );
  }
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: learnerId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return { learnerId };
}

export async function clearActiveLearner(_session: BffSession): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireActiveLearner(session: BffSession): Promise<ActiveLearnerRecord> {
  const current = await getActiveLearner(session);
  if (!current) throw new BffErrorException(bffError("ACTIVE_LEARNER_NOT_SET"));
  return current;
}

/** Internal test seam — pure validation, no cookie access. */
export const __test = { COOKIE_NAME, LEARNER_ID_PATTERN };
