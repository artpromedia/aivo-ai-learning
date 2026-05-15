/**
 * Service client used by BFF route handlers to call upstream
 * services. Centralizes header injection, timeouts, and error
 * normalization so individual routes never construct headers or
 * leak upstream error bodies to the browser.
 *
 * Service URLs come from the same env vars `apps/web/next.config.ts`
 * uses for its rewrites. The BFF must hit the real service URL from
 * the server; Next's rewrites are browser-facing only.
 */
import { BffErrorException, bffError } from "./errors.js";
import type { BffSession } from "./session.js";

export type ServiceName =
  | "identity"
  | "family"
  | "brain"
  | "assessment"
  | "ai"
  | "learning"
  | "tutor"
  | "engagement"
  | "billing"
  | "comms"
  | "i18n"
  | "integrations"
  | "admin"
  | "status"
  | "research";

const ENV_VARS: Record<ServiceName, { env: string; devDefault: string }> = {
  identity: { env: "IDENTITY_SVC_URL", devDefault: "http://localhost:3001" },
  brain: { env: "BRAIN_SVC_URL", devDefault: "http://localhost:3002" },
  assessment: { env: "ASSESSMENT_SVC_URL", devDefault: "http://localhost:3003" },
  ai: { env: "AI_SVC_URL", devDefault: "http://localhost:3004" },
  learning: { env: "LEARNING_SVC_URL", devDefault: "http://localhost:3005" },
  tutor: { env: "TUTOR_SVC_URL", devDefault: "http://localhost:3006" },
  family: { env: "FAMILY_SVC_URL", devDefault: "http://localhost:3007" },
  engagement: { env: "ENGAGEMENT_SVC_URL", devDefault: "http://localhost:3008" },
  billing: { env: "BILLING_SVC_URL", devDefault: "http://localhost:3009" },
  comms: { env: "COMMS_SVC_URL", devDefault: "http://localhost:3010" },
  i18n: { env: "I18N_SVC_URL", devDefault: "http://localhost:3011" },
  integrations: { env: "INTEGRATIONS_SVC_URL", devDefault: "http://localhost:3012" },
  admin: { env: "ADMIN_SVC_URL", devDefault: "http://localhost:3013" },
  status: { env: "STATUS_PAGE_SVC_URL", devDefault: "http://localhost:3014" },
  research: { env: "RESEARCH_SVC_URL", devDefault: "http://localhost:3015" },
};

const DEFAULT_TIMEOUT_MS = 8000;

export interface ServiceCallOptions {
  /** Upstream service name (controls which base URL is used). */
  service: ServiceName;
  /** Path starting with `/` — joined with the service base URL. */
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Session used to inject identity headers and forward auth. */
  session: BffSession;
  /** Tenant id for the operation (already resolved by the caller). */
  tenantId: string;
  /** Optional active learner id, included as `X-Learner-Id`. */
  learnerId?: string;
  /** Request id propagated from the BFF entry. */
  requestId: string;
  /** Optional JSON body. */
  body?: unknown;
  /** Optional override of the default timeout. */
  timeoutMs?: number;
}

export interface ServiceCallResult<T> {
  status: number;
  data: T;
}

function getServiceBaseUrl(service: ServiceName): string {
  const cfg = ENV_VARS[service];
  const fromEnv = process.env[cfg.env];
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new BffErrorException(
      bffError("SERVICE_UNAVAILABLE", {
        message: `${cfg.env} is not set; refusing to call ${service} in production`,
      }),
    );
  }
  return cfg.devDefault;
}

/**
 * Call an upstream service. Returns the parsed JSON body on success;
 * throws `BffErrorException` on any failure (timeout, network,
 * non-2xx status). The function never returns an upstream error
 * body to the caller — error details land in logs only.
 */
export async function callService<T = unknown>(
  options: ServiceCallOptions,
): Promise<ServiceCallResult<T>> {
  const base = getServiceBaseUrl(options.service);
  const url = `${base.replace(/\/$/, "")}${options.path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "x-user-id": options.session.userId,
    "x-tenant-id": options.tenantId,
    "x-request-id": options.requestId,
    "x-internal-service": "web-bff",
    authorization: `Bearer ${options.session.accessToken}`,
  };
  if (options.learnerId) headers["x-learner-id"] = options.learnerId;
  if (options.body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new BffErrorException(
      bffError(aborted ? "UPSTREAM_TIMEOUT" : "SERVICE_UNAVAILABLE", {
        message: `Calling ${options.service}${options.path} failed: ${
          err instanceof Error ? err.message : "unknown"
        }`,
      }),
    );
  }
  clearTimeout(timeout);

  let parsed: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Upstream returned a non-JSON body; we do not surface it.
      parsed = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new BffErrorException(bffError("UNAUTHENTICATED"));
    }
    if (res.status === 403) {
      throw new BffErrorException(bffError("FORBIDDEN"));
    }
    if (res.status === 404) {
      throw new BffErrorException(
        bffError("LEARNER_NOT_FOUND", {
          message: `Upstream ${options.service}${options.path} returned 404`,
        }),
      );
    }
    if (res.status >= 500) {
      throw new BffErrorException(
        bffError("SERVICE_UNAVAILABLE", {
          message: `Upstream ${options.service}${options.path} returned ${res.status}`,
        }),
      );
    }
    throw new BffErrorException(
      bffError("UNKNOWN_ERROR", {
        message: `Upstream ${options.service}${options.path} returned ${res.status}`,
      }),
    );
  }

  return { status: res.status, data: parsed as T };
}

/** Internal test seam. Not exported by the package's barrel. */
export const __test = { getServiceBaseUrl };
