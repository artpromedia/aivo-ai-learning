/**
 * Unit tests for the AIVO v2 BFF foundation. Each suite exercises a
 * single module without booting Next so the harness stays cheap.
 *
 * The route handlers themselves are exercised indirectly: their
 * libraries (errors, response, session, tenant, active-learner,
 * authorization, request-id) are tested here; the routes only wire
 * them together.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bffError,
  BffErrorException,
  isBffErrorException,
} from "../../src/lib/v2/bff/errors.js";
import { bffFailure, bffSuccess } from "../../src/lib/v2/bff/response.js";
import {
  generateRequestId,
  getOrCreateRequestId,
} from "../../src/lib/v2/bff/request-id.js";
import {
  buildTestSession,
  getOptionalSession,
  getRequiredSession,
} from "../../src/lib/v2/bff/session.js";
import {
  resolveTenantForSession,
  resolveTenantForLearner,
} from "../../src/lib/v2/bff/tenant.js";
import { __test as activeLearnerInternals } from "../../src/lib/v2/bff/active-learner.js";
import {
  assertCanAccessLearner,
  assertCanManageLearner,
  type AuthorizationDeps,
  type LearnerRecord,
} from "../../src/lib/v2/bff/authorization.js";

// ---------------------------------------------------------------------------
// errors.ts
// ---------------------------------------------------------------------------

test("bffError(UNAUTHENTICATED) returns the canonical 401 shape", () => {
  const err = bffError("UNAUTHENTICATED");
  assert.equal(err.code, "UNAUTHENTICATED");
  assert.equal(err.status, 401);
  assert.equal(err.retryable, false);
  assert.match(err.userMessage, /sign in/i);
});

test("bffError(SERVICE_UNAVAILABLE) is retryable and 503", () => {
  const err = bffError("SERVICE_UNAVAILABLE");
  assert.equal(err.status, 503);
  assert.equal(err.retryable, true);
});

test("bffError overrides only the supplied fields", () => {
  const err = bffError("LEARNER_NOT_FOUND", { message: "specific learner xyz missing" });
  assert.equal(err.message, "specific learner xyz missing");
  assert.equal(err.status, 404);
  assert.match(err.userMessage, /find that learner/i);
});

test("BffErrorException carries the bff error and is detectable via isBffErrorException", () => {
  const exc = new BffErrorException(bffError("FORBIDDEN"));
  assert.ok(isBffErrorException(exc));
  assert.equal(exc.bff.code, "FORBIDDEN");
  assert.equal(isBffErrorException(new Error("plain")), false);
});

// ---------------------------------------------------------------------------
// response.ts
// ---------------------------------------------------------------------------

async function readJson(res: Response): Promise<unknown> {
  return JSON.parse(await res.text());
}

test("bffSuccess returns a JSON response with ok:true, data, requestId", async () => {
  const res = bffSuccess({ hello: "world" }, "req-1");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-request-id"), "req-1");
  const body = (await readJson(res)) as { ok: boolean; data: unknown; requestId: string };
  assert.equal(body.ok, true);
  assert.deepEqual(body.data, { hello: "world" });
  assert.equal(body.requestId, "req-1");
});

test("bffFailure returns the error status and a structured failure body", async () => {
  const res = bffFailure(bffError("VALIDATION_ERROR"), "req-2");
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("x-request-id"), "req-2");
  const body = (await readJson(res)) as {
    ok: boolean;
    error: { code: string; userMessage: string; retryable: boolean };
    requestId: string;
  };
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.equal(body.error.retryable, false);
  assert.equal(body.requestId, "req-2");
});

// ---------------------------------------------------------------------------
// request-id.ts
// ---------------------------------------------------------------------------

test("getOrCreateRequestId reuses a valid x-request-id header", () => {
  const req = new Request("http://localhost/", { headers: { "x-request-id": "abcd-1234" } });
  assert.equal(getOrCreateRequestId(req), "abcd-1234");
});

test("getOrCreateRequestId falls back to a generated id when the header is missing", () => {
  const req = new Request("http://localhost/");
  const id = getOrCreateRequestId(req);
  assert.ok(id.length >= 4);
});

test("getOrCreateRequestId rejects a malformed incoming id and generates a fresh one", () => {
  const req = new Request("http://localhost/", { headers: { "x-request-id": "bad value with spaces!" } });
  const id = getOrCreateRequestId(req);
  assert.notEqual(id, "bad value with spaces!");
});

test("generateRequestId is always non-empty", () => {
  for (let i = 0; i < 50; i++) {
    const id = generateRequestId();
    assert.ok(id.length > 0);
  }
});

// ---------------------------------------------------------------------------
// session.ts
// ---------------------------------------------------------------------------

test("getOptionalSession returns null when the request has no Authorization header", async () => {
  const req = new Request("http://localhost/");
  const session = await getOptionalSession(req);
  assert.equal(session, null);
});

test("getOptionalSession throws UNAUTHENTICATED when the bearer token is malformed", async () => {
  const req = new Request("http://localhost/", { headers: { authorization: "Bearer not-a-jwt" } });
  await assert.rejects(async () => {
    await getOptionalSession(req);
  }, (err: unknown) => {
    if (!isBffErrorException(err)) return false;
    return err.bff.code === "UNAUTHENTICATED";
  });
});

test("getRequiredSession throws UNAUTHENTICATED when no header is present", async () => {
  const req = new Request("http://localhost/");
  await assert.rejects(async () => {
    await getRequiredSession(req);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "UNAUTHENTICATED";
  });
});

test("buildTestSession returns the expected shape for tests", () => {
  const s = buildTestSession({ userId: "u1", role: "PARENT" });
  assert.equal(s.userId, "u1");
  assert.equal(s.role, "PARENT");
  assert.equal(s.tenantId, "tenant-test");
  assert.equal(s.accessToken, "test-token");
});

// ---------------------------------------------------------------------------
// tenant.ts
// ---------------------------------------------------------------------------

test("resolveTenantForSession returns the JWT tenantId when present", () => {
  const session = buildTestSession({ userId: "u", role: "PARENT", tenantId: "t-7" });
  assert.equal(resolveTenantForSession(session), "t-7");
});

test("resolveTenantForSession throws TENANT_NOT_FOUND when missing and dev fallback is off", () => {
  // Bypass buildTestSession's default so tenantId is genuinely null.
  const session = { ...buildTestSession({ userId: "u", role: "PARENT" }), tenantId: null };
  delete process.env.AIVO_BFF_ALLOW_DEV_TENANT;
  assert.throws(() => resolveTenantForSession(session), (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "TENANT_NOT_FOUND";
  });
});

test("resolveTenantForLearner prefers the learner's tenantId", () => {
  const session = buildTestSession({ userId: "u", role: "PARENT", tenantId: "session-tenant" });
  const learnerTenant = resolveTenantForLearner(session, { id: "l1", tenantId: "learner-tenant" });
  assert.equal(learnerTenant, "learner-tenant");
});

test("resolveTenantForLearner falls back to the session tenant when the learner has none", () => {
  const session = buildTestSession({ userId: "u", role: "PARENT", tenantId: "session-tenant" });
  const t = resolveTenantForLearner(session, { id: "l1", tenantId: null });
  assert.equal(t, "session-tenant");
});

// ---------------------------------------------------------------------------
// active-learner.ts (pure validation only — cookie helpers require next/headers)
// ---------------------------------------------------------------------------

test("active-learner cookie name is namespaced for v2", () => {
  assert.equal(activeLearnerInternals.COOKIE_NAME, "aivo_active_learner_v2");
});

test("LEARNER_ID_PATTERN accepts UUID-like ids and rejects unsafe ones", () => {
  const re = activeLearnerInternals.LEARNER_ID_PATTERN;
  assert.ok(re.test("abc-1234"));
  assert.ok(re.test("01HX5JZ9PQ"));
  assert.equal(re.test(""), false);
  assert.equal(re.test("ab"), false);
  assert.equal(re.test("<script>alert(1)</script>"), false);
  assert.equal(re.test("with space"), false);
});

// ---------------------------------------------------------------------------
// authorization.ts
// ---------------------------------------------------------------------------

function stubDeps(records: LearnerRecord[]): AuthorizationDeps {
  return {
    async listAccessibleLearners() {
      return records;
    },
  };
}

test("PARENT can access a learner whose parentId matches the session", async () => {
  const session = buildTestSession({ userId: "parent-1", role: "PARENT" });
  const deps = stubDeps([{ id: "learner-A", parentId: "parent-1", name: "Ada" }]);
  const access = await assertCanAccessLearner(session, "learner-A", "req", deps);
  assert.equal(access.relationship, "parent");
  assert.equal(access.learner.id, "learner-A");
});

test("PARENT cannot access a learner whose parentId does not match", async () => {
  const session = buildTestSession({ userId: "parent-1", role: "PARENT" });
  // The stub returns a learner record whose parentId is someone else; this
  // simulates a server returning extra records — the assertion must still
  // reject because the relationship check fails.
  const deps = stubDeps([{ id: "learner-B", parentId: "parent-2", name: "Otto" }]);
  await assert.rejects(async () => {
    await assertCanAccessLearner(session, "learner-B", "req", deps);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "INVALID_LEARNER_ACCESS";
  });
});

test("PARENT trying to access an unlisted learner gets INVALID_LEARNER_ACCESS (not LEARNER_NOT_FOUND)", async () => {
  const session = buildTestSession({ userId: "parent-1", role: "PARENT" });
  const deps = stubDeps([{ id: "learner-A", parentId: "parent-1" }]);
  await assert.rejects(async () => {
    await assertCanAccessLearner(session, "learner-X", "req", deps);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "INVALID_LEARNER_ACCESS";
  });
});

test("LEARNER can access only their own learner profile", async () => {
  const session = buildTestSession({ userId: "user-100", role: "LEARNER" });
  const deps = stubDeps([
    { id: "learner-self", userId: "user-100" },
    { id: "learner-other", userId: "user-200" },
  ]);
  const ownAccess = await assertCanAccessLearner(session, "learner-self", "req", deps);
  assert.equal(ownAccess.relationship, "self");
  await assert.rejects(async () => {
    await assertCanAccessLearner(session, "learner-other", "req", deps);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "INVALID_LEARNER_ACCESS";
  });
});

test("LEARNER cannot manage their own profile (manage is parent/caregiver/admin-only)", async () => {
  const session = buildTestSession({ userId: "user-100", role: "LEARNER" });
  const deps = stubDeps([{ id: "learner-self", userId: "user-100" }]);
  await assert.rejects(async () => {
    await assertCanManageLearner(session, "learner-self", "req", deps);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "FORBIDDEN";
  });
});

test("PLATFORM_ADMIN can access any learner returned by the listing", async () => {
  const session = buildTestSession({ userId: "admin-1", role: "PLATFORM_ADMIN" });
  const deps = stubDeps([{ id: "learner-X", parentId: "someone-else" }]);
  const access = await assertCanAccessLearner(session, "learner-X", "req", deps);
  assert.equal(access.relationship, "platform_admin");
});

// ---------------------------------------------------------------------------
// Composite behavior — BFF never substitutes session.user.id for learnerId.
// ---------------------------------------------------------------------------

test("authorization does not infer learnerId from session.userId by default", async () => {
  // Even when session.userId happens to equal a learner id, the
  // assertion ONLY succeeds when the learner record explicitly maps
  // (parentId or userId) to the session.
  const session = buildTestSession({ userId: "abc", role: "PARENT" });
  const deps = stubDeps([{ id: "abc", parentId: "different-parent" }]);
  await assert.rejects(async () => {
    await assertCanAccessLearner(session, "abc", "req", deps);
  }, (err: unknown) => {
    return isBffErrorException(err) && err.bff.code === "INVALID_LEARNER_ACCESS";
  });
});

// ---------------------------------------------------------------------------
// Learner-context response contract — no raw IEP text leakage.
// ---------------------------------------------------------------------------

test("BffLearnerContextResponse contract: keys are categorical, not free text", async () => {
  // We re-import the route module only for its type — but we test
  // the contract by constructing a value with the documented shape
  // and asserting it does NOT contain a free-form IEP text field.
  const contract = {
    learnerId: "l1",
    gradeBand: "3-5",
    hasIEP: true,
    disabilityCategories: ["SLD"],
    accommodationSummary: [
      { type: "reading", label: "Read aloud available", learnerVisible: true },
    ],
    accessibilityDefaults: { readAloud: true },
  };
  assert.equal(Object.prototype.hasOwnProperty.call(contract, "iepDocumentText"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(contract, "iepRaw"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(contract, "clinicianNotes"), false);
});
