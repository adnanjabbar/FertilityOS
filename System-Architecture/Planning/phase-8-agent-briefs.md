# Phase 8 — Agent briefs (run in parallel)

Use `System-Architecture/Planning/phase-8-handoff.md` as the single source of truth. Each agent implements one section.

---

## Agent 8.1 — WhatsApp integration (tenant-owned)

Implement **Section 8.1**: Tenant-owned WhatsApp. Extend `tenant_integrations` (or new table) with whatsapp_provider, whatsapp_phone_number_id, whatsapp_access_token (or provider-specific fields). Migration. GET/PATCH APIs for WhatsApp config (admin only). Helper in `lib/whatsapp.ts` that sends using tenant credentials. Settings → Integrations: "WhatsApp" section with provider select, phone number ID, token; hint "Use your own WhatsApp Business account; we do not provide or pay for WhatsApp." Optional: extend reminder channel to include WhatsApp. Create `website/WHATSAPP-INTEGRATION.md`.

---

## Agent 8.2 — Newsletter and automated emails

Implement **Section 8.2**: Email campaigns (draft, schedule, send). Schema: email_campaigns, optional email_send_log, tenant email_sending_mode (platform | custom_domain). **Branding:** Default footer must show "FertilityOS" in **blue–teal gradient** style and link to **https://www.thefertilityos.com** (product is TheFertilityOS, domain www.thefertilityos.com). Premium: tenant SMTP/custom domain, no platform footer. Campaign CRUD APIs, send pipeline, "Newsletter" or "Email campaigns" UI under Administration, email settings UI. Create `website/NEWSLETTER-AND-EMAILS.md`.

---

## Agent 8.3 — LIS/LIMS lab integration

Implement **Section 8.3**: Lab connectors. Schema: lab_connectors (tenantId, name, type, provider, config JSONB, isActive, lastSyncAt). Optional: lab_orders, lab_result_mappings. CRUD APIs for connectors (admin). Optional: sync/import results endpoint. Settings → Integrations or "Lab integration" UI: list connectors, add (type/provider, config), test connection. Optional: Lab results section on patient/cycle. Create `website/LIS-LIMS-INTEGRATION.md`.

---

## Agent 8.4 — Multi-location support

Implement **Section 8.4**: Locations. Schema: locations (tenantId, name, address, city, state, country, postalCode, timezone, isDefault). Add locationId to appointments (nullable FK). Optional: locationId on patients, users. CRUD locations (admin). GET locations for tenant. Appointments: filter by location, create with locationId. Settings → Locations UI: list, add, edit. Optional: reports filter by location. Create `website/MULTI-LOCATION.md`.
