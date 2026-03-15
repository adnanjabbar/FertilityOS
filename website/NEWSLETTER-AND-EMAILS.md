# Newsletter and Email Campaigns (Phase 8.2)

This document describes the newsletter and automated email feature for FertilityOS: tenant-facing email campaigns with two sending modes and platform branding.

## Overview

Clinics can send **newsletters and campaign emails** to patients from **Administration → Email campaigns**. Two modes:

1. **Default (platform)** — Emails are sent via FertilityOS infrastructure (Resend). The **From** uses the clinic name; the **footer** includes “Sent via FertilityOS” with “FertilityOS” in a blue–teal gradient linking to **https://www.thefertilityos.com**. The product and canonical domain are TheFertilityOS (www.thefertilityos.com).

2. **Custom domain (premium)** — The tenant configures their own SMTP (host, port, user, password, From address). Emails are sent via the tenant’s server; **no platform footer** is added.

## Branding (default mode)

- In the email footer we show: **Sent via [FertilityOS](https://www.thefertilityos.com)**.
- “FertilityOS” is the only linked text and is styled with a **blue–teal gradient** (e.g. `from-blue-600` to `teal-500` in Tailwind; inline HTML gradient for email clients).
- The link target is always **https://www.thefertilityos.com** (canonical domain). Do not use “FertilityOS” alone as the domain.

## Schema

- **email_campaigns** — `id`, `tenantId`, `name`, `subject`, `bodyHtml`, `bodyText`, `status` (draft | scheduled | sent), `scheduledAt`, `sentAt`, `createdById`, `recipientFilter`, `createdAt`, `updatedAt`.
- **email_send_log** (optional) — `id`, `campaignId`, `patientId`, `sentAt`, `provider` (e.g. `resend` | `smtp`) for per-recipient logging.
- **tenant_integrations** (extended) — `email_sending_mode` (platform | custom_domain), and for premium: `custom_smtp_host`, `custom_smtp_port`, `custom_smtp_user`, `custom_smtp_password`, `custom_smtp_from_email`, `custom_smtp_secure`.

Migration: `0026_email_campaigns_and_tenant_email_settings.sql`.

## Sending pipeline

- **Platform mode:** Uses existing Resend (`RESEND_API_KEY`). From address is clinic name + platform domain (e.g. `noreply@thefertilityos.com`). HTML and text bodies are appended with the platform footer (gradient “FertilityOS” link to www.thefertilityos.com).
- **Custom domain mode:** Uses tenant SMTP (nodemailer). No footer is appended. Store `provider` in `email_send_log` as `resend` or `smtp`.

Campaign “Send now” resolves recipients from `recipientFilter` (e.g. `"all"` = all patients with a non-empty email), sends one email per recipient, writes `email_send_log` rows, and sets campaign `status` to `sent` and `sentAt` to now.

## APIs

- **GET /api/app/email-campaigns** — List campaigns (tenant-scoped, admin only).
- **POST /api/app/email-campaigns** — Create draft (name, subject, bodyHtml, bodyText, recipientFilter).
- **GET /api/app/email-campaigns/[id]** — Get one campaign.
- **PATCH /api/app/email-campaigns/[id]** — Update draft/scheduled (subject, body, etc.).
- **DELETE /api/app/email-campaigns/[id]** — Delete draft only.
- **POST /api/app/email-campaigns/[id]/send-test** — Send a test email (body: `{ to: "email@example.com" }`).
- **POST /api/app/email-campaigns/[id]/send** — Send campaign now to all recipients.

Email sending mode and custom SMTP are managed via **GET/PATCH /api/app/integrations** (same as Twilio/Daily/WhatsApp).

## UI

- **Administration → Email campaigns** — List campaigns; “Create draft”; open campaign to edit (draft) or view (sent). Draft: edit name, subject, body (HTML + plain text), recipient filter; “Save draft”, “Send test”, “Send now”, “Delete draft”.
- **Administration → Integrations** — Section **Email sending**: mode **Default (TheFertilityOS)** vs **Custom domain (premium)**. If custom, form for SMTP host, port, TLS, user, password, From email. Preview of platform footer when Default is selected.

## Footer component

- **Server / email:** `lib/email-footer.ts` — `platformEmailFooterHtml()`, `platformEmailFooterText()`, `appendPlatformFooter()`, `appendPlatformFooterText()` for use in the send pipeline.
- **In-app (React):** `app/components/PlatformEmailFooter.tsx` — Renders “Sent via” + gradient “FertilityOS” link to https://www.thefertilityos.com for previews and settings.

## Environment

- **RESEND_API_KEY** — Required for platform-mode sending. If unset, campaign send and test still “succeed” but log only (e.g. local dev).
- **REMINDER_FROM_EMAIL** — Optional; defaults to `FertilityOS <noreply@thefertilityos.com>`. The local part/domain is used when building From with clinic name in platform mode.

## Optional future work

- Schedule send at a specific time (cron to process `scheduledAt`).
- Recipient segments (e.g. JSON in `recipientFilter`) and stats (opened, clicked) if tracking is added.
