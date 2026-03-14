# Multi-currency support

FertilityOS supports a configurable **default currency** per tenant. This is used for displaying amounts and for new invoices when no currency is specified.

## Default currency

- **Schema:** The `tenants` table has a `default_currency` column (varchar 3, default `USD`).
- **Migration:** `db/migrations/0015_tenant_default_currency.sql` adds this column. Run migrations with `node scripts/run-migrations.js` from `website/`.

## How it is used

1. **Tenant settings**
   - Each tenant has a default currency (e.g. USD, EUR, GBP). Admins can change it in **Billing & subscription** → **Default currency**.
   - The value is stored in `tenants.default_currency` and exposed via:
     - `GET /api/app/settings` — returns `{ defaultCurrency }`.
     - `PATCH /api/app/settings` — body `{ defaultCurrency }` (admin only). Supported codes: USD, EUR, GBP, AUD, CAD, CHF, JPY, INR.
   - Public tenant lookup `GET /api/tenant-by-slug?slug=...` also returns `defaultCurrency` for the tenant.

2. **Invoices**
   - Each invoice has its own `currency` field (varchar 3, default USD). **New invoices** are created with the tenant’s current default currency.
   - **Display:** When listing or viewing invoices, amounts are shown with the currency code and formatted with two decimal places (e.g. `USD 1,234.00`). If an invoice has no currency set, the tenant’s default currency is used as a fallback for display.

3. **UI**
   - **Billing** (`/app/billing`): “Default currency” section with a dropdown (admin can change and save).
   - **Invoices** list and detail: All amounts use the format `{currency} {amount}` (e.g. `EUR 500.00`), with tenant default as fallback when invoice currency is missing.

## APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/app/settings` | Returns tenant settings including `defaultCurrency`. Authenticated app user. |
| `PATCH /api/app/settings` | Update `defaultCurrency`. Admin only. Body: `{ defaultCurrency: "EUR" }`. |
| `GET /api/tenant-by-slug?slug=...` | Public; returns tenant `id`, `name`, `slug`, `defaultCurrency`. |

## Adding more currencies

To support additional currency codes:

1. Add the code to the `SUPPORTED_CURRENCIES` array in `app/api/app/settings/route.ts`.
2. Add an option to the `CURRENCIES` list in `app/app/billing/BillingClient.tsx`.

No conversion between currencies is performed; the default currency only sets the display and initial currency for new invoices.
