# AIVO AI Learning Platform

## Overview
AIVO is an AI-powered adaptive learning platform designed for neurodiverse children. It features a unique "Brain-Clone" architecture, 14 specialized AI tutors, 5 functioning levels, and a sensory profiles engine. The platform aims to provide personalized education, enhancing learning outcomes for its target demographic.

## User Preferences
I prefer iterative development, with a focus on delivering functional, well-tested components in each step. I appreciate clear communication regarding design choices and potential trade-offs. Ask before making major architectural changes or introducing new external dependencies.

## System Architecture

### Monorepo Structure
The project utilizes a monorepo managed with Turborepo and pnpm, encompassing various applications and services:
- **Applications**: `web` (Next.js 15 for main dashboards and authentication), `marketing` (Next.js 15 for marketing site), `mobile` (React Native/Expo for mobile app).
- **Packages**: Shared utilities for database schema (Drizzle ORM), branding assets, mobile UI components, event definitions (NATS), observability (Pino), security (JWT), and internationalization.
- **Microservices (Fastify/Python FastAPI)**: A suite of services covering identity, assessment, brain-clone logic, AI gateway, learning sessions, tutor management, family collaboration, engagement, billing, communications, internationalization, third-party integrations, admin, status page, and research.

### Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS v4, TypeScript
- **Mobile**: React Native (Expo SDK 54), Expo Router v6, TypeScript
- **Backend (TypeScript)**: Fastify 5, Drizzle ORM, PostgreSQL 16
- **Backend (Python)**: FastAPI, LiteLLM (for LLM fallback chain: Claude Sonnet → Gemini Flash → GPT-4o-mini)
- **Authentication**: JWT RS256 with refresh tokens, PIN login, Google OAuth, and email-based MFA.
- **Database**: PostgreSQL 16, utilizing JSONB for brain states and a Drizzle ORM managed schema.
- **Styling**: AIVO brand system with specific color palettes and game-themed fonts (Fredoka, Nunito).
- **Internationalization**: `next-intl` integration with 10 supported locales, including RTL support for Arabic. Run `pnpm i18n:audit` (or `pnpm i18n:audit:verbose`) to check locale-file parity across web, marketing, and mobile — it fails on missing/orphan keys and warns on untranslated copy. Wired into CI via `.github/workflows/i18n-file-audit.yml`.

### Key Features
- **Adaptive Tutors**: 14 AI tutors (7 core, 7 expansion) with adaptive system prompts based on functioning levels.
- **5 Functioning Levels**: Ranging from STANDARD to PRE_SYMBOLIC, driving content adaptation.
- **Role-Based Dashboards**: Specific dashboards for parents, learners, teachers, caregivers, therapists, and district admins, with internal dashboards for sales, marketing, customer care, support, finance, and DevOps.
- **Brain Clone & Approval Flow**: A multi-step process for creating and managing learner "brain clones," including parent assessment, baseline assessment, pre-clone review, COPPA consent, and parent modification controls.
- **Discovery Adventure**: An immersive, 6-chapter baseline assessment for learners, replacing traditional quizzes with adaptive difficulty and break activities.
- **The Stage (Learner Experience Engine)**: A full-screen immersive learning environment with beat-based lessons, sensory adaptations, and interactive response types.
- **Engagement System**: XP engine, level system, streaks, badges, virtual currency, avatar shop, quests, and multiplayer challenges.
- **Accessibility**: Comprehensive accessibility features including SkipLinks, accessible components, screen reader support, `focus-visible` styling, and automated a11y testing in CI.

## Backend Boot Ordering
The Identity Service workflow runs `scripts/start-services.sh`, which launches the ~14 Node and Python backend services. They are deliberately started in **five small groups with a brief pause between groups** rather than fanning out all at once — launching them in parallel exhausts the container's process / thread budget on a fresh boot (`EAGAIN` fork errors, `ERR_WORKER_INIT_FAILED` from tsx) and starves the Next.js workflows (`Web App`, `Marketing Site`) of CPU long enough that their port-readiness check times out. Groups: (1) identity / comms / i18n, (2) assessment / learning, (3) tutor / family / engagement, (4) billing / integrations / admin, (5) status-page / research / ai-svc. Adds ~8 seconds to cold-boot time but keeps every workflow card green. Do not collapse the groups back to a single fan-out without a corresponding bump in container resources.

## Production Environment Checklist
The following env vars are validated at service boot when `NODE_ENV=production`. Missing values throw immediately rather than silently falling back to localhost — see `.env.example` for the full list.

- **All `*_SVC_URL` (IDENTITY, BRAIN, ASSESSMENT, AI, LEARNING, TUTOR, FAMILY, ENGAGEMENT, BILLING, COMMS, I18N, INTEGRATIONS, ADMIN, STATUS_PAGE, RESEARCH)** — required by `status-page-svc` (builds the health-check map) and by `tutor-svc` for `AI_SVC_URL`, `BRAIN_SVC_URL`, `LEARNING_SVC_URL`.
- **`INTERNAL_SERVICE_TOKEN`** — required by `learning-svc`, `tutor-svc`, and `status-page-svc`. Shared secret for inter-service `x-service-token` calls.
- **`INTERNAL_AI_TOKEN`** — required by `tutor-svc` (curriculum routes calling `ai-svc`).
- **`WEBAUTHN_ORIGINS`** — optional comma-separated allow-list. If unset in production, `identity-svc` returns only the static `aivolearning.com` allow-list and ignores forwarded host headers (no origin reflection).

## External Dependencies
- **PostgreSQL 16**: Primary database for all application data.
- **NATS**: For typed event definitions and inter-service communication.
- **LiteLLM**: Used by Python FastAPI services (ai-svc, brain-svc) for managing LLM interactions with a fallback chain (Claude Sonnet, Gemini Flash, GPT-4o-mini).
- **Postmark**: For transactional email delivery via `comms-svc`.
- **Google OAuth**: For user authentication and sign-in.
- **Third-Party Integrations (District Level)**: Google Classroom, Clever, ClassLink, Canvas LMS for roster synchronization.
- **Hetzner**: Cloud provider for deployment infrastructure.
- **GitHub Container Registry (GHCR)**: For storing and managing Docker images.
- **OWASP ZAP**: Used for weekly security baseline scans in CI.