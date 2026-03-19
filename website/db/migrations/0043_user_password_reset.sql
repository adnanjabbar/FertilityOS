-- Phase 10.2: Staff/admin password reset tokens.
-- Mirrors patient_password_tokens but for app users (admins/staff/super_admin).

CREATE TABLE IF NOT EXISTS "user_password_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(64) NOT NULL,
  "type" varchar(16) NOT NULL DEFAULT 'reset',
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_password_tokens_token_idx" ON "user_password_tokens" ("token");
CREATE INDEX IF NOT EXISTS "user_password_tokens_user_idx" ON "user_password_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "user_password_tokens_expires_idx" ON "user_password_tokens" ("expires_at");

