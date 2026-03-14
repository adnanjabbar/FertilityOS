# Donor Management Module

This document describes the donor management feature (Phase 6.1) in FertilityOS: schema, APIs, UI, and access control.

## Overview

The donor module tracks **egg**, **sperm**, and **embryo** donors per tenant. Donor codes are unique per clinic. First and last name are optional (e.g. for anonymized donors). Linking donors to patients or IVF cycles can be added later (e.g. via `patient_donor_links` or a donor reference on the cycle).

## Schema

**Table: `donors`**

| Column       | Type           | Description                                      |
|-------------|----------------|--------------------------------------------------|
| `id`        | uuid           | Primary key                                      |
| `tenant_id` | uuid           | FK to `tenants` (tenant-scoped)                  |
| `type`      | enum           | `egg` \| `sperm` \| `embryo`                    |
| `donor_code`| varchar(64)    | Unique per tenant (e.g. EGG-001)                 |
| `first_name`| varchar(255)   | Optional                                         |
| `last_name` | varchar(255)   | Optional                                         |
| `date_of_birth` | timestamptz | Optional                                         |
| `blood_type`| varchar(16)    | Optional (e.g. A+)                               |
| `notes`     | text           | Optional                                         |
| `created_at`| timestamptz    | Set on insert                                    |
| `updated_at`| timestamptz    | Set on update                                    |

- **Unique index:** `(tenant_id, donor_code)` so each clinic can have its own code space.

**Migration:** `db/migrations/0016_donors.sql`. Run via `node scripts/run-migrations.js` from `website/`.

## APIs

All donor APIs require an authenticated session with `tenantId`. Responses are JSON.

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/app/donors` | List donors for the current tenant (ordered by `created_at` desc). |
| POST   | `/api/app/donors` | Create a donor. Body: `type`, `donorCode` (required), optional `firstName`, `lastName`, `dateOfBirth`, `bloodType`, `notes`. |
| GET    | `/api/app/donors/[id]` | Fetch one donor by id (tenant-scoped). |
| PATCH  | `/api/app/donors/[id]` | Update donor. Partial body: `type`, `donorCode`, `firstName`, `lastName`, `dateOfBirth`, `bloodType`, `notes`. |

- **Validation:** Zod schemas; invalid or missing required fields return `400` with `error` and optional `details`.
- **Auth:** Missing or unauthenticated session returns `401`.
- **Not found:** No matching donor for tenant returns `404`.

## UI

- **`/app/donors`** — List view: table of donors (code, type, optional name, blood type, DOB, added date). “Add donor” opens a form (type, donor code, optional name/DOB/blood type/notes). Creating a donor redirects to the donor detail page.
- **`/app/donors/[id]`** — Detail view: read-only summary with “Edit” to toggle inline edit form (same fields). Save updates via PATCH.

Patterns used: auth from `@/auth`, db from `@/db`, existing app layout and styling (e.g. rounded cards, slate colors).

## Access Control

- **Navigation:** “Donors” link is shown to users with role **admin**, **embryologist**, or **lab_tech** (app layout).
- **APIs:** Any authenticated user with a tenant can call the donor APIs; tenant is taken from the session. Restricting to admin/lab roles can be added in middleware or route handlers if required.

## Optional Extensions

- **Linking to patients/cycles:** Add a `patient_donor_links` table (e.g. `patientId`, `donorId`, `relationship` like `egg_donor`) or a `donorId` on `ivf_cycles` (or both), and expose “Link donor” in patient or cycle UI.
- **Search/filters:** Add query params to `GET /api/app/donors` (e.g. `?type=egg`, `?q=CODE`) and filters on the list page.
- **Audit:** Log donor create/update in the audit module when it is implemented.
