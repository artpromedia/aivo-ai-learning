# AIVO Gap-Fix Sprint Plan

> Generated from a comprehensive audit of the AIVO AI Learning platform for neurodiverse children.  
> Each sprint contains self-contained, containerized prompts that can be executed independently by an AI coding agent or human engineer.

---

## Sprint Overview

| Sprint | Title | Priority | Days | Key Deliverables |
|--------|-------|----------|------|-----------------|
| **1** | [Critical Safety & Multi-Tenant](sprint-1-critical-safety-multitenant.md) | 🔴 BLOCKER | 3–5 | Hardcoded tenant ID removal, localhost URL fixes, safety gate expansion, CORS lockdown |
| **2** | [CI/CD Hardening & Test Foundation](sprint-2-ci-hardening-test-foundation.md) | 🟠 HIGH | 3–4 | Blocking lint/typecheck, unit tests for clone pipeline + quality gate + prompt builder, a11y test expansion |
| **3** | [Content Moderation Pipeline](sprint-3-content-moderation-pipeline.md) | 🟠 HIGH | 4–5 | DB schema, moderation logging, admin CRUD API, admin UI wiring, high-severity alerts + circuit breaker |
| **4** | [Adaptive Learning Paths](sprint-4-adaptive-learning-paths.md) | 🟡 MEDIUM | 4–5 | Curriculum engine wiring, XP/quality formula rework, mastery-gated advancement, scaffolding prompts |
| **5** | [Parent Dashboard Completion](sprint-5-parent-dashboard-completion.md) | 🟡 MEDIUM | 4–5 | Progress page, transition planning UI, causal analysis/insights UI, brain snapshot history |
| **6** | [Security Hardening](sprint-6-security-hardening.md) | 🟡 MEDIUM | 3–4 | MFA wiring, route authentication, encryption docs, security scan enforcement |
| **7** | [Production Readiness & Polish](sprint-7-production-readiness.md) | 🟢 NORMAL | 3–5 | a11y lint plugin, observability, E2E smoke tests, docs audit, mobile parity check |

**Total estimated effort**: 24–33 engineering days (5–7 weeks at sustainable pace)

---

## Gap → Sprint Mapping

| # | Gap (from audit) | Sprint | Prompt |
|---|-----------------|--------|--------|
| 1 | Hardcoded tenant ID `00000000-…-000001` in 7 call-sites | S1 | 1.1 |
| 2 | Hardcoded `localhost:3005` in brain-svc (3 locations) | S1 | 1.2 |
| 3 | Minimal safety regex (~15 words, 3 patterns) | S1 | 1.3 |
| 4 | CORS `origin: true` allows all domains in production | S1 | 1.4 |
| 5 | CI lint + typecheck use `continue-on-error: true` | S2 | 2.1 |
| 6 | Zero unit tests for brain clone pipeline | S2 | 2.2 |
| 7 | Zero unit tests for quality gate | S2 | 2.3 |
| 8 | Zero unit tests for prompt builder | S2 | 2.4 |
| 9 | Only 3 a11y test files for 30+ pages | S2 | 2.5 |
| 10 | Admin moderation UI shows hardcoded `SAMPLE_ITEMS` | S3 | 3.4 |
| 11 | No backend persistence for safety gate failures | S3 | 3.2 |
| 12 | No high-severity alert or circuit breaker | S3 | 3.5 |
| 13 | Learning path uses static `getDefaultTopics()` not curriculum engine | S4 | 4.1 |
| 14 | XP = `messages.length * 5` (simplistic proxy) | S4 | 4.2 |
| 15 | `completionQuality = messages.length / 10` | S4 | 4.2 |
| 16 | No mastery-gated topic advancement | S4 | 4.3 |
| 17 | No scaffolding in prompts for struggling learners | S4 | 4.4 |
| 18 | Progress page is a 9-line redirect stub | S5 | 5.1 |
| 19 | No transition planning UI (DB + prompts exist) | S5 | 5.2 |
| 20 | No causal analysis / insights UI for parents | S5 | 5.3 |
| 21 | No brain snapshot history view | S5 | 5.4 |
| 22 | MFA settings UI not fully wired to login flow | S6 | 6.1 |
| 23 | Learning-svc + tutor-svc routes have no authentication | S6 | 6.2 |
| 24 | No encryption-at-rest documentation | S6 | 6.3 |
| 25 | Security scans use `continue-on-error` everywhere | S6 | 6.4 |
| 26 | `eslint-plugin-jsx-a11y` not integrated | S7 | 7.1 |
| 27 | No request ID tracing or structured observability | S7 | 7.2 |
| 28 | Integration connectors "coming soon" as string, no waitlist | S7 | 7.3 |
| 29 | No E2E smoke tests for core flows | S7 | 7.4 |
| 30 | Launch readiness doc outdated | S7 | 7.5 |
| 31 | Mobile app parity unknown | S7 | 7.6 |

---

## How to Use These Prompts

Each prompt in the sprint files is designed as a **self-contained task** that can be:

1. **Fed directly to an AI coding agent** (e.g., GitHub Copilot, Cursor, Claude) — each prompt includes context, exact files/lines, the task, and acceptance criteria.
2. **Assigned to a human engineer** as a ticket — each has clear scope and DoD.
3. **Executed in parallel** where prompts within a sprint don't depend on each other (most don't).

### Dependency chain between sprints:
```
Sprint 1 ──→ Sprint 3 (moderation needs safety gate expansion from S1)
Sprint 2 ──→ Sprint 4 (tests from S2 validate S4 changes)
Sprint 1 ──→ Sprint 6 (auth hardening needs tenant ID fix from S1)
All others are independent.
```

### Prompt format:
Each prompt contains:
- **Context**: Why this matters, what's broken, exact file references
- **Files to change**: Specific paths and line numbers
- **Task**: Step-by-step implementation instructions
- **Acceptance criteria**: Measurable, testable outcomes
