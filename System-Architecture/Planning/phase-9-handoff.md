# Phase 9 — Major development (planning)

**Prerequisite:** Phases 4–8 done. Platform includes: portal, reports, telemedicine, inventory, API keys, i18n, referrals, compliance, donors, audit, multi-currency, surrogacy, PGT/PGS, formulary/prescriptions, full ICD-11, letterhead/QR/2FA, MR printing, SMS, tenant integrations (Twilio, Daily, WhatsApp), pricing/trial, **Phase 8:** WhatsApp, newsletter/emails (TheFertilityOS branding), LIS/LIMS connectors, multi-location.

**Goal:** Next major wave — mobile readiness, API marketplace, enterprise/white-label, security/SSO, and platform hardening. Scope and order to be refined; this document is the planning handoff for Phase 9.

**Branding:** Product name **TheFertilityOS**; domain **www.thefertilityos.com**. Use blue–teal gradient for “FertilityOS” in footers and marketing; link to https://www.thefertilityos.com.

---

## 9.1 Mobile-responsive and PWA (foundation for apps)

- **Scope:** Ensure all app routes are fully responsive and touch-friendly. Add PWA manifest and service worker so the app can be “installed” on mobile devices and work offline for key views (e.g. cached dashboard). Optional: push notifications for appointment reminders (with tenant/permission controls).
- **Deliverables:** Audit and fix responsive breakpoints; PWA manifest + service worker; optional push subscription and backend support. Document in `website/PWA-AND-MOBILE.md`.

---

## 9.2 API marketplace and public catalog

- **Scope:** Public (or partner) catalog of integrations: “Connect FertilityOS with…” (e.g. accounting, LIS, messaging). Each integration: name, description, logo, link to docs or OAuth flow, optional “Connect” button that stores tenant credentials (like Integrations today). Admin can enable/disable per tenant. No full marketplace UX required in v1 — a dedicated “Integrations” or “Partners” page listing available connectors is enough.
- **Deliverables:** Data model for catalog entries (or static list); public page “Integrations” or “Partners”; optional admin UI to enable/disable integrations per tenant. Document in `website/API-MARKETPLACE.md`.

---

## 9.3 Enterprise and white-label

- **Scope:** Deeper white-label: custom domain per tenant (already partially there), hide “FertilityOS” / “TheFertilityOS” in header/footer when white-label is enabled (or show only in settings). Optional: custom logo, primary color, and login screen branding per tenant. SSO (SAML or OIDC) for enterprise tenants so staff sign in via identity provider.
- **Deliverables:** Tenant settings for white-label (logo, colors, optional “Powered by” toggle). Optional SSO config (SAML/OIDC) and login flow. Document in `website/ENTERPRISE-WHITELABEL.md`.

---

## 9.4 Security and compliance hardening

- **Scope:** Security audit and hardening: rate limiting on auth and public APIs; CSP headers; audit log for sensitive reads (e.g. patient list export); optional IP allowlist for admin/super. Compliance: document data retention and deletion (GDPR-style); optional “Export my data” and “Delete my data” for patients. Ensure all outbound emails (campaigns, reminders) use TheFertilityOS footer with gradient “FertilityOS” link to www.thefertilityos.com when in platform mode.
- **Deliverables:** Rate limiting, CSP, audit for sensitive actions; data retention/deletion doc; optional patient data export/delete. Document in `website/SECURITY-AND-COMPLIANCE.md`.

---

## 9.5 Native mobile apps (exploration)

- **Scope:** Explore React Native or Flutter app for staff (and optionally patients) that uses the same APIs. Phase 9 can be “design and API contract” only; actual app build can follow in Phase 10. Document API stability and versioning for mobile clients.
- **Deliverables:** Decision doc (stack, scope); optional API versioning or mobile-specific endpoints; document in `website/MOBILE-APPS.md`.

---

## Execution (Phase 9)

- **Order:** 9.1 (PWA/mobile) and 9.4 (security) can run in parallel with 9.2 (catalog). 9.3 (enterprise/SSO) and 9.5 (mobile exploration) can follow.
- **Agents:** One agent per section when ready; handoff doc is the source of truth. Update `next-steps-development.md` and product roadmap as Phase 9 items complete.
