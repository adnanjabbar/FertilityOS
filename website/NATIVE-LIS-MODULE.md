# Native LIS (Lab Information Management System) Module

TheFertilityOS includes a **native Lab Information Management System (LIS)** so clinics can manage lab orders, specimens, test catalog, and results in-house—without requiring an external FHIR/HL7 LIS. Optional **Lab integration** (Settings → Lab integration) remains available to connect external LIS/LIMS and import results.

## Overview

- **Native LIS:** Full lab workflow inside the platform: test catalog, specimens, orders, order line items, result entry.
- **Module slug:** `labManagement`. Enable per tenant via Super Dashboard (tenant modules) or `tenants.enabled_modules`.
- **Roles:** Admin, Lab Tech, Embryologist, and Doctor can access the Lab module (when enabled).
- **Nav:** "Lab" under **Lab & programs** (left sidebar) → `/app/lab`.

## Schema (migration 0030_native_lis.sql)

| Table | Purpose |
|-------|--------|
| **lab_specimens** | Specimen tracking: patient, type, collected/received at, status. |
| **lab_tests** | Test catalog per tenant: code, name, unit, reference ranges, `is_panel`. |
| **lab_panels** | Panel = one test (panel) linking to multiple member tests; `panel_test_id` + `member_test_id`. |
| **lab_order_items** | Line items for an order: test, specimen (optional), status, result value/unit/reference, result_at, performed_by. |
| **lab_orders** | Existing; native orders have `connector_id` = null. Optional `specimen_id` FK to lab_specimens. |

## APIs

- **GET /api/app/lab/orders** — List native lab orders (connector_id is null) with patient name, status, requested/result dates.
- **POST /api/app/lab/orders** — Create native order. Body: `{ patientId, testIds: uuid[] }`. Creates one `lab_orders` row and one `lab_order_items` per test.
- **GET /api/app/lab/orders/[id]** — Order detail with items (test code/name, status, result value).
- **GET /api/app/lab/tests** — List tenant lab tests (catalog) for building orders.

## UI

- **/app/lab** — Lab home: list of native orders, "New order" button, link to Settings → Lab integration.
- **/app/lab/new** — New order: select patient, select tests (from catalog), submit. If no tests exist, message to add tests (catalog UI or API/DB).
- **/app/lab/orders/[id]** — Order detail: patient, status, requested/result dates, list of order items (test + result).

## Relationship to Lab integration (Phase 8.3)

- **Lab integration** (Settings → Lab integration): Configure *external* LIS/LIMS connectors (FHIR, custom API, file import). Orders/results imported from outside go into `lab_orders` with `connector_id` set.
- **Native LIS:** Orders created and managed inside the platform; `connector_id` is null. Use test catalog, specimens, and order items for full in-house workflow.
- Both can coexist: some orders from external LIS, some native.

## NABL-style test catalog (default seed)

- **Seed data:** `db/seed-data/nabl-style-tests.json` contains 40+ common pathology tests with category, unit, and **male/female reference ranges** (aligned with NABL-style categories: Haematology, Clinical Biochemistry, Endocrinology, Coagulation, Immunology).
- **Seed script:** From `website/` run `node scripts/seed-lab-tests-nabl.js` (optionally pass a tenant ID). Inserts into `lab_tests` with ON CONFLICT DO NOTHING so safe to re-run. Requires migrations 0030 and 0031.
- **New order page:** Search bar filters by code, name, or category; each test shows category, unit, and male/female reference ranges.

## External lab reports (traceability)

- **Table:** `lab_report_documents` — patient_id, lab_name, lab_location, mr_number_on_report, file_key (for upload reference), notes, reported_at.
- **Purpose:** When a patient brings an external lab report, staff can record which lab, where, and the MR number on that report for traceability. File upload (file_key) can be wired to object storage later.
- **UI:** Add “Add external report” on patient detail or Lab → record lab name, location, MR number; upload document (API/UI to be added).

## Next steps (future work)

- **Lab report document UI:** Form to add external report (lab name, location, MR number) + file upload endpoint.
- **Result entry:** Form to enter result value/unit per order item on order detail, set status, sign off (performed_by).
- **Test catalog UI:** CRUD for `lab_tests` and `lab_panels` (e.g. Settings → Lab catalog).
- **Specimens UI:** Create/list specimens, link to orders.
- **Reporting:** Export results, reference range flags.
