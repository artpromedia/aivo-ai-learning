-- First, drop the partially created assessment_items table (it was created without FK)
DROP TABLE IF EXISTS assessment_items;

-- Add missing enum values for assessment_mode
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'STANDARD';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'MODIFIED';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'PICTURE_BASED';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'SWITCH_SCAN';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'EYE_GAZE';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'PARTNER_ASSISTED';
ALTER TYPE assessment_mode ADD VALUE IF NOT EXISTS 'OBSERVATIONAL';

-- Add missing enum values for assessment_status
ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'ABANDONED';

-- Now create baseline_assessments with correct uppercase default
CREATE TABLE IF NOT EXISTS "baseline_assessments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "learner_id" uuid NOT NULL REFERENCES "learners"("id") ON DELETE CASCADE,
    "assessment_mode" "assessment_mode" NOT NULL,
    "status" "assessment_status" DEFAULT 'IN_PROGRESS' NOT NULL,
    "domains" jsonb DEFAULT '{}'::jsonb,
    "raw_responses" jsonb DEFAULT '{}'::jsonb,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "baseline_assessments_learner_id_idx" ON "baseline_assessments" ("learner_id");

-- Now create assessment_items with FK
CREATE TABLE IF NOT EXISTS "assessment_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "baseline_assessment_id" uuid NOT NULL REFERENCES "baseline_assessments"("id") ON DELETE CASCADE,
    "domain" varchar(128) NOT NULL,
    "skill" varchar(255) NOT NULL,
    "difficulty" varchar(64) NOT NULL,
    "response" jsonb,
    "is_correct" boolean,
    "response_time_ms" integer,
    "presented_at" timestamp with time zone DEFAULT now() NOT NULL,
    "responded_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "assessment_items_assessment_id_idx" ON "assessment_items" ("baseline_assessment_id");
