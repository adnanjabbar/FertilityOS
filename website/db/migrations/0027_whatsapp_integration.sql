-- Phase 8.1: WhatsApp integration (tenant-owned). Extend tenant_integrations and reminder channel.
-- Requires PostgreSQL 12+ (ADD VALUE in transaction). If on older PG, run once manually:
--   ALTER TYPE reminder_channel ADD VALUE 'whatsapp';

ALTER TYPE reminder_channel ADD VALUE IF NOT EXISTS 'whatsapp';

-- WhatsApp provider enum for tenant_integrations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_provider') THEN
    CREATE TYPE whatsapp_provider AS ENUM ('twilio_whatsapp', 'meta_cloud_api');
  END IF;
END $$;

-- Tenant integrations: WhatsApp columns
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS whatsapp_provider whatsapp_provider;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id text;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS whatsapp_access_token text;
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS whatsapp_from_number varchar(32);
ALTER TABLE tenant_integrations ADD COLUMN IF NOT EXISTS whatsapp_template_namespace text;

-- Appointments: WhatsApp reminder sent timestamp
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_whatsapp_sent_at timestamp with time zone;
