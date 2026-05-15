/**
 * GET /api/bff/learners/[learnerId]/context
 *
 * Frontend-safe learner context summary. The full learner context
 * (raw IEP text, free-form clinician notes, internal flags) is NOT
 * surfaced; this endpoint deliberately returns only the categorical
 * fields a v2 surface needs to render accommodations and
 * accessibility defaults.
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

export interface BffLearnerContextBody {
  learnerId: string;
  gradeBand?: string;
  hasIEP: boolean;
  disabilityCategories?: string[];
  accommodationSummary: Array<{
    type: string;
    label: string;
    learnerVisible: boolean;
  }>;
  accessibilityDefaults: {
    textSize?: string;
    readAloud?: boolean;
    reducedMotion?: boolean;
    highContrast?: boolean;
    dyslexiaFriendly?: boolean;
  };
  readinessState?: string;
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

    // Sprint 02 builds the contract; Sprint 03 wires in real values
    // from assessment-svc, family-svc (IEP), and brain-svc. Until
    // then the BFF returns a conservative, non-fabricated default:
    // no IEP, no accommodations, no accessibility overrides. We
    // never return raw IEP text from this endpoint regardless of
    // what upstream returns — the contract forbids it.
    const data: BffLearnerContextBody = {
      learnerId: access.learner.id,
      gradeBand: gradeBandFor(access.learner.gradeLevel),
      hasIEP: false,
      disabilityCategories: [],
      accommodationSummary: [],
      accessibilityDefaults: {},
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
