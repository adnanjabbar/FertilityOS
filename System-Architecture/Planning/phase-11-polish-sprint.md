# Phase 11 — Polish toward beta / finish line

**Goal:** Ship high-impact improvements without large new subsystems: search, financial visibility, super-admin operations UX, registration clarity.

## Delivered in this sprint

| Item | Notes |
|------|--------|
| **Tenant patient search** | `GET /api/app/patients?q=` now matches MR#, phone; ILIKE sanitization; default limit 100 (max 500). List shows MR# column; hint when capped at 100. |
| **Super cross-clinic patient search** | `GET /api/app/super/patient-search?q=` (super_admin only, min 2 chars, max 40 rows). Audited on system tenant: `super_admin.cross_tenant_patient_search` with query length + count only (no PHI in audit). UI: `/app/super/patient-search`. |
| **Reports financials** | Overview API adds `revenueOutstanding` and `unpaidInvoicesInPeriod` (unpaid invoices *created* in date range). Reports UI: two extra KPI cards. |
| **Super clinic map link** | All clinics table includes **Open** link to Google Maps from address + city + state + country + postal. |
| **Registration UX** | Visual 3-step progress on `/register`. |
| **Shared ILIKE helper** | `lib/ilike-sanitize.ts` used by super queries and patient list API. |

## Suggested next (finish line)

- Stripe webhook → `platform_admin_audit_log` for automated billing changes (optional).
- Patient list pagination (cursor) if any tenant exceeds ~500 active patients.
- Super “global” search: optional rate limit per IP / per user.
- Export reports (CSV) for the selected period.
