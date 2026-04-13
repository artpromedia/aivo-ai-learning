# AIVO AI Learning Platform v3

## Overview
AI-powered adaptive learning platform for neurodiverse children. Features Brain-Clone architecture, 14 AI tutors, 5 functioning levels, and sensory profiles engine.

## Architecture

### Monorepo Structure (Turborepo + pnpm)
```
apps/web           — Next.js 15 frontend (port 5000)
packages/db        — Drizzle ORM schema (PostgreSQL 16)
packages/brand     — Design tokens, tutor catalog, roles
packages/events    — Typed NATS event definitions
packages/observability — Pino structured logging
packages/security  — JWT RS256 sign/verify (jose)
services/identity-svc  — Fastify auth service (port 3001)
services/assessment-svc — Fastify assessment API (port 3003)
services/brain-svc     — Python FastAPI brain clone (port 3002)
services/ai-svc        — Python FastAPI LLM gateway (port 3004)
services/learning-svc  — Fastify lesson sessions (port 3005)
services/tutor-svc     — Fastify tutor management (port 3006)
services/family-svc    — Fastify family collaboration + IEP (port 3007)
services/engagement-svc — Fastify gamification engine (port 3008)
services/billing-svc   — Fastify billing/subscriptions (port 3009)
services/comms-svc     — Fastify notifications/email/push (port 3010)
services/i18n-svc      — Fastify internationalization (port 3011)
services/integrations-svc — Fastify 3rd-party integrations (port 3012)
services/admin-svc     — Fastify platform admin (port 3013)
services/status-page-svc — Fastify system health/status (port 3014)
services/research-svc  — Fastify analytics/research (port 3015)
```

