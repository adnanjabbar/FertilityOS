-- Audit logs for key actions (compliance and debugging)
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(128) NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" uuid,
  "details" text,
  "ip_address" varchar(45),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_tenant_created_idx" ON "audit_logs" ("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_action_idx" ON "audit_logs" ("tenant_id", "action");
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_entity_idx" ON "audit_logs" ("tenant_id", "entity_type");
