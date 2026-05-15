/**
 * GET /api/bff/learners
 *
 * Returns every learner profile the authenticated session may
 * access. The shape is frontend-safe — internal fields (raw IEP
 * text, internal flags) are not surfaced.
 */
import type { NextRequest } from "next/server";
import { bffFailure, bffSuccess } from "@/lib/v2/bff/response";
import { getOrCreateRequestId } from "@/lib/v2/bff/request-id";
import { getRequiredSession } from "@/lib/v2/bff/session";
import {
  defaultAuthorizationDeps,
  type LearnerRecord,
} from "@/lib/v2/bff/authorization";
import {
  bffError,
  isBffErrorException,
} from "@/lib/v2/bff/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface BffLearnerSummary {
  id: string;
  displayName: string;
  gradeBand?: string;
  avatarUrl?: string;
  readinessState?: string;
  relationship?: string;
}

export interface BffLearnersBody {
  learners: BffLearnerSummary[];
}

function relationshipForRole(role: string, learner: LearnerRecord, userId: string): string | undefined {
  switch (role) {
    case "LEARNER":
      return learner.userId === userId ? "self" : undefined;
    case "PARENT":
      return learner.parentId === userId ? "parent" : "linked";
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
      return undefined;
  }
}

function gradeBandFor(grade: unknown): string | undefined {
  if (typeof grade !== "string" || grade.length === 0) return undefined;
  // Normalize K-2 / 3-5 / 6-8 / 9-12 buckets for the surface. The
  // surface should never see the raw grade string in v2 because the
  // copy is band-driven.
  const m = grade.match(/(\d{1,2})/);
  if (!m) return grade;
  const n = Number(m[1]);
  if (n <= 2) return "K-2";
  if (n <= 5) return "3-5";
  if (n <= 8) return "6-8";
  return "9-12";
}

export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  try {
    const session = await getRequiredSession(request);
    const learners = await defaultAuthorizationDeps.listAccessibleLearners(
      session,
      requestId,
    );
    const data: BffLearnersBody = {
      learners: learners.map((l) => ({
        id: l.id,
        displayName: (l.name as string | undefined) ?? "Learner",
        gradeBand: gradeBandFor(l.gradeLevel),
        relationship: relationshipForRole(session.role, l, session.userId),
      })),
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
