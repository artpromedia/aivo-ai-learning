/**
 * BFF response contract.
 *
 * Every BFF route returns either a `BffSuccess<T>` or a `BffFailure`.
 * The shape is enforced by the helpers in this file — routes never
 * hand-roll `NextResponse.json({ ok: ... })` directly.
 */
import { NextResponse } from "next/server";
import type { BffError } from "./errors.js";

export interface BffSuccess<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface BffFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
  };
  requestId: string;
}

export type BffResponseBody<T> = BffSuccess<T> | BffFailure;

const REQUEST_ID_HEADER = "x-request-id";

export function bffSuccess<T>(
  data: T,
  requestId: string,
  init?: { status?: number; headers?: HeadersInit },
): NextResponse<BffSuccess<T>> {
  const body: BffSuccess<T> = { ok: true, data, requestId };
  const res = NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers });
  res.headers.set(REQUEST_ID_HEADER, requestId);
  return res;
}

export function bffFailure(
  error: BffError,
  requestId: string,
): NextResponse<BffFailure> {
  const body: BffFailure = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
    },
    requestId,
  };
  const res = NextResponse.json(body, { status: error.status });
  res.headers.set(REQUEST_ID_HEADER, requestId);
  return res;
}