### Tech Stack
- **Frontend**: Next.js 15 + Tailwind CSS v4 + TypeScript
- **Backend (TS)**: Fastify 5 + Drizzle ORM + PostgreSQL 16
- **Backend (Python)**: FastAPI + LiteLLM + Uvicorn
- **Auth**: JWT RS256 (jose library), refresh tokens, PIN login. Public key served at `/api/auth/public-key` for cross-service verification. Brain-svc (Python) fetches and caches the RSA public key from identity-svc.
- **Database**: PostgreSQL 16 with JSONB brain states
- **Styling**: AIVO brand system (purple primary #7C3AED), game-themed Fredoka + Nunito fonts
- **Marketing Pages**: 10 footer pages (about, blog, careers, contact, press-kit, privacy-policy, terms-of-service, coppa-compliance, ferpa-compliance, accessibility) with shared LegalPageLayout and CompanyPageLayout components

### Key Concepts
- **14 Tutors**: 7 core (Nova/Math, Sage/ELA, Spark/Science, Chrono/History, Pixel/Coding, Echo/Speech, Harmony/SEL) + 7 expansion (Atlas/Geography, Cadence/Music, Vigor/PE, Lingua/Languages, Forge/STEM Design, Compass/Life Skills, Muse/Creative Writing). All have full system prompts with functioning-level adaptations. Compass includes transition planning module (ages 14-22). Lingua includes bilingual scaffolding with code-switching awareness.
- **Tutor Avatars**: AI-generated photorealistic portraits in `apps/web/public/images/tutors/` (14 PNG files, 3:4 aspect ratio)
- **Marketing Website**: Comprehensive landing page rebuilt as modular components in `apps/web/src/components/marketing/`. Sections: Hero (parallax blobs, gradient text, stats bar), Features (6 cards with hover effects), How It Works (4-step flow), Functioning Levels (5-level visual showcase), Brain Clone (dark section with pulsing brain visual), Tutor Carousel (auto-rotating parallax carousel with depth-stacked cards), Testimonials (4 cards with star ratings), Pricing (3 B2C plans + B2B district CTA), FAQ (accordion), CTA (gradient section), Footer (4-column links + compliance badges). Sticky header with scroll-aware transparency. All use Fredoka headings + Nunito body.
- **5 Functioning Levels**: STANDARD → SUPPORTED → LOW_VERBAL → NON_VERBAL → PRE_SYMBOLIC
- **13 Roles**: PARENT, LEARNER, TEACHER, CAREGIVER, THERAPIST, DISTRICT_ADMIN, PLATFORM_ADMIN, SALES, MARKETING, CUSTOMER_CARE, SUPPORT, FINANCE, DEVOPS
- **Internal Team Dashboards** (`/dashboard/internal/*`): 6 role-specific dashboards — Sales (pipeline, deals, MRR), Marketing (channels, campaigns, audience segments, content performance), Customer Care (tickets, CSAT/NPS, category breakdown), Support (escalations, KB articles, common issues/runbooks, system health), Finance (revenue, subscriptions, cost breakdown, transactions, payment health), DevOps (service health, infrastructure, deployments, alerts, performance metrics). Dark sidebar with role-colored badge. Route-level RBAC: each role can only access their own dashboard, PLATFORM_ADMIN can access all. DashboardHeader with purple accent.
- **Internationalization (i18n)**: Full `next-intl` integration matching legacy architecture (~2,050 keys, 19 namespaces). Auto-detects browser locale on first visit via `navigator.language`. Persists preference in `localStorage`. 10 supported locales: en, es, fr, de, pt, zh, ja, ko, ar, hi. Complete English + Spanish translations. LanguageSwitcher component on landing, login, signup, parent dashboard pages. Parent can select preferred learning language during learner enrollment (saved to `language_profiles` table). i18n-svc serves translations via API with Accept-Language detection. RTL support for Arabic. Translation files at `apps/web/src/i18n/messages/{locale}.json`. Provider at `apps/web/src/providers/i18n-provider.tsx`.
- **District Admin Dashboard** (`/dashboard/district`): 8 pages — Overview (metrics + action cards + recent learners), Schools, Learners, Staff & Teachers, Analytics & Reports (level distribution + role charts), Usage & Limits (account + AI usage bars), Integrations (connector catalog + connection management + sync history), Settings (org details + preferences). White sidebar with violet accent. Based on legacy aivo-v5 district-admin-web patterns (tenant management, usage limits, audit logs). Accessible by DISTRICT_ADMIN and PLATFORM_ADMIN roles.
- **District Integrations** (`/dashboard/district/integrations`): Connect third-party platforms (Google Classroom, Clever, ClassLink, Canvas LMS). Full connector catalog with OAuth2/API-key auth flows. Connection management (connect, sync, disconnect). Sync engine pulls rosters (classes, students, teachers) with background processing. Sync history with detailed logs. DB tables: `integration_connections`, `integration_sync_logs`, `integration_roster_mappings` (with uniqueness constraints and indexes). Tenant-scoped RBAC — district admins limited to own tenant data. Coming soon: Schoology, PowerSchool SIS.
- **Brain Clone**: Assessment → Level routing → Brain state creation → XAI explanation → Parent review/approve/amend/decline → Versioned snapshots → Rollback
- **Brain Approval Flow (RAI/XAI)**: After baseline assessment, brain clone is created with `pending_parent_review` status. XAI explanation generated for every decision (mastery scores, accommodations, tutors, signals). Parent sees the **Brain Building Sequence** first (6-stage animated visualization), then reviews via `/dashboard/parent/learner/[id]/brain-review` with 6 tabs (Overview, Learning Levels, Supports, AI Tutors, Learner Profile, AI Safety). Three decision buttons per guide: **Approve Brain** (green, activates clone), **Add Context & Rebuild** (blue, structured 4-field context form: learning context, clinical context, assessment concerns, missing info — re-runs clone pipeline), **Start Over** (gray, archives current assessment, learner retakes baseline). Brain service endpoints: GET `/{id}/review`, POST `/{id}/approve`, `/{id}/amend`, `/{id}/decline` — all parent-authorized.
- **Brain Building Sequence**: 6-stage parent-facing animated visualization (replaces Awakening on parent screen). Stages: (1) Template Selection — blueprint descends with grade/FL label, (2) Domain Assessment Results — grade ladders fill per domain with gap labels, (3) Accommodations — evidence-based cards appear with source badges, (4) Goal Mapping — stepping-stone paths from current to enrolled grade, (5) System Activation — pulse animation with encryption/versioning info, (6) Tutor Connections — each tutor connects with delivery level. Component at `apps/web/src/components/brain/BrainBuildingSequence.tsx`. Skippable animation, auto-advances through stages.
- **The Awakening Sequence**: (Child-facing, retained) Cinematic 7-phase animation (25s STANDARD, 15s LOW_VERBAL, 10s NON_VERBAL, parent-only PRE_SYMBOLIC) in discovery Finale. Canvas-based particle system runs at 60fps. BrainSphere reusable component at `apps/web/src/components/brain/BrainSphere.tsx`.
- **Baseline Assessment Breaks**: After each chapter in the Baseline Assessment, learners are offered a 30-45s break activity (Listen to Music, Word Game, or Move & Stretch). Break component at `apps/web/src/components/discovery/BreakActivity.tsx`. Skippable. Music shows animated equalizer bars, word game has letter unscramble, exercise cycles through movement prompts.
- **All 6 Domains Assessed**: ELA, Math, Science, SEL, Speech, Executive Function — each with 3-5 fallback activities per difficulty tier. Updated FUNCTIONING_LEVEL_CONFIG: STANDARD=6 chapters/5 activities, SUPPORTED=6/4, LOW_VERBAL=6/3, NON_VERBAL=4/3.

### Running Services
1. **Start application** (port 5000): Next.js frontend
2. **Identity Service** (ports 3001, 3003, 3005, 3006, 3007, 3008): Identity + Assessment + Learning + Tutor + Family + Engagement services
3. **Brain Service** (port 3002): Python FastAPI brain-svc
4. **ai-svc** (port 3004): Python FastAPI LLM gateway (start separately)

### Database
- Schema managed by Drizzle ORM in `packages/db/src/schema/`
- Migrations in `packages/db/drizzle/`
- Seed: `pnpm --filter @aivo/db exec tsx src/seed.ts`

### API Routes (proxied via Next.js rewrites)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Email login
- `POST /api/auth/pin-login` — Learner PIN login
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/public-key` — RSA public key for JWT verification (used by Python services)
- `GET /api/users/me` — Current user profile
- `GET /api/users/learners` — List learners
- `POST /api/users/learners` — Create learner (with COPPA consent + curriculum auto-detection)
- `GET /api/curriculum/lookup?zipCode=&country=` — Lookup curriculum by zip/country
- `POST /api/assessments/parent` — Parent assessment → functioning level (49 questions, 11 categories)
- `POST /api/brain/clone` — Clone brain state
- `GET /api/brain/:learnerId` — Get brain state
- `POST /api/brain/:learnerId/rollback` — Rollback to snapshot
- `POST /api/ai/generate` — Generate lesson/practice content via LLM
- `POST /api/ai/tutor/chat` — Tutor chat completion
- `POST /api/ai/generate-baseline` — Generate personalized baseline questions from parent assessment
- `GET /api/assessments/learner/baseline/:learnerId` — Fetch AI-generated baseline questions for learner
- `POST /api/learning/sessions` — Start lesson session
- `POST /api/learning/sessions/:id/complete` — Complete session + mastery write-back
- `GET /api/learning/gradebook/:learnerId` — Gradebook entries
- `GET /api/learning/path/:learnerId/:subject` — Learning path
- `GET /api/tutors/catalog` — Tutor catalog with bundles
- `POST /api/tutors/subscribe` — Subscribe to individual tutor
- `POST /api/tutors/subscribe-bundle` — Subscribe to tutor bundle
- `POST /api/tutor/session/start` — Start tutor chat session
- `POST /api/tutor/session/:id/message` — Send message in tutor chat
- `POST /api/tutor/session/:id/complete` — Complete tutor session
- `POST /api/tutors/homework/upload` — Upload homework (image OCR or text)
- `GET /api/tutors/homework/learner/:learnerId` — List assignments
- `GET /api/tutors/homework/:assignmentId` — Get assignment detail
- `POST /api/tutors/homework/session/start` — Start homework help session
- `POST /api/tutors/homework/session/:id/message` — Chat in homework session
- `POST /api/tutors/homework/session/:id/complete` — Complete homework session
- `POST /api/ai/homework/ocr` — OCR processing (ai-svc)
- `POST /api/ai/homework/adapt` — Adapt problems to functioning level (ai-svc)
- `POST /api/ai/homework/chat` — Homework chat completion (ai-svc)
- `POST /api/engagement/xp/award` — Award XP with coin/gem rewards
- `GET /api/engagement/profile/:learnerId` — Full engagement profile (XP, level, streak, badges, currency)
- `POST /api/engagement/streak/update` — Update daily streak
- `POST /api/engagement/streak/freeze` — Freeze streak (max 2/month)
- `POST /api/engagement/badge/award` — Award badge with rarity
- `GET /api/engagement/leaderboard/:scope` — Leaderboard (global/class/school)
- `GET /api/engagement/currency/:learnerId` — Currency balance + transactions
- `GET /api/engagement/shop/items` — Avatar shop catalog (50 items, 6 categories)
- `GET /api/engagement/shop/inventory/:learnerId` — Learner's inventory
- `POST /api/engagement/shop/purchase` — Purchase item with coins/gems
- `POST /api/engagement/shop/equip` — Equip/unequip avatar item
- `GET /api/engagement/quests/worlds` — Quest worlds (5 worlds)
- `GET /api/engagement/quests/:worldKey` — Quest chapters for a world
- `GET /api/engagement/quests/progress/:learnerId` — Quest progress
- `POST /api/engagement/quests/start` — Start a quest
- `POST /api/engagement/quests/complete` — Complete a quest
- `POST /api/engagement/challenges/create` — Create multiplayer challenge
- `POST /api/engagement/challenges/join` — Join with invite code
- `POST /api/engagement/challenges/:challengeId/answer` — Submit answer in challenge
- `GET /api/engagement/challenges/:challengeId` — Challenge detail + participants
- `GET /api/engagement/challenges/learner/:learnerId` — Learner's challenges
- `POST /api/engagement/sel/checkin` — SEL emotion check-in
- `GET /api/engagement/sel/checkins/:learnerId` — Check-in history
- `POST /api/engagement/break/log` — Log break activity
- `GET /api/engagement/breaks/:learnerId` — Break activity history
- `POST /api/engagement/lesson-plans/create` — Create lesson plan
- `GET /api/engagement/lesson-plans/teacher` — Teacher's lesson plans
- `GET /api/engagement/lesson-plans/learner/:learnerId` — Plans for a learner
- `GET /api/engagement/lesson-plans/:planId` — Lesson plan detail
- `PUT /api/engagement/lesson-plans/:planId` — Update lesson plan
- `GET /api/admin/stats` — Admin dashboard stats (users, learners, tenants, role counts)
- `GET /api/admin/users` — Admin user listing
- `GET /api/admin/tenants` — Admin tenant listing
- `GET /api/admin/learners` — Admin learner listing
- `POST /api/admin/create-team-member` — Create user with any role (platform admin only, all 13 roles supported; non-internal roles require valid tenantId)
- `POST /api/admin/impersonate` — Login as another user (platform admin only, returns impersonated JWT + user data)
- `POST /api/family/collaboration/accept-invite` — Accept pending collaboration invites by email
- `GET /api/family/collaboration/pending-invites` — List pending invites for current user
- `POST /api/iep/parse` — AI-powered IEP document text parsing via ai-svc
- `POST /api/ai/parse-iep` — AI IEP document parser (ai-svc direct)
- `POST /api/learning/path/:learnerId/:subject/init` — Auto-initialize learning path
- `POST /api/brain/:learnerId/engagement` — Sync engagement data to brain episodic memory
- `GET /api/brain/:learnerId/context` — Full enriched Brain context (brain state + sensory + IEP + language profile)
- `POST /api/brain/:learnerId/regression-check` — Detect ≥15% mastery regression with causal analysis
- `POST /api/assessments/sensory-profile` — Create/update learner sensory profile (5 modalities)
- `GET /api/assessments/sensory-profile/:learnerId` — Get learner sensory profile
- `POST /api/family/transition/:learnerId` — Create/update IDEA transition plan (ages 14-22)
- `GET /api/family/transition/:learnerId` — Get transition plan
- `POST /api/family/language-profile/:learnerId` — Create/update language profile (multilingual brain)
- `GET /api/family/language-profile/:learnerId` — Get language profile
- `GET /api/family/data-export/:learnerId` — GDPR-compliant full learner data export (JSON)
- `POST /api/tutor/session/:id/co-learn` — Activate parent co-learning mode in tutor session

### Frontend Pages
- `/` — Landing page (parallax tutor carousel)
- `/login` — Email login + Learner PIN login
- `/signup` — Parent registration
- `/dashboard/parent` — Parent dashboard (learner cards with compact Brain Visualization, store link)
- `/dashboard/parent/store` — Tutor Store (bundles + individual subscribe)
- `/dashboard/parent/learner/[id]/assessment` — Parent Baseline Assessment (49 questions, 11 categories)
- `/dashboard/parent/learner/[id]/sensory` — Sensory Profile Questionnaire (5 modalities: visual, auditory, tactile, vestibular, proprioceptive)
- `/dashboard/parent/learner/[id]/gradebook` — Gradebook (mastery bars, sessions, XP)
- `/dashboard/teacher` — Teacher dashboard (connected learners grid with Brain Visualization)
- `/dashboard/caregiver` — Caregiver dashboard (connected learners grid with Brain Visualization)
- `/dashboard/therapist` — Therapist dashboard (connected clients grid with Brain Visualization)
- `/dashboard/learner` — Learner dashboard (gamification panel: XP/level/streak/badges/currency + tutor grid + navigation to quests/challenges/shop/leaderboard)
- `/dashboard/learner/assessment` — Discovery Adventure (immersive baseline assessment with 6 themed chapters, tutor characters, adaptive difficulty, adventure map)
- `/dashboard/learner/lesson/[tutorKey]` — Lesson Chat UI
- `/dashboard/learner/homework` — Homework Helper (upload photo/paste text, assignment list)
- `/dashboard/learner/homework/[sessionId]` — Homework Help Session (Socratic chat + problem sidebar)
- `/dashboard/parent/[learnerId]/homework` — Parent Homework History (view child's homework activity)
- `/dashboard/parent/learner/[id]/collaboration` — Learning Team (invite teacher/caregiver/therapist)
- `/dashboard/parent/learner/[id]/recommendations` — Recommendation Inbox (approve/decline/adjust Brain recommendations)
- `/dashboard/parent/learner/[id]/iep` — IEP Goal Tracking (progress bars, trends, report generation)
- `/dashboard/learner/quests` — Quest Worlds (5 worlds: Nova, Sage, Spark, Chrono, Pixel)
- `/dashboard/learner/challenges` — Multiplayer Challenges (create/join with invite codes)
- `/dashboard/learner/shop` — Avatar Shop (50 items, 6 categories, coin/gem purchase)
- `/dashboard/learner/leaderboard` — Leaderboard (global/class/school)
- `/dashboard/learner/badges` — Badges collection page
- `/dashboard/learner/profile` — Learner profile page
- `/dashboard/learner/settings` — Learner settings page
- `/dashboard/learner/tutors` — Tutors browse page
- `/dashboard/learner/tutors/[tutorKey]` — Tutor detail page
- `/dashboard/learner/quests/[worldSlug]` — Quest world detail page
- `/dashboard/parent/learner/[id]/overview` — Parent learner overview
- `/dashboard/parent/learner/[id]/brain` — Parent brain profile viewer
- `/dashboard/parent/learner/[id]/tutors` — Parent manage learner tutors
- `/dashboard/parent/learner/[id]/settings` — Parent per-learner settings
- `/dashboard/admin` — Platform admin overview (stat cards, role distribution, service health, recent users, 30-day uptime)
- `/dashboard/admin/users` — User management with role filtering, search, role count badges
- `/dashboard/admin/learners` — Learner management with functioning level distribution cards and filtering
- `/dashboard/admin/tenants` — Tenant/district management with type breakdown, district creation form
- `/dashboard/admin/services` — Real-time service health for all 15 microservices, uptime, incident reporting
- `/dashboard/admin/ai` — AI & Brain model management (LLM providers, brain pipeline, RAI compliance, 14 tutors)
- `/dashboard/admin/compliance` — COPPA/FERPA/GDPR/SOC2 compliance dashboards, security controls, consent mgmt
- `/dashboard/admin/billing` — Subscription plans (Free/Family/Family Plus/Enterprise), payment gateways, usage metering
- `/dashboard/admin/analytics` — Research analytics (engagement metrics, mastery by subject, cohort distribution, anonymized export)
- `/dashboard/admin/settings` — Feature flags (10 toggles), system limits, platform info
- `/dashboard/internal/sales` — Sales dashboard (pipeline, deals, revenue, MRR/ACV)
- `/dashboard/internal/marketing` — Marketing dashboard (acquisition channels, campaigns, audience, content)
- `/dashboard/internal/customer-care` — Customer Care dashboard (tickets, CSAT, NPS, categories)
- `/dashboard/internal/support` — Support dashboard (escalations, knowledge base, runbooks, diagnostics)
- `/dashboard/internal/finance` — Finance dashboard (MRR, subscriptions, costs, transactions, payment health)
- `/dashboard/internal/devops` — DevOps dashboard (service health, infrastructure, deployments, alerts, performance)
- `/dashboard/notifications` — Cross-role notification inbox (filtering, read/unread)

### Engagement System
- **engagement-svc** (port 3008): XP engine (14 event types), level system (N²×100), streak engine with freeze support, badge engine with 4 rarity tiers, virtual currency (coins + gems), avatar shop, quests, multiplayer challenges, leaderboards, SEL check-ins, break activities, teacher lesson plans
- **DB Schema**: 15 engagement tables in `packages/db/src/schema/engagement.ts`
- **Seed Data**: 50 avatar items (6 categories), 25 quest chapters (5 worlds × 5 chapters)

### Discovery Adventure (Baseline Assessment)
- **Architecture**: Immersive 6-chapter adventure replacing traditional quiz-based baseline assessment
- **Chapters**: Sage (ELA), Nova (Math), Spark (Science), Harmony (SEL), Echo (Speech), Pixel (Executive Function)
- **Components**: `apps/web/src/components/discovery/` — PreAdventure, AdventureMap, ChapterIntro, ActivityRenderer, ChapterComplete, Finale
- **Engine**: `useDiscoveryEngine.ts` — Adaptive difficulty (easy→medium→hard based on chapter performance ≥80%/≤40%), functioning-level-aware chapter counts (STANDARD=6, SUPPORTED=5, LOW_VERBAL=4, NON_VERBAL=3, PRE_SYMBOLIC=0)
- **AI Integration**: Activities generated per chapter via `POST /api/assessments/learner/discovery/:learnerId/chapter` → ai-svc `build_discovery_adventure_prompt()`
- **Fallback**: Rich local fallback activities for all 6 chapters when AI service unavailable
- **Completion Flow**: `POST /api/assessments/learner/discovery/:learnerId/complete` → saves assessment_attempt with domain_scores → calls brain-svc `/api/brain/clone` with discovery results + parent assessment data
- **Brain Creation**: clone_pipeline seeds initial mastery levels from discovery scores (raw_score × difficulty_multiplier), disability_signals from parent assessment, and episodic_memory with both assessment events
- **Backend**: assessment-svc route + ai-svc `generate-discovery-chapter` endpoint + brain-svc enhanced clone pipeline

### The Stage (Learner Experience Engine)
- **Architecture**: Full-screen immersive learning environment replacing the chat-based lesson UI
- **Components**: `apps/web/src/components/stage/` — StageLayout, TutorCharacter, ResponseZone, StageContent, CelebrationOverlay, ProgressPath
- **Hooks**: useSensoryAdapter (loads sensory profile, computes rendering adaptations), useSessionFlow (beat-based state machine), useTTS (Web Speech API per-tutor voices)
- **Beat System**: Lessons structured as theatrical "beats" — narration, demonstration, interaction, celebration. Each beat specifies visuals, tutor state, interaction type, and transitions.
- **Response Types**: Multiple choice (adaptive count per functioning level), drag-and-drop, voice input, tap-to-continue
- **Sensory Adaptations**: Color saturation, animation speed, volume, subtitle mode, motion reduction, contrast boost — all computed from learner's sensory profile
- **Tutor Themes**: Each of 14 tutors has unique environment (gradient, particles, accent color, env name)
- **Session Flow**: Opening greeting → Warm-up review → Core lesson beats → Mastery check → Celebration (XP/coins/badges)
- **CSS Animations**: 17 custom keyframe animations in globals.css (breathe, speak, celebrate, think, float, confetti, etc.)

### Brain Visualization
- **Component**: `apps/web/src/components/BrainVisualization.tsx`
- **3 Views**: Brain (animated SVG neural net), RAI (safety checks), XAI (domain mastery breakdown)
- **Integration**: Parent dashboard (compact, per learner card), Teacher/Caregiver/Therapist dashboards (compact, per connected learner)
- **API**: `GET /api/brain/:learnerId` (JWT-protected via brain-svc auth)
- **Connected Learners API**: `GET /api/family/collaboration/connected-learners` (returns learners linked to authenticated teacher/caregiver/therapist)

### GitHub Repository
- **New repo**: `artpromedia/aivo-ai-learning` (pushed Phase 0+1 — 125 files, 17,627 lines)
- **Branch**: `main`

### Security
- Argon2id password hashing (via `argon2` npm package)
- Refresh tokens stored as SHA-256 hashes in DB
- PIN login scoped to parent's own learners only
- Consent revocation requires ownership verification
- Unique email constraint on users table

### Environment
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — RS256 key pair (in .replit userenv)
- `NEWBUILD` — GitHub PAT for artpromedia/aivo-ai-learning repo
