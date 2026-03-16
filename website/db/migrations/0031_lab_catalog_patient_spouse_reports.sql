-- Lab: test category + male/female reference ranges; lab report documents (upload + traceability); Patient: spouse + DEI gender + couple type

-- lab_tests: add category and sex-specific reference ranges
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "category" varchar(128);
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "reference_range_male_low" varchar(64);
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "reference_range_male_high" varchar(64);
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "reference_range_female_low" varchar(64);
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "reference_range_female_high" varchar(64);

-- Lab report documents: external report upload + traceability (lab name, location, MR on report)
CREATE TABLE IF NOT EXISTS "lab_report_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "lab_name" varchar(255),
  "lab_location" varchar(255),
  "mr_number_on_report" varchar(64),
  "file_key" varchar(512),
  "notes" text,
  "reported_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_report_documents_tenant_idx" ON "lab_report_documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "lab_report_documents_patient_idx" ON "lab_report_documents" ("patient_id");

-- Patients: spouse info, relationship status, couple type (DEI), gender identity
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "spouse_first_name" varchar(255);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "spouse_last_name" varchar(255);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "spouse_date_of_birth" timestamptz;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "spouse_email" varchar(255);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "spouse_phone" varchar(64);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "relationship_status" varchar(32);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "couple_type" varchar(32);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "gender_identity" varchar(64);
