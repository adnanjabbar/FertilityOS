# Surrogacy case management module

This document describes the surrogacy case management feature (Phase 6.4) in FertilityOS.

## Overview

The surrogacy module lets clinics track surrogacy cases linked to **intended parents** (stored as patients) and **surrogate** information. It provides basic CRUD and list views, all tenant-scoped.

## Schema

- **Table:** `surrogacy_cases`
- **Migration:** `0018_surrogacy_cases.sql`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | uuid | FK → tenants (CASCADE) |
| `case_number` | varchar(64) | Unique per tenant (e.g. SUR-2025-001) |
| `intended_parent_patient_id` | uuid | FK → patients (CASCADE) |
| `surrogate_name` | varchar(255) | Surrogate full name |
| `surrogate_contact` | text | Phone, email, or notes |
| `status` | varchar(32) | matching \| pregnant \| delivered \| closed (default: matching) |
| `start_date` | timestamptz | Optional |
| `due_date` | timestamptz | Optional |
| `notes` | text | Optional |
| `created_at` | timestamptz | Set on insert |
| `updated_at` | timestamptz | Set on insert/update |

**Indexes:**

- Unique: `(tenant_id, case_number)`
- Index: `(tenant_id)` for list queries

## APIs

All routes require an authenticated session with `tenantId`. All queries are scoped by `session.user.tenantId`.

- **GET /api/app/surrogacy-cases**  
  List cases for the tenant. Returns rows with intended parent name from a join with `patients`.

- **POST /api/app/surrogacy-cases**  
  Create a case. Body: `intendedParentPatientId` (uuid), `surrogateName`, `surrogateContact` (optional), `status` (optional), `startDate`, `dueDate`, `notes` (all optional).  
  Validation: `intendedParentPatientId` must belong to a patient in the same tenant.  
  Case number is auto-generated per tenant (e.g. SUR-2025-001, SUR-2025-002).

- **GET /api/app/surrogacy-cases/[id]**  
  Single case by id, tenant-scoped. Includes intended parent first/last name from join.

- **PATCH /api/app/surrogacy-cases/[id]**  
  Update case. Same body shape as create (all fields optional). If `intendedParentPatientId` is provided, it is validated against the tenant’s patients.

## UI

- **/app/surrogacy**  
  - List: case number, intended parent name (link to patient), surrogate name, status, start date, due date.  
  - “Add case” form: patient select (intended parent), surrogate name/contact, status, start/due dates, notes.  
  - Row link to case detail.

- **/app/surrogacy/[id]**  
  - Detail view: case number, intended parent (link to patient), surrogate name/contact, status, dates, notes.  
  - “Edit” toggles inline form; Save/Cancel submit PATCH or revert.

- **Nav:** “Surrogacy” link in the app header for users with role `admin` (see `app/app/layout.tsx`).

## Conventions

- Uses existing patterns: `@/auth`, `@/db`, Drizzle, Zod validation.
- Patient lookup for `intendedParentPatientId` always checks `patients.tenantId === session.user.tenantId`.
- Case numbers are generated with prefix `SUR-{year}-` and zero-padded sequence per tenant.

## Running migrations

From `website/`:

```bash
node scripts/run-migrations.js
```

Ensure `DATABASE_URL` is set in `website/.env`.
