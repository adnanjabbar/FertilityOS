-- Donor management: egg, sperm, embryo donors (unique code per tenant)
DO $$ BEGIN
  CREATE TYPE donor_type AS ENUM ('egg', 'sperm', 'embryo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "donors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "type" donor_type NOT NULL,
  "donor_code" varchar(64) NOT NULL,
  "first_name" varchar(255),
  "last_name" varchar(255),
  "date_of_birth" timestamptz,
  "blood_type" varchar(16),
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "donors_tenant_code_idx" ON "donors" ("tenant_id", "donor_code");
