/**
 * Speech Buddy parent-consent gate.
 *
 * Calls family-svc's internal consent endpoint with the tutor-svc internal
 * key. Returns the consent record id on success or throws a typed error.
 *
 * The full consent management UI + storage table land in the next task
 * (Speech Buddy child UI + consent + dashboards). This client deliberately
 * keeps the surface minimal so swapping in the real store is a no-op for
 * tutor-svc.
 *
 * Local dev / tests can short-circuit with `SPEECH_BUDDY_DEV_CONSENTS`,
 * format: "tenant1:learner1:consent1,tenant2:learner2:consent2".
 */

const IS_PROD = process.env.NODE_ENV === "production";
function requireUrl(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (IS_PROD) throw new Error(`tutor-svc: ${name} must be set in production`);
  return devDefault;
}
const FAMILY_SVC_URL = requireUrl("FAMILY_SVC_URL", "http://localhost:3007");
const INTERNAL_KEY =
  process.env.INTERNAL_SERVICE_KEY ||
  (IS_PROD ? "" : "aivo-internal-dev-key");

export class ConsentError extends Error {
  status: number;
  constructor(msg: string, status = 403) {
    super(msg);
    this.status = status;
  }
}

function devLookup(tenantId: string, learnerId: string): string | null {
  const raw = process.env.SPEECH_BUDDY_DEV_CONSENTS || "";
  if (!raw) return null;
  for (const entry of raw.split(",")) {
    const [t, l, c] = entry.trim().split(":");
    if (t === tenantId && l === learnerId && c) return c;
  }
  return null;
}

export async function verifyConsent(args: {
  tenantId: string;
  learnerId: string;
  ageBand: "6-9" | "10-12" | "13-15";
}): Promise<string> {
  const dev = devLookup(args.tenantId, args.learnerId);
  if (dev) return dev;
  const url = `${FAMILY_SVC_URL}/api/family/internal/speech-buddy/consent/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-key": INTERNAL_KEY,
    },
    body: JSON.stringify(args),
  });
  if (res.status === 404) {
    throw new ConsentError("No Speech Buddy consent on file for this learner.", 403);
  }
  if (!res.ok) {
    throw new ConsentError(`Consent check failed (status ${res.status})`, 502);
  }
  const body = (await res.json()) as { consentRecordId?: string; granted?: boolean };
  if (!body.granted || !body.consentRecordId) {
    throw new ConsentError("Speech Buddy consent has been revoked.", 403);
  }
  return body.consentRecordId;
}
