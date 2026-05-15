# AIVO v2 Rebuild — Documentation Hub

This folder is the entry point for the AIVO v2 rebuild. It captures the
product principles, the audit of the current platform, and the
keep/drop/rebuild matrix that governs which existing assets continue
forward and which are quarantined for replacement.

Sprint 00 establishes the workspace and the decision framework. No
production learner behavior is changed in this sprint.

## North Star

> Every learner receives a personalized tutor-generated lesson based on
> their brain profile, IEP/accommodations, baseline results, and mastery
> history.

Every rebuild decision must be defended against this single promise.

## Branch

This sprint is being developed on:

```txt
claude/setup-aivo-v2-rebuild-kvjBi
```

The sprint brief originally referenced `rebuild/aivo-v2-personalized-lessons`.
The session-assigned branch above takes precedence per the harness
configuration. Subsequent sprints can either continue on this branch or
re-fork from `main` to `rebuild/aivo-v2-personalized-lessons`; the contents
of `docs/rebuild/` are branch-agnostic.

## Repository at Sprint 00

The clone step in the sprint brief refers to `artpromedia/aivolearning`.
The active working tree is `artpromedia/aivo-ai-learning`. The audit and
matrix below are scoped to this checkout. If the v2 work moves to a
different GitHub remote, the audit headings remain valid; only the paths
need to be re-validated.

## Documents

| Document | Purpose |
| --- | --- |
| `aivo-v2-product-principles.md` | The north star and the twelve global build rules that gate every sprint. |
| `aivo-v2-route-audit.md` | Per-route inventory of `apps/web/src/app/{dashboard/learner,dashboard/parent,api}`, `middleware.ts`, and `next.config.ts` with a KEEP / REBUILD / REDIRECT_LATER / DELETE_AFTER_V2 / BACKEND_ONLY / UNKNOWN_NEEDS_REVIEW disposition. |
| `aivo-v2-keep-drop-rebuild-matrix.md` | Asset-level matrix (packages, services, surfaces, contracts) showing what carries forward and what gets rebuilt. |
| `aivo-v2-risk-register.md` | Open risks for the rebuild, including pre-existing build/test status captured during this sprint. |

## Sprint 00 Scope

- Audit only. No production deletes. No `/learner-v2` or `/parent-v2` routes.
- Document pre-existing build/lint/test/typecheck failures verbatim.
- Identify every place `session.user.id` is used as a learnerId.
- Identify every learner-facing API call that bypasses a stable BFF contract.
- Mark legacy/quarantined surfaces without removing them.

## Out of Scope for Sprint 00

- Implementing `/api/bff/*` routes.
- Removing or moving any learner or parent route.
- Refactoring services beyond a minimal fix required to unblock setup.
- Replacing `@aivo/learner-context` consumers.
