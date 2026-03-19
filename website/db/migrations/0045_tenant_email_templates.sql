-- Phase 10.4: Tenant-managed email templates (patient communications).
-- Tenants can customize subject/body; powered-by footer is controlled via tenant_branding.show_powered_by.

CREATE TABLE IF NOT EXISTS "tenant_email_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "template_key" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "subject" varchar(255) NOT NULL,
  "html" text NOT NULL,
  "text" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_email_templates_tenant_key_idx"
  ON "tenant_email_templates" ("tenant_id", "template_key");

