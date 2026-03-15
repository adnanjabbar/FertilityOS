# Multi-Location Support (Phase 8.4)

This document describes the multi-location feature that allows a tenant (clinic) to have multiple physical locations. Appointments, filtering, and reporting can be scoped by location.

## Schema

- **`locations`** table: `id`, `tenantId`, `name`, `address`, `city`, `state`, `country`, `postalCode`, `timezone`, `isDefault`, `createdAt`, `updatedAt`.
- **`appointments.locationId`**: Optional FK to `locations`. Appointments can be assigned to a location.
- **`patients.preferredLocationId`**: Optional FK to `locations`. Preferred location for the patient.
- **`users.defaultLocationId`**: Optional FK to `locations`. Default location for the user (e.g. for scheduling).

Migration: `db/migrations/0026_locations_multi_location.sql`.

## APIs

- **GET /api/app/locations** — List all locations for the current tenant (any authenticated user).
- **POST /api/app/locations** — Create a location (admin only). Body: `name`, optional `address`, `city`, `state`, `country`, `postalCode`, `timezone`, `isDefault`.
- **GET /api/app/locations/[id]** — Get one location (tenant-scoped).
- **PATCH /api/app/locations/[id]** — Update a location (admin only).
- **DELETE /api/app/locations/[id]** — Delete a location (admin only). Appointments’ `locationId` is set to null by FK.

Appointments:

- **GET /api/app/appointments?locationId=...** — Filter list by location.
- **POST /api/app/appointments** — Body may include `locationId` (optional). Validated against tenant’s locations.
- **PATCH /api/app/appointments/[id]** — Body may include `locationId` (optional).

Reports:

- **GET /api/app/reports/overview?from=...&to=...&locationId=...** — Appointments count and “appointments by day” chart are filtered by `locationId` when provided. Other metrics (new patients, IVF cycles, revenue) are tenant-wide.

## UI

- **Settings → Locations** (admin only): List locations, add, edit, delete. Gradient styling and left sidebar nav. Default location can be set per tenant; one location may be marked as default (used when no location is selected on new appointments).
- **Appointments**: When the tenant has at least one location, the list shows a “Location” filter and a “Location” column. The add-appointment form and appointment detail edit form show a location dropdown (“No specific location” or a location). If there are no locations, location UI is hidden.
- **Reports**: When the tenant has locations, a “Location” dropdown is shown; “All locations” or a specific location filters the appointments count and appointments-by-day chart.

## Optional Extensions (not implemented in 8.4)

- Availability or resources per location.
- Patient preferred location used to prefill appointment location.
- User default location used to prefill when creating appointments.
