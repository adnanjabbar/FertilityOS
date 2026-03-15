-- Phase 8.2: Newsletter and email campaigns. Tenant email_sending_mode (platform | custom_domain) and optional custom SMTP.
-- Idempotent: safe to run multiple times.

DO $$ BEGIN
  CREATE TYPE "email_sending_mode" AS ENUM ('platform', 'custom_domain');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "email_campaign_status" AS ENUM ('draft', 'scheduled', 'sent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'email_sending_mode') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "email_sending_mode" "email_sending_mode" DEFAULT 'platform';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_host') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_host" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_port') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_port" integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_user') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_user" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_password') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_password" text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_from_email') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_from_email" varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_integrations' AND column_name = 'custom_smtp_secure') THEN
    ALTER TABLE "tenant_integrations" ADD COLUMN "custom_smtp_secure" boolean DEFAULT true;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "email_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "subject" varchar(512) NOT NULL,
  "body_html" text NOT NULL,
  "body_text" text NOT NULL,
  "status" "email_campaign_status" NOT NULL DEFAULT 'draft',
  "scheduled_at" timestamptz,
  "sent_at" timestamptz,
  "created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "recipient_filter" text NOT NULL DEFAULT 'all',
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "email_campaigns_tenant_status_idx" ON "email_campaigns" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "email_campaigns_scheduled_at_idx" ON "email_campaigns" ("scheduled_at");

CREATE TABLE IF NOT EXISTS "email_send_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" uuid NOT NULL REFERENCES "email_campaigns"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "sent_at" timestamptz DEFAULT now() NOT NULL,
  "provider" varchar(32) NOT NULL
);
CREATE INDEX IF NOT EXISTS "email_send_log_campaign_idx" ON "email_send_log" ("campaign_id");
CREATE INDEX IF NOT EXISTS "email_send_log_patient_idx" ON "email_send_log" ("patient_id");
