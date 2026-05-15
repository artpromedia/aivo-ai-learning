/**
 * Standard error codes for the AIVO v2 BFF.
 *
 * Every BFF route raises one of these; the surface translates them
 * into a `BffFailure` body. The set is intentionally small — adding
 * a new code is a deliberate decision, not a one-off.
 */

export type BffErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "TENANT_NOT_FOUND"
  | "LEARNER_NOT_FOUND"
  | "ACTIVE_LEARNER_NOT_SET"
  | "INVALID_LEARNER_ACCESS"
  | "SERVICE_UNAVAILABLE"
  | "UPSTREAM_TIMEOUT"
  | "VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export interface BffError {
  code: BffErrorCode;
  /** Internal/developer-facing message; never shown to learners. */
  message: string;
  /** User-safe sentence shown verbatim on parent and learner surfaces. */
  userMessage: string;
  status: number;
  retryable: boolean;
}

interface BffErrorTemplate {
  message: string;
  userMessage: string;
  status: number;
  retryable: boolean;
}

const TEMPLATES: Record<BffErrorCode, BffErrorTemplate> = {
  UNAUTHENTICATED: {
    message: "Request has no valid session",
    userMessage: "You need to sign in to continue.",
    status: 401,
    retryable: false,
  },
  FORBIDDEN: {
    message: "Caller does not have permission for this resource",
    userMessage: "You do not have access to this.",
    status: 403,
    retryable: false,
  },
  TENANT_NOT_FOUND: {
    message: "No tenant could be resolved for the session",
    userMessage: "We could not find your account. Please sign in again.",
    status: 400,
    retryable: false,
  },
  LEARNER_NOT_FOUND: {
    message: "Learner profile does not exist",
    userMessage: "We could not find that learner.",
    status: 404,
    retryable: false,
  },
  ACTIVE_LEARNER_NOT_SET: {
    message: "No active learner is set for the session",
    userMessage: "Please choose a learner profile to continue.",
    status: 409,
    retryable: false,
  },
  INVALID_LEARNER_ACCESS: {
    message: "Caller is not authorized for the requested learner",
    userMessage: "You do not have access to this learner.",
    status: 403,
    retryable: false,
  },
  SERVICE_UNAVAILABLE: {
    message: "Upstream service is unavailable",
    userMessage: "We could not load this just now. Please try again in a moment.",
    status: 503,
    retryable: true,
  },
  UPSTREAM_TIMEOUT: {
    message: "Upstream service timed out",
    userMessage: "This is taking longer than usual. Please try again.",
    status: 504,
    retryable: true,
  },
  VALIDATION_ERROR: {
    message: "Request failed validation",
    userMessage: "Some of the information was incorrect. Please check and try again.",
    status: 400,
    retryable: false,
  },
  UNKNOWN_ERROR: {
    message: "Unexpected error in BFF",
    userMessage: "Something went wrong. Please try again.",
    status: 500,
    retryable: true,
  },
};

/**
 * Build a typed BFF error. Routes pass `code` and (optionally) a
 * more specific developer-facing `message`. The `userMessage` and
 * `status` are derived from the standard template so behavior is
 * uniform across routes.
 */
export function bffError(
  code: BffErrorCode,
  override?: { message?: string; userMessage?: string; status?: number; retryable?: boolean },
): BffError {
  const t = TEMPLATES[code];
  return {
    code,
    message: override?.message ?? t.message,
    userMessage: override?.userMessage ?? t.userMessage,
    status: override?.status ?? t.status,
    retryable: override?.retryable ?? t.retryable,
  };
}

/**
 * Subclass of Error used internally so library code can `throw`
 * instead of returning union types. Route handlers catch
 * `BffErrorException` and call `bffFailure(...)`.
 */
export class BffErrorException extends Error {
  readonly bff: BffError;
  constructor(bff: BffError) {
    super(bff.message);
    this.bff = bff;
    this.name = "BffErrorException";
  }
}

export function isBffErrorException(value: unknown): value is BffErrorException {
  return value instanceof BffErrorException;
}
