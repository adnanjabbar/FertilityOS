# Pricing Strategy — FertilityOS

## Goal

Make FertilityOS **affordable and adoptable** for IVF centers and clinics globally. Current plan values on the marketing site are placeholders; this document defines the **target positioning**: lower base price, **core vs add-on modules**, and clear value so clinics can start small and scale.

---

## Principles

1. **Affordable entry** — Base plans should be within reach of small practices and single-location clinics.
2. **Modular growth** — Core features in base plan; advanced capabilities (Pharmacy, Cryostorage, HR, etc.) as add-ons so clinics pay only for what they use.
3. **Transparent** — Clear per-module pricing; no hidden fees; API usage and EMR integration can be monetized separately (see API & integrations below).
4. **Global SaaS** — Pricing should work across regions (consider USD as default, with localization later).

---

## Core vs Add-On Modules

### Core (included in base plan)

- Patient Management (registration, demographics, medical history)
- Scheduling & Appointments
- Basic EMR (clinical notes)
- IVF Lab & Embryology (core cycle and embryo tracking)
- Financial Management (invoicing, basic billing)
- Staff & Role Management (RBAC)
- Default subdomain (e.g. `clinic.fertilityo.com`)
- Email support

### Add-On Modules (per-module pricing, e.g. $5–$15/month or similar bands)

| Module | Description | Indicative band |
|--------|-------------|------------------|
| Pharmacy | Medications, dispensing, inventory | $5–$10 |
| Cryostorage Management | Tank/straw tracking, alerts | $5–$10 |
| Embryology Progress | Advanced embryology workflows | Core or low add-on |
| IVF Cycles (advanced) | Deeper cycle analytics, protocols | Core or low add-on |
| HR & Payroll | Staff payroll, leave, contracts | $10–$20 |
| Financial Dashboard | Advanced reporting, KPIs | $5–$15 |
| Asset Management | Equipment, maintenance | $5–$10 |
| Expenses Management | Approval workflows, categories | $5–$10 |
| CRM | Leads, follow-ups, marketing | $10–$15 |
| SMS / WhatsApp | Patient alerts, reminders | Usage-based or per-seat |
| White-label / Custom domain | BYO domain, clinic branding | Higher tier or add-on |
| Telemedicine | Video consultations | $10–$20 |
| Patient Portal | Patient-facing login, documents | $5–$15 |
| Donor / Surrogacy Management | Donor and surrogacy tracking | $10–$20 |
| Compliance & Audit | Audit trails, compliance reports | $5–$15 |
| Analytics & Reporting | Advanced dashboards | $5–$15 |

*Exact numbers to be set based on market research and unit economics; the above are directional.*

---

## Tier Structure (Target)

- **Starter** — Small practices; limited providers/patients; core modules only; low monthly price.
- **Growth** — More providers/patients; custom domain; white-label; 1–2 add-ons included; API access.
- **Scale** — Multi-location; more add-ons included or unlimited; dedicated support; SLA; HIPAA BAA.

Base prices should be **reduced from current placeholder values** so that total cost (base + add-ons) remains competitive and “adds up” only as clinics enable more modules.

---

## API & EMR Integrations

- **External EMRs / third-party systems** integrating with FertilityOS core (e.g. via REST/GraphQL APIs) can be charged for:
  - API access (per tier or usage-based)
  - Rate limits and premium endpoints
  - Webhooks and data sync
- Documentation for these APIs will live in System-Architecture and eventually become public developer docs; pricing for API usage will be defined in a separate commercial/API policy.

---

## Next Steps

1. Validate base price and add-on bands with a few target clinics or advisors.
2. Update the marketing website `website/app/components/Pricing.tsx` (and any copy) when final numbers are set.
3. Implement feature flags / entitlement checks in the app so modules are gated by plan and add-ons.
4. Document API surface and usage in System-Architecture for future developer-facing and pricing documentation.
