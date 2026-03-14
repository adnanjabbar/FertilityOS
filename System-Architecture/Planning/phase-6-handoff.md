# Phase 6 — Next batch: Agent handoff

**Prerequisite:** Phase 4 and Phase 5 (5.1–5.4) done.  
**Goal:** Implement the next set of features in parallel with multiple agents.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js, Drizzle, Auth.js).  
**Conventions:** Tenant-scoped APIs, `website/db/schema.ts`, migrations in `website/db/migrations/`, add to `run-migrations.js`.

---

## 6.1 Donor management module

**Scope:** Track donors (egg/sperm) and link them to patients/cycles. Read-only or minimal CRUD for MVP.

- **Schema:** `donors` table: id, tenantId, type (egg|sperm|embryo), donorCode (unique per tenant), firstName, lastName (optional/anonymized), dateOfBirth, bloodType, notes, createdAt, updatedAt. Optional: `patient_donor_links` (patientId, donorId, relationship e.g. egg_donor) if many-to-many.
- **APIs:** `GET /api/app/donors` (list), `POST /api/app/donors` (create), `GET /api/app/donors/[id]`, `PATCH /api/app/donors/[id]`. All tenant-scoped.
- **UI:** `/app/donors` — list donors (code, type, optional name), add donor form, detail/edit. From patient or IVF cycle: optional "Link donor" select. Nav: "Donors" (admin or lab role).
- **Deliverables:** Schema + migration, CRUD APIs, donors list/detail page. Document in `website/DONOR-MANAGEMENT.md`.

---

## 6.2 Audit logging (key actions)

**Scope:** Log important actions (login, patient create/update, invoice create, etc.) for compliance and debugging. Admin view to browse recent logs.

- **Schema:** `audit_logs` table: id, tenantId, userId (nullable), action (varchar, e.g. "patient.create"), entityType (e.g. "patient"), entityId (uuid nullable), details (jsonb or text), ipAddress (optional), createdAt.
- **APIs:** `POST` not needed from client—backend writes on key actions. `GET /api/app/audit-logs` — list for tenant with filters (action, entityType, date range, limit). Admin only.
- **Implementation:** Create a small `lib/audit.ts` that accepts (tenantId, userId, action, entityType, entityId?, details?). Call it from relevant routes (e.g. patient create/update, invoice create, user invite). Optionally log sign-in in auth callback.
- **UI:** `/app/audit-logs` — table of recent logs (time, user, action, entity, details). Filters optional. Nav: "Audit log" for admin.
- **Deliverables:** Schema + migration, audit helper, instrument 3–5 key actions, audit log page. Document in `website/AUDIT-LOGGING.md`.

---

## 6.3 Multi-currency support

**Scope:** Let tenants choose a default currency; display amounts in that currency; optionally store currency per invoice (already have currency on invoices—extend to tenant default and display).

- **Schema:** Add `defaultCurrency` (varchar 3, default "USD") to `tenants` table. Migration: `ALTER TABLE tenants ADD COLUMN default_currency varchar(3) DEFAULT 'USD'.`
- **APIs:** `GET /api/app/settings` or tenant profile may return defaultCurrency. `PATCH /api/app/settings` or super tenant update to set defaultCurrency. Invoices already have currency; list/detail use tenant default for display when not set.
- **UI:** In Billing or Settings: "Default currency" dropdown (USD, EUR, GBP, etc.). Invoices list/detail show amounts with currency code. Optional: convert/display in tenant default when invoice has different currency (v1: just display as-is).
- **Deliverables:** Migration for tenant defaultCurrency, settings API or extend tenant update, UI for default currency, invoice display uses it. Document in `website/MULTI-CURRENCY.md`.

---

## 6.4 Surrogacy case management (basic)

**Scope:** Track surrogacy cases linked to intended parents (patients) and surrogate info. Basic CRUD and list.

- **Schema:** `surrogacy_cases` table: id, tenantId, caseNumber (unique per tenant), intendedParentPatientId (FK patients), surrogateName (or surrogatePatientId if you add surrogate as patient), surrogateContact (text), status (e.g. matching, pregnant, delivered, closed), startDate, dueDate (optional), notes, createdAt, updatedAt.
- **APIs:** `GET /api/app/surrogacy-cases` (list), `POST /api/app/surrogacy-cases` (create), `GET /api/app/surrogacy-cases/[id]`, `PATCH /api/app/surrogacy-cases/[id]`. Tenant-scoped.
- **UI:** `/app/surrogacy` — list cases (case number, intended parent, surrogate, status, dates); add case form; detail/edit. Nav: "Surrogacy" (admin or relevant role).
- **Deliverables:** Schema + migration, CRUD APIs, surrogacy list/detail page. Document in `website/SURROGACY-MODULE.md`.

---

## Execution

- One agent per item (6.1–6.4). Run in parallel.
- Follow existing patterns: tenant-scoped APIs, Drizzle schema, migrations, add to `run-migrations.js`.
- After each: merge, run new migrations, update `next-steps-development.md` if needed.
