CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "session_id" varchar(255) NOT NULL,
  "user_agent" text,
  "ip_address" varchar(45),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz,
  "revoked_at" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_session_id_idx" ON "user_sessions" ("session_id");
CREATE INDEX IF NOT EXISTS "user_sessions_user_idx" ON "user_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_tenant_idx" ON "user_sessions" ("tenant_id");

