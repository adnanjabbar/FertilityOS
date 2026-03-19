-- Phase 10.3: Platform-level email templates (global).
-- Used by Super Admin to customize emails sent to clinics/admins across all tenants.

CREATE TABLE IF NOT EXISTS "platform_email_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_key" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "subject" varchar(255) NOT NULL,
  "html" text NOT NULL,
  "text" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_email_templates_key_idx" ON "platform_email_templates" ("template_key");

