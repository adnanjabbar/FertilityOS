-- Surrogacy case management: cases linked to intended parents (patients) and surrogate info
CREATE TABLE IF NOT EXISTS "surrogacy_cases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "case_number" varchar(64) NOT NULL,
  "intended_parent_patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "surrogate_name" varchar(255) NOT NULL,
  "surrogate_contact" text,
  "status" varchar(32) NOT NULL DEFAULT 'matching',
  "start_date" timestamptz,
  "due_date" timestamptz,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "surrogacy_cases_tenant_case_number_idx" ON "surrogacy_cases" ("tenant_id", "case_number");
CREATE INDEX IF NOT EXISTS "surrogacy_cases_tenant_idx" ON "surrogacy_cases" ("tenant_id");
