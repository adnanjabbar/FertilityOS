# Phase 3.2 — Appointments & Scheduling: Agent Handoff

**Goal:** Implement calendar-based appointment booking linked to patients (and optional provider). One agent can do full stack; or split into Agent 1 (schema + API) and Agent 2 (UI).

**Parent plan:** `phase-3-2-to-3-5-multi-agent-plan.md`  
**Repo:** `FertilityOS` · **App:** `website/` (Next.js 16, React 19, Tailwind, Drizzle, Auth.js)

---

## Shared context

- **Auth:** Session from `auth()`; `session.user.tenantId`, `session.user.roleSlug`. All APIs restrict by `tenantId`.
- **Patients:** Existing `patients` table; use for `patientId` FK and patient name in lists.
- **DB:** Drizzle in `website/db/schema.ts`; migrations in `website/db/migrations/`. Use **`0004_appointments.sql`** for this phase.
- **API pattern:** Route Handlers in `app/api/app/*`; Zod validation; return JSON.
- **UI:** Add "Appointments" to nav in `website/app/app/layout.tsx`.

---

## Agent 1 — Schema & Appointments API

**Deliverables:**

1. **Schema & migration**
   - Add `appointments` table: id (uuid, PK), tenantId (uuid, FK tenants), patientId (uuid, FK patients), providerId (uuid, FK users, optional), title (varchar), startAt (timestamp), endAt (timestamp), type (varchar, e.g. consultation, retrieval, transfer), status (varchar: scheduled, completed, cancelled, no_show), notes (text), createdAt, updatedAt.
   - Migration file in `website/db/migrations/`; index on (tenantId, startAt). Register in run-migrations script and document in `digitalocean-database-setup.md`.

2. **APIs**
   - `GET /api/app/appointments` — query `from`, `to` (ISO date), `patientId` (optional); list for tenant; return id, patientId, patient name (join/lookup), providerId, startAt, endAt, type, status, notes.
   - `POST /api/app/appointments` — body: patientId, providerId?, startAt, endAt, type, title?, notes; Zod; tenant + patient.tenantId check.
   - `GET /api/app/appointments/[id]` — one appointment; tenant check.
   - `PATCH /api/app/appointments/[id]` — update; tenant check.

**Acceptance:** Migration runs; all routes work with tenant isolation.

---

## Agent 2 — Appointments UI

**Depends on:** Agent 1 (schema + APIs).

**Deliverables:**

1. **List page:** `website/app/appointments/page.tsx` + client component. Table or list of appointments; filters: date range, patient; link to `/app/appointments/[id]`. Empty state.
2. **Add appointment:** Form (patient select from `GET /api/app/patients`, optional provider, start/end datetime, type, notes); POST then refresh list or redirect to detail.
3. **Detail/edit:** `website/app/appointments/[id]/page.tsx` — show appointment; "Edit" toggles form; PATCH on save.
4. **Nav:** Add "Appointments" link in app layout.
5. **Super Dashboard:** In `GET /api/app/super/stats` add appointments count (exclude system tenant); set `scheduling: "active"` in modules. Optionally show count in SuperDashboardClient.

**Acceptance:** List, add, view, edit work; nav and super stats updated.
