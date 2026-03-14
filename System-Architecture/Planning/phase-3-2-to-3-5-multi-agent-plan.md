# Phase 3.2–3.5 — Multi-Agent Development Plan

**Goal:** Reach MVP by implementing the four remaining core modules (Scheduling, EMR, IVF Lab, Billing) in parallel using multiple agents. Each agent owns one phase end-to-end (schema, API, UI) unless split as noted.

**Repo:** `FertilityOS` · **App:** `website/` (Next.js 16, React 19, Tailwind, Drizzle, Auth.js)  
**Conventions:** `System-Architecture/Skills/skills.md`, `System-Architecture/Design/design-system.md`, `website/db/schema.ts` for existing patterns.

**Prerequisite:** Phase 3.1 (Patient Management) is done. All new modules must respect `tenantId` from session and link to `patients` where relevant.

---

## Shared rules (all agents)

- **Auth:** Every API must check `session?.user?.tenantId`; restrict all reads/writes by `tenantId`.
- **Migrations:** Add new tables in `website/db/schema.ts` and a new file in `website/db/migrations/`: 0004 (appointments), 0005 (clinical_notes), 0006 (ivf_cycles + embryos), 0007 (invoices + invoice_lines). Add each filename to `website/scripts/run-migrations.js`. Document in `System-Architecture/Infrastructure/digitalocean-database-setup.md`.
- **APIs:** Route Handlers under `app/api/app/*`; validate with Zod; return JSON.
- **UI:** Add nav link in `website/app/app/layout.tsx` for the new module; use existing layout and design system (cards, rounded-2xl, slate/blue).
- **Run migrations:** After schema changes, run the new migration script (or `node scripts/run-000X-only.js`) so the app runs against the updated DB.

---

## Agent A — Phase 3.2: Appointments & Scheduling

**Goal:** Calendar-based booking; link to patients and (optionally) staff. No external calendar sync for MVP.

### Data model
- **`appointments`** table: id, tenantId, patientId (FK patients), providerId (FK users, optional), title, startAt (timestamp), endAt (timestamp), type (e.g. consultation, retrieval, transfer), status (scheduled, completed, cancelled, no_show), notes, createdAt, updatedAt.
- Index on (tenantId, startAt) for list by date range.

### APIs
- `GET /api/app/appointments` — list for tenant; query `from`, `to` (ISO date) and/or `patientId`; return array with patient name (join or lookup).
- `POST /api/app/appointments` — create (patientId, providerId?, startAt, endAt, type, notes); validate; tenant + patient tenant check.
- `GET /api/app/appointments/[id]` — one appointment; tenant check.
- `PATCH /api/app/appointments/[id]` — update (same fields); tenant check.
- `DELETE /api/app/appointments/[id]` or PATCH status to cancelled — optional.

### UI
- **Route:** `/app/appointments` — list (e.g. week view or list by date); search/filter by patient or date range.
- **Add appointment:** form (patient select, provider select optional, date/time, type, notes); POST then refresh or redirect.
- **Detail/edit:** `/app/appointments/[id]` — show and edit appointment.

### Done criteria
- [ ] Migration runs; appointments table exists.
- [ ] CRUD APIs work with tenant isolation.
- [ ] Appointments list and add/edit UI work; nav has "Appointments".

---

## Agent B — Phase 3.3: Clinical Notes (EMR)

**Goal:** SOAP-format notes per patient; link to patients. No ICD-10 search for MVP (free text or simple code field ok).

### Data model
- **`clinical_notes`** table: id, tenantId, patientId (FK patients), authorId (FK users), noteType (soap), subjective (text), objective (text), assessment (text), plan (text), diagnosisCode (varchar, optional), createdAt, updatedAt.
- Index on (tenantId, patientId) for list by patient.

### APIs
- `GET /api/app/patients/[patientId]/notes` — list notes for patient; tenant + patient tenant check.
- `POST /api/app/patients/[patientId]/notes` — create note (subjective, objective, assessment, plan, diagnosisCode?); authorId from session.
- `GET /api/app/clinical-notes/[noteId]` — one note; tenant check.
- `PATCH /api/app/clinical-notes/[noteId]` — update note; tenant + author check optional.

### UI
- **From patient detail:** "Clinical notes" section or tab; list notes (date, author, snippet); "Add note" opens SOAP form.
- **Note form:** Subjective, Objective, Assessment, Plan (textareas); optional diagnosis code; submit POST.
- **View/edit note:** Inline or modal for view/edit.

### Done criteria
- [ ] Migration runs; clinical_notes table exists.
- [ ] APIs work with tenant isolation; notes scoped to patient.
- [ ] Patient detail page has notes section; add/view/edit notes work.

---

## Agent C — Phase 3.4: IVF Lab & Embryology

**Goal:** Track IVF cycles per patient; egg retrieval, fertilization, embryo records. Embryo grading and cryopreservation as fields (no separate tank module for MVP).

### Data model
- **`ivf_cycles`** table: id, tenantId, patientId (FK patients), cycleNumber (int), cycleType (e.g. fresh, frozen), status (planned, stimulation, retrieval, fertilization, transfer, cancelled), startDate, endDate (optional), notes, createdAt, updatedAt.
- **`embryos`** table (or embed in cycle): id, tenantId, cycleId (FK ivf_cycles), day (int, e.g. 3, 5), grade (varchar), status (fresh, frozen, transferred, discarded), notes, createdAt, updatedAt.
- Indexes: (tenantId, patientId) on cycles; (tenantId, cycleId) on embryos.

