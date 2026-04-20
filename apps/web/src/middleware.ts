/**
 * Edge middleware for the AIVO web app.
 *
 * Layered responsibilities (in priority order):
 *
 *   1. **Host allowlist (security-critical).** Admin and district routes
 *      are only reachable on `admin.aivolearning.com` and
 *      `district.aivolearning.com` (plus dev hosts). A request for
 *      `/dashboard/admin` arriving on `app.aivolearning.com` returns
 *      404 — surface separation is enforced before any rendering.
 *
 *   2. **Auth-cookie redirect (UX optimization, NOT an auth gate).** If the
 *      `refreshToken` cookie is missing on a protected route, redirect to the
 *      surface-specific login page so unauthenticated users do not see a
 *      momentary flash of dashboard chrome. The cookie value is intentionally
 *      not validated here: edge middleware should not call back into
 *      identity-svc on every navigation. Real authentication and RBAC are
 *      enforced by:
 *        - the dashboard layouts (which call `useAuth()` and redirect on
 *          missing/invalid sessions before rendering data), and
 *        - identity-svc, which validates every access token issued from the
 *          httpOnly refresh cookie before returning user data.
 *      A forged `refreshToken` cookie merely passes this redirect; it does
 *      not grant access to any tenant data.
 *
 *   3. **Hardening response headers** for protected surfaces.
 *
 * Sprint 6 (SAML SSO + SCIM) is the planned point at which we introduce a
 * short-lived edge-verifiable session token (signed by identity-svc) so this
 * middleware can perform real auth gating without a network round-trip.
 */
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATHS = ["/admin", "/dashboard/admin", "/dashboard/internal"];
const DISTRICT_PATHS = ["/district", "/dashboard/district"];

const ADMIN_LOGIN_PATHS = new Set(["/admin/login"]);
const DISTRICT_LOGIN_PATHS = new Set(["/district/login"]);

const ADMIN_ALLOWED_HOSTS = [
  "admin.aivolearning.com",
];

const DISTRICT_ALLOWED_HOSTS = [
  "district.aivolearning.com",
];

const SHARED_DEV_HOST_SUFFIXES = [
  "localhost",
  "127.0.0.1",
  ".replit.dev",
  ".replit.app",
  ".janeway.replit.dev",
];

function hostMatches(host: string, exact: string[], suffixes: string[]): boolean {
  const normalized = host.toLowerCase().split(":")[0];
  if (exact.includes(normalized)) return true;
  for (const suffix of suffixes) {
    if (suffix.startsWith(".")) {
      if (normalized.endsWith(suffix) || normalized === suffix.slice(1)) return true;
    } else if (normalized === suffix) {
      return true;
    }
  }
  return false;
}

function pathStartsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") || "";

  const isAdminPath = pathStartsWithAny(pathname, ADMIN_PATHS);
  const isDistrictPath = pathStartsWithAny(pathname, DISTRICT_PATHS);

  if (!isAdminPath && !isDistrictPath) {
    return NextResponse.next();
  }

  if (isAdminPath) {
    if (!hostMatches(host, ADMIN_ALLOWED_HOSTS, SHARED_DEV_HOST_SUFFIXES)) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (!ADMIN_LOGIN_PATHS.has(pathname)) {
      const refresh = req.cookies.get("refreshToken");
      if (!refresh) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  if (isDistrictPath) {
    if (!hostMatches(host, DISTRICT_ALLOWED_HOSTS, SHARED_DEV_HOST_SUFFIXES)) {
      return new NextResponse("Not Found", { status: 404 });
    }
    if (!DISTRICT_LOGIN_PATHS.has(pathname)) {
      const refresh = req.cookies.get("refreshToken");
      if (!refresh) {
        const url = req.nextUrl.clone();
        url.pathname = "/district/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/district/:path*", "/dashboard/admin/:path*", "/dashboard/district/:path*", "/dashboard/internal/:path*"],
};
