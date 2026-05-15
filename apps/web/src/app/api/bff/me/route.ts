/**
 * GET /api/bff/me
 *
 * Returns the authenticated user, their resolved tenant, and the
 * active learner if one is selected. This is the entry point every
 * v2 surface calls on first render.
 */
import type { NextRequest } from "next/server";
import { bffFailure, bffSuccess } from "@/lib/v2/bff/response";
import { getOrCreateRequestId } from "@/lib/v2/bff/request-id";
import { getRequiredSession } from "@/lib/v2/bff/session";
import { resolveTenantForSession } from "@/lib/v2/bff/tenant";
import {
  getActiveLearner,
  type ActiveLearnerRecord,
} from "@/lib/v2/bff/active-learner";
import {
  assertCanAccessLearner,
  defaultAuthorizationDeps,
} from "@/lib/v2/bff/authorization";
import {
  BffErrorException,
  bffError,
  isBffErrorException,
} from "@/lib/v2/bff/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export interface BffMeBody {
  user: {
    id: string;
    role: string;
    name?: string;
    email?: string;
  };
  tenant: { id: string; type?: string; name?: string } | null;
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

    let tenant: BffMeBody["tenant"] = null;
    try {
      const tenantId = resolveTenantForSession(session);
      tenant = { id: tenantId };
    } catch (err) {
      // Tenant resolution failures are not fatal for /me — we still
      // return the user so the surface can route to a setup screen.
      if (!isBffErrorException(err)) throw err;
    }

    let activeLearner: BffMeBody["activeLearner"] = null;
    const stored: ActiveLearnerRecord | null = await getActiveLearner(session);
    if (stored) {
      try {
        const access = await assertCanAccessLearner(
          session,
          stored.learnerId,
          requestId,
          defaultAuthorizationDeps,
        );
        activeLearner = {
          id: access.learner.id,
          displayName:
            (access.learner.name as string | undefined) ?? "Learner",
        };
      } catch (err) {
        // Stale cookie referring to a learner the session can no
        // longer reach: silently drop. The next /active-learner POST
        // will overwrite it.
        if (!isBffErrorException(err)) throw err;
      }
    }

    const data: BffMeBody = {
      user: {
        id: session.userId,
        role: session.role,
        email: session.email,
        name: session.name,
      },
      tenant,
      activeLearner,
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
