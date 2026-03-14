# Old-System — Previous FertilityOS Implementation

This folder preserves the **pre-architecture** implementation of FertilityOS. It is kept for reference, migration insights, and to inform the new phased build. Do not use it as the primary codebase; the canonical application lives in the repo root (`website/`, future backend, etc.).

---

## Summary

- **Stack:** Node.js (Express), PostgreSQL, vanilla JS frontend, Nginx, PM2.
- **Deployment:** Ubuntu VPS; Nginx serves static files from `/public` and reverse-proxies `/api` to Node.
- **Architecture:** Multi-tenant (subdomain → clinic); modular routes/controllers; health checks, CORS, rate limiting, graceful shutdown.

---

## What Was Built

| Area | Description |
|------|-------------|
| **Auth** | Login, JWT, registration wizard (multi-step signup). |
| **Patients** | Patient list, details, intake, demographics, countries data. |
| **Clinical** | IVF cycles, embryos, treatments, lab tests, medications, documents. |
| **Finance** | Billing, receipts, payments, subscription + Stripe (optional). |
| **Clinic** | Clinic routes, organization settings, tenant middleware. |
| **Other** | Dashboard, inventory, assets, semen report, reports, settings. |

---

## Key Files (Reference)

- `ARCHITECTURE.md` — Runtime topology, backend design, multi-tenant strategy, API surface, roadmap.
- `src/server.js` — Entry point, middleware, route mounting.
- `src/config/database.js` — PostgreSQL pool.
- `src/config/runtime.js` — Environment-driven config.
- `src/middleware/tenant.middleware.js` — Tenant resolution.
- `src/routes/*` — API routes (auth, patient, cycle, embryo, lab, billing, etc.).
- `src/controllers/*` — Request handlers.
- `public/*` — Static HTML/CSS/JS (dashboard, patients, register-wizard, etc.).
- `migration/*` — SQL migrations (subscription, regulatory, etc.).

---

## How This Informs the New Build

1. **Domain boundaries** — Identity, Clinical, Financial, Platform (as in ARCHITECTURE.md).
2. **API design** — Existing route patterns and payloads can guide REST or GraphQL design.
3. **Schema hints** — SQL files in `src/config/` and `migration/` inform new schema design.
4. **Multi-tenancy** — Subdomain-based tenant resolution remains a valid strategy; new system will formalize it in System-Architecture docs.

---

## Skills & Conventions

When working on the **new** FertilityOS (website + future backend), follow:

- **Design:** `System-Architecture/Design/` — branding guidelines and design system (website is canonical UI source).
- **Planning:** `System-Architecture/Planning/` — MVP scope, roadmap, tech stack, feature prioritization.
- **Skills:** `System-Architecture/Skills/skills.md` — global skills registry for agents.

This Old-System folder is **reference only**; all new development happens in the main repo with clear phase-by-phase documentation in System-Architecture.
