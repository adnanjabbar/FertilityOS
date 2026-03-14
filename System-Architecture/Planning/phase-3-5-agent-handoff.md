# Phase 3.5 — Billing & Invoicing: Agent Handoff

**Goal:** Invoices with line items per patient; unique invoice numbers per tenant. One agent full stack; or Agent 1 (schema + API), Agent 2 (UI).

**Parent plan:** `phase-3-2-to-3-5-multi-agent-plan.md`  
**Repo:** `FertilityOS` · **App:** `website/`

---

## Shared context

- **Auth:** `session.user.tenantId`; all APIs tenant-scoped.
- **Patients:** Invoices link to patientId; enforce patient.tenantId.
- **DB:** `invoices` + `invoice_lines`. Use **`0007_invoices.sql`** (include both tables in one migration).

---

## Agent 1 — Schema & Invoices API

**Deliverables:**

1. **Schema & migrations**
   - **`invoices`:** id, tenantId, patientId (FK patients), invoiceNumber (varchar, unique per tenant), status (varchar: draft, sent, paid, overdue, cancelled), dueDate (date), paidAt (timestamp, optional), totalAmount (numeric), currency (varchar 3, default 'USD'), notes, createdAt, updatedAt. Index (tenantId, patientId), unique (tenantId, invoiceNumber).
   - **`invoice_lines`:** id, invoiceId (FK invoices), description (text), quantity (int), unitPrice (numeric), amount (numeric), createdAt. Index invoiceId.
   - Invoice number generation: e.g. INV-YYYY-NNN (year + sequence per tenant). Document migration.

2. **APIs**
   - `GET /api/app/invoices` — list for tenant; query `patientId`, `status`; return with patient name.
   - `POST /api/app/invoices` — body: patientId, dueDate, lines: [{ description, quantity, unitPrice }]; compute amount and totalAmount; generate invoiceNumber; tenant + patient check.
   - `GET /api/app/invoices/[id]` — one invoice with lines; tenant check.
   - `PATCH /api/app/invoices/[id]` — update status, paidAt, or lines; recompute total if lines change; tenant check.

**Acceptance:** Migration runs; invoice numbers unique per tenant; CRUD tenant-isolated.

---

## Agent 2 — Invoices UI

**Depends on:** Agent 1.

**Deliverables:**

1. **List page:** `/app/invoices` — table (number, patient, amount, status, due date); filter by status/patient; "Add invoice" button.
2. **Add invoice:** Form: patient select, due date, line items (description, quantity, unit price; add/remove rows); POST; redirect to invoice detail.
3. **Invoice detail:** `/app/invoices/[id]` — show header and lines; "Mark paid" (PATCH status + paidAt); edit lines optional.
4. **Nav:** Add "Invoices" or "Billing" in app layout.
5. **Super Dashboard:** Add invoicesCount (and optionally total revenue) to super stats; set `billing: "active"`.

**Acceptance:** Invoices list, add, view, mark paid; nav and super dashboard updated.
