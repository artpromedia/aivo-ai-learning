SELECT enum_range(NULL::assessment_mode);
SELECT enum_range(NULL::assessment_status);

CREATE TABLE IF NOT EXISTS "baseline_assessments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "learner_id" uuid NOT NULL,
    "assessment_mode" "assessment_mode" NOT NULL,
    "status" "assessment_status" DEFAULT 'IN_PROGRESS' NOT NULL,
    "domains" jsonb DEFAULT '{}'::jsonb,
    "raw_responses" jsonb DEFAULT '{}'::jsonb,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "baseline_assessments_learner_id_idx" ON "baseline_assessments" ("learner_id");

ALTER TABLE "baseline_assessments" ADD CONSTRAINT "baseline_assessments_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "assessment_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "baseline_assessment_id" uuid NOT NULL,
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

ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_baseline_assessment_id_baseline_assessments_id_fk" FOREIGN KEY ("baseline_assessment_id") REFERENCES "baseline_assessments"("id") ON DELETE CASCADE;
