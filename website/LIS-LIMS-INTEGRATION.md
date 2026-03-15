# LIS/LIMS lab integration (Phase 8.3)

FertilityOS supports connecting to Laboratory Information Systems (LIS) or Laboratory Information Management Systems (LIMS). Tenants configure **lab connectors** per clinic; each connector stores provider type, endpoint/config, and optional result mappings. Results can be imported via sync/API and linked to patients and IVF cycles.

## Overview

- **Connectors:** One or more lab connectors per tenant (e.g. main lab FHIR, external reference lab API, file-based import).
- **Types:** `lis` (Laboratory Information System) or `lims` (Laboratory Information Management System).
- **Providers:** `hl7_fhir`, `custom_api`, `file_import`. Full HL7/FHIR or vendor-specific adapters can be added incrementally.
- **Results:** Optional `lab_orders` table stores imported orders/results linked to patient, cycle, and connector. `lab_result_mappings` maps external codes to internal codes per connector.

## Schema

### lab_connectors

| Column       | Type      | Description |
|-------------|-----------|-------------|
| id          | uuid      | Primary key |
| tenant_id   | uuid      | FK → tenants |
| name        | varchar   | Display name |
| type        | enum      | `lis` \| `lims` |
| provider    | varchar   | e.g. `hl7_fhir`, `custom_api`, `file_import` |
| config      | jsonb     | Endpoint, auth, lab_id, etc. |
| is_active   | boolean   | Default true |
| last_sync_at| timestamptz | Set when sync/import runs |
| created_at, updated_at | timestamptz | |

### lab_orders (optional)

| Column        | Type      | Description |
|---------------|-----------|-------------|
| id            | uuid      | Primary key |
| tenant_id     | uuid      | FK → tenants |
| patient_id   | uuid      | FK → patients |
| cycle_id      | uuid      | Optional FK → ivf_cycles |
| specimen_id   | uuid      | Optional (for future specimens table) |
| connector_id  | uuid      | FK → lab_connectors |
| external_id  | varchar   | Lab’s order/result ID |
| order_code   | varchar   | Order/test code |
| status       | varchar   | e.g. pending, completed |
| requested_at | timestamptz | |
| result_at    | timestamptz | |
| result_payload | jsonb   | Full result payload |
| created_at, updated_at | timestamptz | |

### lab_result_mappings (optional)

| Column        | Type      | Description |
|---------------|-----------|-------------|
| id            | uuid      | Primary key |
| connector_id  | uuid      | FK → lab_connectors |
| external_code | varchar  | Lab’s code |
| internal_code | varchar  | FertilityOS/internal code |
| description  | text      | Optional |
| created_at   | timestamptz | |

**Migration:** `db/migrations/0026_lab_connectors.sql`

## APIs

All lab-connector APIs are **admin-only** (tenant-scoped).

### Connectors

- **GET /api/app/lab-connectors** — List connectors for the tenant. Returns `id`, `name`, `type`, `provider`, `config`, `isActive`, `lastSyncAt`, `createdAt`, `updatedAt`.
- **POST /api/app/lab-connectors** — Create connector. Body: `name`, `type` (`lis`|`lims`), `provider` (`hl7_fhir`|`custom_api`|`file_import`), `config` (object), optional `isActive`.
- **GET /api/app/lab-connectors/[id]** — Get one connector.
- **PATCH /api/app/lab-connectors/[id]** — Update connector (same fields as create).
- **DELETE /api/app/lab-connectors/[id]** — Delete connector (cascades to lab_result_mappings; lab_orders retain connector_id as null if desired).

### Test connection

- **POST /api/app/lab-connectors/[id]/test** — Test connection:
  - `hl7_fhir`: GET `{config.endpoint}/metadata` (FHIR capability statement).
  - `custom_api`: GET `config.endpoint` (reachable or 401 treated as success).
  - `file_import`: Always success; message indicates use sync/import.

### Sync / import results (optional)

- **POST /api/app/lab-connectors/[id]/sync** — Import results. Body: `{ results: [ { patientId, cycleId?, externalId?, orderCode?, status?, resultAt?, resultPayload? } ] }`. Creates rows in `lab_orders` and sets connector `lastSyncAt`. Validation: `patientId` must exist in tenant; optional `cycleId` linked to patient. File upload or vendor-specific API pull can be implemented on top of this endpoint.

## UI

- **Settings → Lab integration** (left sidebar, admin only): List connectors, add connector, edit connector, test connection, view last sync.
- **Add/Edit connector:** Select type (LIS/LIMS), provider (HL7 FHIR, Custom API, File import). For FHIR/Custom API: endpoint URL, optional auth header, optional lab ID. For file import: no endpoint; use sync API to import.
- **Optional (future):** Lab results section on patient or IVF cycle view showing imported results from `lab_orders`.

## Config examples

- **HL7 FHIR:** `{ "endpoint": "https://fhir.lab.example.com", "authHeader": "Bearer …", "labId": "MAIN" }`
- **Custom API:** `{ "endpoint": "https://api.lab.example.com/v1", "authHeader": "ApiKey …" }`
- **File import:** `{}` — config can stay empty; use sync with JSON body or future file upload.

## Security and compliance

- Connector config (including auth headers) is stored in the database; only server-side code and admin UI should access it. Consider encrypting sensitive fields at rest if required.
- Admin-only access for connector CRUD and test/sync. All queries are tenant-scoped by `session.user.tenantId`.

## Extending

- Add new providers by extending the provider enum/varchar and the test/sync logic in the API.
- Full HL7 v2 or vendor-specific LIS/LIMS adapters can be added as new provider types and sync handlers.
- Lab results section on patient/cycle pages: query `lab_orders` by `patientId` or `cycleId` and display in a dedicated “Lab results” block.
