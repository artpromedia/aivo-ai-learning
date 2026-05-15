"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

/**
 * Renders a lightweight identity banner on v2 home surfaces.
 *
 * Sprint 02 scope: read `/api/bff/me`, display the resolved user
 * name/role on the parent home, and on the learner home display
 * "no active learner — choose a profile" when the BFF reports
 * `activeLearner: null`. No data mutation, no analytics, no
 * navigation: the banner is informational.
 *
 * The component renders its initial loading state on first paint so
 * the existing static smoke tests (which render via
 * `react-dom/server.renderToStaticMarkup` and never run
 * `useEffect`) see the page exactly as Sprint 01 left it.
 */
type Surface = "learner" | "parent";

interface MeBody {
  ok: boolean;
  data?: {
    user: { id: string; role: string; name?: string };
    activeLearner: { id: string; displayName: string } | null;
  };
}

export function MeBanner({ surface }: { surface: Surface }) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "unauth" }
    | { kind: "ready"; name: string; role: string; activeLearnerId: string | null; activeLearnerName: string | null }
  >({ kind: "loading" });

  useEffect(() => {
    if (!accessToken) {
      setState({ kind: "unauth" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bff/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = (await res.json()) as MeBody;
        if (cancelled) return;
        if (!body.ok || !body.data) {
          setState({ kind: "unauth" });
          return;
        }
        setState({
          kind: "ready",
          name: body.data.user.name ?? "you",
          role: body.data.user.role,
          activeLearnerId: body.data.activeLearner?.id ?? null,
          activeLearnerName: body.data.activeLearner?.displayName ?? null,
        });
      } catch {
        if (!cancelled) setState({ kind: "unauth" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (state.kind === "loading") {
    return null;
  }
  if (state.kind === "unauth") {
    return (
      <p className="mb-4 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Sign in to see your personalized AIVO home.
      </p>
    );
  }

  if (surface === "parent") {
    return (
      <p className="mb-4 rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-sm text-slate-800">
        Signed in as <strong>{state.name}</strong>.
      </p>
    );
  }

  // Learner surface
  if (!state.activeLearnerId) {
    return (
      <p className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        No learner profile selected.{" "}
        <Link
          href="/learner-v2/select-profile"
          className="font-semibold underline decoration-2 underline-offset-2"
        >
          Choose a profile
        </Link>
        .
      </p>
    );
  }
  return (
    <p className="mb-4 rounded-2xl border-2 border-violet-200 bg-violet-50 px-4 py-3 text-sm text-slate-800">
      Learning as <strong>{state.activeLearnerName ?? "your learner"}</strong>.
    </p>
  );
}
