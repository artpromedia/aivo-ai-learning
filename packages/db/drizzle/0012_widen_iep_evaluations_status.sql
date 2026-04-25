-- 0009 created iep_evaluations.status as varchar(20), but the decision
-- handler in assessment-svc/src/routes/iep-evaluations.ts persists the
-- terminal state "eligibility_determined" (23 chars). Widen the column
-- so the production code matches the storage shape.

ALTER TABLE "iep_evaluations"
  ALTER COLUMN "status" TYPE varchar(40);
