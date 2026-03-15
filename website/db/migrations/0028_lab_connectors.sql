-- LIS/LIMS lab integration (Phase 8.3): connectors, orders, result mappings
DO $$ BEGIN
  CREATE TYPE "lab_connector_type" AS ENUM('lis', 'lims');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "lab_connectors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "type" "lab_connector_type" NOT NULL,
  "provider" varchar(64) NOT NULL,
  "config" jsonb DEFAULT '{}' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_sync_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_connectors_tenant_idx" ON "lab_connectors" ("tenant_id");

CREATE TABLE IF NOT EXISTS "lab_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "cycle_id" uuid REFERENCES "ivf_cycles"("id") ON DELETE SET NULL,
  "specimen_id" uuid,
  "connector_id" uuid REFERENCES "lab_connectors"("id") ON DELETE SET NULL,
  "external_id" varchar(255),
  "order_code" varchar(128),
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "requested_at" timestamptz,
  "result_at" timestamptz,
  "result_payload" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_orders_tenant_idx" ON "lab_orders" ("tenant_id");
CREATE INDEX IF NOT EXISTS "lab_orders_patient_idx" ON "lab_orders" ("patient_id");
CREATE INDEX IF NOT EXISTS "lab_orders_cycle_idx" ON "lab_orders" ("cycle_id");
CREATE INDEX IF NOT EXISTS "lab_orders_connector_external_idx" ON "lab_orders" ("connector_id", "external_id");

CREATE TABLE IF NOT EXISTS "lab_result_mappings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "connector_id" uuid NOT NULL REFERENCES "lab_connectors"("id") ON DELETE CASCADE,
  "external_code" varchar(128) NOT NULL,
  "internal_code" varchar(128) NOT NULL,
  "description" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lab_result_mappings_connector_idx" ON "lab_result_mappings" ("connector_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lab_result_mappings_connector_external_idx" ON "lab_result_mappings" ("connector_id", "external_code");
