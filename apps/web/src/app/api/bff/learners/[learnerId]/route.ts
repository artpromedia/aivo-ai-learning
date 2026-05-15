/**
 * GET /api/bff/learners/[learnerId]
 *
 * Returns the public profile for one learner. Authorization is
 * checked by `assertCanAccessLearner`; an unrelated session sees
 * `INVALID_LEARNER_ACCESS` rather than `LEARNER_NOT_FOUND` so we do
 * not leak existence.
 */
import type { NextRequest } from "next/server";
import { bffFailure, bffSuccess } from "@/lib/v2/bff/response";
import { getOrCreateRequestId } from "@/lib/v2/bff/request-id";
import { getRequiredSession } from "@/lib/v2/bff/session";
import { assertCanAccessLearner } from "@/lib/v2/bff/authorization";
import {
  bffError,
  isBffErrorException,
} from "@/lib/v2/bff/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface BffLearnerDetail {
  id: string;
  displayName: string;
  gradeBand?: string;
  ageRange?: string;
  readinessState?: string;
  profileSummary?: string;
}

export interface BffLearnerDetailBody {
  learner: BffLearnerDetail;
}

function gradeBandFor(grade: unknown): string | undefined {
  if (typeof grade !== "string" || grade.length === 0) return undefined;
  const m = grade.match(/(\d{1,2})/);
  if (!m) return grade;
  const n = Number(m[1]);
  if (n <= 2) return "K-2";
  if (n <= 5) return "3-5";
  if (n <= 8) return "6-8";
  return "9-12";
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ learnerId: string }> },
) {
  const requestId = getOrCreateRequestId(request);
  try {
    const session = await getRequiredSession(request);
    const { learnerId } = await ctx.params;
    const access = await assertCanAccessLearner(session, learnerId, requestId);
    const learner = access.learner;
    const data: BffLearnerDetailBody = {
      learner: {
        id: learner.id,
        displayName: (learner.name as string | undefined) ?? "Learner",
        gradeBand: gradeBandFor(learner.gradeLevel),
      },
    };
    return bffSuccess(data, requestId);
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