### APIs
- `GET /api/app/patients/[patientId]/cycles` — list IVF cycles for patient; tenant check.
- `POST /api/app/patients/[patientId]/cycles` — create cycle (cycleNumber, cycleType, startDate, notes).
- `GET /api/app/ivf-cycles/[cycleId]` — one cycle with embryos; tenant check.
- `PATCH /api/app/ivf-cycles/[cycleId]` — update cycle.
- `GET /api/app/ivf-cycles/[cycleId]/embryos` — list embryos; `POST` to add; `PATCH /api/app/embryos/[id]` to update.

### UI
- **From patient detail:** "IVF cycles" section; list cycles (number, type, status, dates); "Add cycle" form.
- **Cycle detail:** `/app/patients/[patientId]/cycles/[cycleId]` or modal — show cycle and list of embryos; add/edit embryo (day, grade, status).

### Done criteria
- [ ] Migrations run; ivf_cycles and embryos tables exist.
- [ ] APIs work with tenant isolation; cycles and embryos linked to patient.
- [ ] Patient has IVF cycles section; add cycle and embryos; view/edit.

---

## Agent D — Phase 3.5: Billing & Invoicing

**Goal:** Simple invoices linked to patient (and optionally to appointment or treatment); no Stripe integration required for first cut (manual payment status ok).

### Data model
- **`invoices`** table: id, tenantId, patientId (FK patients), invoiceNumber (varchar, unique per tenant), status (draft, sent, paid, overdue, cancelled), dueDate, paidAt (optional), totalAmount (numeric), currency (varchar 3), notes, createdAt, updatedAt.
- **`invoice_lines`** table: id, invoiceId (FK invoices), description (text), quantity (int), unitPrice (numeric), amount (numeric), createdAt.
- Index on (tenantId, patientId) and (tenantId, invoiceNumber).

### APIs
- `GET /api/app/invoices` — list for tenant; optional `patientId`, `status`; return with patient name.
- `POST /api/app/invoices` — create (patientId, dueDate, lines: [{ description, quantity, unitPrice }]); compute amount; generate invoiceNumber (e.g. INV-YYYY-NNN per tenant).
- `GET /api/app/invoices/[id]` — one invoice with lines; tenant check.
- `PATCH /api/app/invoices/[id]` — update (status, paidAt, or lines); tenant check.

### UI
- **Route:** `/app/invoices` — list invoices (number, patient, amount, status, due date); filter by status/patient.
- **Add invoice:** form (patient select, due date, line items: description, qty, unit price); POST then redirect to invoice detail.
- **Invoice detail:** `/app/invoices/[id]` — show invoice and lines; "Mark paid" or edit; print-friendly view optional.

### Done criteria
- [ ] Migrations run; invoices and invoice_lines exist.
- [ ] APIs work with tenant isolation; invoice number generation unique per tenant.
- [ ] Invoices list and add/view/edit work; nav has "Invoices" or "Billing".

---

## Execution order and parallelism

| Agent | Phase    | Can start when        | Delivers                    |
|-------|----------|------------------------|-----------------------------|
| A     | 3.2      | 3.1 done               | Appointments                |
| B     | 3.3      | 3.1 done               | Clinical notes (EMR)        |
| C     | 3.4      | 3.1 done               | IVF cycles & embryos        |
| D     | 3.5      | 3.1 done               | Invoices & billing         |

**Agents A, B, C, D can run in parallel.** Each agent should:
1. Pull latest `main` (includes Phase 3.1 and shared patterns).
2. Create a feature branch (e.g. `phase-3-2-scheduling`, `phase-3-3-emr`, etc.) or work in sequence and merge one phase at a time.
3. Implement schema + migration, then APIs, then UI; run migration locally.
4. Add nav link and any dashboard card (e.g. in `/app/dashboard`) for the new module.
5. Update `System-Architecture/Infrastructure/digitalocean-database-setup.md` with the new migration filename.
6. Push and open PR or merge to `main`; run new migration on production when deploying.

---

## Super Dashboard

After each phase, update **Super Dashboard** stats if relevant:
- **Agent A:** Add `appointmentsCount` (or similar) to `GET /api/app/super/stats` and show in overview; set `scheduling: "active"` in modules.
- **Agent B:** Set `emr: "active"` in modules (optional: notes count).
- **Agent C:** Add `ivfCyclesCount` (and optionally embryos count) to super stats; set `ivfLab: "active"` in modules.
- **Agent D:** Add `invoicesCount` (or revenue) to super stats; set `billing: "active"` in modules.

See `website/app/api/app/super/stats/route.ts` and `website/app/app/super/SuperDashboardClient.tsx`.

---

## MVP completion checklist

When all four agents are done:
- [ ] Scheduling: appointments CRUD, list by date/patient, nav "Appointments".
- [ ] EMR: clinical notes (SOAP) per patient, add/view/edit, from patient detail.
- [ ] IVF Lab: cycles and embryos per patient, add/view/edit, from patient detail.
- [ ] Billing: invoices with lines, list/add/view/edit, invoice number, nav "Invoices" or "Billing".
- [ ] Super Dashboard: all four modules show "active"; counts updated.
- [ ] All migrations documented and run on production.
