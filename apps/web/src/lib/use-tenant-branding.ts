"use client";
/**
 * Sprint 9 — public tenant branding consumer.
 *
 * `useTenantBranding(tenantId)` fetches `/api/branding/public/:tenantId`
 * and returns `{ branding, ready }`. Falls back silently to AIVO defaults
 * when the tenant has no branding row, the request fails, or no tenant
 * id is in scope. Result is memoized via `sessionStorage` so we don't
 * re-fetch on every page navigation.
 *
 * `applyBrandingCssVars` writes `--tenant-primary` to `document.documentElement`
 * so any component using `var(--tenant-primary, var(--visual-primary))`
 * picks up the override automatically.
 */
import { useEffect, useState } from "react";

export interface PublicBranding {
  displayName: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  supportEmail: string | null;
}

const DEFAULT: PublicBranding = { displayName: null, primaryColor: null, logoUrl: null, supportEmail: null };
const CACHE_KEY = (id: string) => `aivo:branding:${id}`;

export function useTenantBranding(tenantId: string | null | undefined) {
  const [branding, setBranding] = useState<PublicBranding>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tenantId) { setReady(true); return; }
    let alive = true;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY(tenantId));
      if (cached) {
        const parsed = JSON.parse(cached) as PublicBranding;
        setBranding(parsed); applyBrandingCssVars(parsed); setReady(true);
      }
    } catch { /* ignore */ }

    fetch(`/api/branding/public/${encodeURIComponent(tenantId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!alive || !data?.branding) return;
        const b: PublicBranding = {
          displayName: data.branding.displayName ?? null,
          primaryColor: data.branding.primaryColor ?? null,
          logoUrl: data.branding.logoUrl ?? null,
          supportEmail: data.branding.supportEmail ?? null,
        };
        setBranding(b);
        applyBrandingCssVars(b);
        try { sessionStorage.setItem(CACHE_KEY(tenantId), JSON.stringify(b)); } catch { /* quota */ }
      })
      .catch(() => { /* fall back to defaults */ })
      .finally(() => { if (alive) setReady(true); });

    return () => { alive = false; };
  }, [tenantId]);

  return { branding, ready };
}

export function applyBrandingCssVars(b: PublicBranding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (b.primaryColor) {
    root.style.setProperty("--tenant-primary", b.primaryColor);
  } else {
    root.style.removeProperty("--tenant-primary");
  }
}
