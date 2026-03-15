-- Multi-location support (Phase 8.4): locations table and locationId on appointments, optional on patients/users.
CREATE TABLE IF NOT EXISTS "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "address" text,
  "city" varchar(128),
  "state" varchar(128),
  "country" varchar(2),
  "postal_code" varchar(32),
  "timezone" varchar(64),
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "locations_tenant_idx" ON "locations" ("tenant_id");

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "preferred_location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL;
