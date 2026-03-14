-- Phase 3.1: Patients table (per-tenant).
CREATE TABLE IF NOT EXISTS "patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "first_name" varchar(255) NOT NULL,
  "last_name" varchar(255) NOT NULL,
  "date_of_birth" timestamp with time zone,
  "email" varchar(255),
  "phone" varchar(64),
  "address" text,
  "city" varchar(128),
  "state" varchar(128),
  "country" varchar(2),
  "postal_code" varchar(32),
  "gender" varchar(32),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "patients_tenant_id_idx" ON "patients" ("tenant_id");
