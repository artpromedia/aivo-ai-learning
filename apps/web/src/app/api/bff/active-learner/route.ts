/**
 * /api/bff/active-learner
 *
 *   GET    — return the current active learner (or null)
 *   POST   — set the active learner (`{ learnerId }`)
 *   DELETE — clear the active learner
 *
 * All three verbs re-validate authorization against the caller's
 * learner access scope, so an attacker who guesses a learner id
 * cannot pin the cookie to it.
 */
import type { NextRequest } from "next/server";
import { bffFailure, bffSuccess } from "@/lib/v2/bff/response";
import { getOrCreateRequestId } from "@/lib/v2/bff/request-id";
import { getRequiredSession } from "@/lib/v2/bff/session";
import {
  clearActiveLearner,
  getActiveLearner,
  setActiveLearner,
} from "@/lib/v2/bff/active-learner";
import { assertCanAccessLearner } from "@/lib/v2/bff/authorization";
import {
  BffErrorException,
  bffError,
  isBffErrorException,
} from "@/lib/v2/bff/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface BffActiveLearnerBody {
  activeLearner: {
    id: string;
    displayName: string;
    readinessState?: string;
  } | null;
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  try {
    const session = await getRequiredSession(request);
    const current = await getActiveLearner(session);
    if (!current) {
      return bffSuccess<BffActiveLearnerBody>({ activeLearner: null }, requestId);
    }
    try {
      const access = await assertCanAccessLearner(
        session,
        current.learnerId,
        requestId,
      );
      return bffSuccess<BffActiveLearnerBody>(
        {
          activeLearner: {
            id: access.learner.id,
            displayName: (access.learner.name as string | undefined) ?? "Learner",
          },
        },
        requestId,
      );
    } catch {
      // Stale cookie — treat as no active learner.
      return bffSuccess<BffActiveLearnerBody>({ activeLearner: null }, requestId);
    }
  } catch (err) {
    if (isBffErrorException(err)) return bffFailure(err.bff, requestId);
    return bffFailure(
      bffError("UNKNOWN_ERROR", {
        message: err instanceof Error ? err.message : "unknown error",
      }),
      requestId,
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  try {
    const session = await getRequiredSession(request);
    let body: { learnerId?: unknown } = {};
    try {
      body = (await request.json()) as { learnerId?: unknown };
    } catch {
      throw new BffErrorException(
        bffError("VALIDATION_ERROR", { message: "Request body is not valid JSON" }),
      );
    }
    if (typeof body.learnerId !== "string" || body.learnerId.length === 0) {
      throw new BffErrorException(
        bffError("VALIDATION_ERROR", { message: "learnerId is required" }),
      );
    }
    const access = await assertCanAccessLearner(session, body.learnerId, requestId);
    await setActiveLearner(session, access.learner.id);
    return bffSuccess<BffActiveLearnerBody>(
      {
        activeLearner: {
          id: access.learner.id,
          displayName: (access.learner.name as string | undefined) ?? "Learner",
        },
      },
      requestId,
    );
  } catch (err) {
    if (isBffErrorException(err)) return bffFailure(err.bff, requestId);
    return bffFailure(
      bffError("UNKNOWN_ERROR", {
        message: err instanceof Error ? err.message : "unknown error",
      }),
      requestId,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  try {
    const session = await getRequiredSession(request);
    await clearActiveLearner(session);
    return bffSuccess<BffActiveLearnerBody>({ activeLearner: null }, requestId);
  } catch (err) {
    if (isBffErrorException(err)) return bffFailure(err.bff, requestId);
    return bffFailure(
      bffError("UNKNOWN_ERROR", {
        message: err instanceof Error ? err.message : "unknown error",
      }),
      requestId,
    );
  }
}
