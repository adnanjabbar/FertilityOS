# WhatsApp Integration (Phase 8.1)

FertilityOS lets clinics connect their **own** WhatsApp Business API (or an approved provider) for patient updates and appointment reminders. The platform does **not** provide or pay for WhatsApp — we only store tenant credentials and send messages via their account.

## Overview

- **Tenant-owned:** Each clinic adds their own WhatsApp Business account in **Settings → Integrations**.
- **Providers supported:** Twilio (WhatsApp) and Meta Cloud API.
- **Use cases (v1):** Appointment reminders (when reminder channel is set to “WhatsApp only”), and optional future flows (e.g. prescription ready, appointment confirmed). Templates and automation can be added in a later iteration.

## Schema and storage

- **Table:** `tenant_integrations` (one row per tenant).
- **Columns added (migration `0027_whatsapp_integration.sql`):**
  - `whatsapp_provider` — `twilio_whatsapp` | `meta_cloud_api`
  - `whatsapp_phone_number_id` — Meta Cloud API: Phone Number ID
  - `whatsapp_access_token` — Meta Cloud API: permanent access token
  - `whatsapp_from_number` — Twilio: E.164 “From” number for WhatsApp (or reuse Twilio SMS number)
  - `whatsapp_template_namespace` — optional, for future template use
- **Appointments:** `reminder_whatsapp_sent_at` — set when a WhatsApp reminder has been sent for that appointment.
- **Tenant settings:** `reminder_channel` enum includes `whatsapp` (alongside `email`, `sms`, `both`).

## APIs

- **GET /api/app/integrations** — Returns integration status including WhatsApp (e.g. `whatsappConfigured`, `whatsappProvider`). Tokens and raw IDs are not returned; masked placeholders (e.g. `••••1234`) are shown where applicable.
- **PATCH /api/app/integrations** — Body may include `whatsappProvider`, `whatsappPhoneNumberId`, `whatsappAccessToken`, `whatsappFromNumber`, `whatsappTemplateNamespace`. **Admin only.**

## Sending (internal helper)

- **`lib/whatsapp.ts`**
  - `sendWhatsApp({ to, body, tenantId })` — Loads the tenant’s WhatsApp config from `tenant_integrations` and sends via the configured provider (Twilio or Meta Cloud API).
  - `appointmentReminderWhatsAppBody({ patientFirstName, startAt, type, clinicName })` — Builds the reminder text.
  - For **Twilio WhatsApp:** uses the same Twilio account as SMS (Account SID, Auth Token from `tenant_integrations`); “From” is `whatsapp_from_number` or, if not set, the tenant’s Twilio phone number (if WhatsApp-enabled).
  - For **Meta Cloud API:** uses `whatsapp_phone_number_id` and `whatsapp_access_token` with the Graph API (`/v18.0/{phone_number_id}/messages`).

## Settings UI

- **Settings → Integrations** includes a **WhatsApp** section:
  - Provider select: Not configured | Twilio (WhatsApp) | Meta Cloud API
  - **Twilio:** “WhatsApp From number” (E.164). Uses the same Twilio credentials as the SMS section.
  - **Meta:** Phone number ID and Access token.
  - Hint: *“Use your own WhatsApp Business account; we do not provide or pay for WhatsApp.”*

## Appointment reminders

- In **Settings → Billing** (or tenant settings), **Reminder channel** can be set to **WhatsApp only** (as well as Email only, SMS only, Email and SMS).
- The cron endpoint **GET/POST /api/cron/send-appointment-reminders** (with `CRON_SECRET`):
  - For tenants with `reminder_channel = 'whatsapp'`, sends WhatsApp reminders for appointments in the next 24 hours (when `reminder_whatsapp_sent_at` is null).
  - Uses `lib/whatsapp.ts` and then sets `reminder_whatsapp_sent_at` on the appointment.
- Patient must have a phone number on file for WhatsApp reminders.

## Migration

- Run migrations so that `0027_whatsapp_integration.sql` is applied (adds enum value `whatsapp` to `reminder_channel`, creates `whatsapp_provider` enum, adds columns to `tenant_integrations`, adds `reminder_whatsapp_sent_at` to `appointments`).
- From `website/`: `node scripts/run-migrations.js` (requires `DATABASE_URL` in `.env`). If you are on PostgreSQL &lt; 12 and the enum step fails, run once manually: `ALTER TYPE reminder_channel ADD VALUE 'whatsapp';`

## Security and compliance

- WhatsApp credentials (tokens, phone number IDs) are stored per tenant and used only for that tenant’s sends.
- No platform-owned WhatsApp account; all usage and costs are the tenant’s responsibility.
- Ensure your use of WhatsApp complies with [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy) and applicable data-protection regulations.
