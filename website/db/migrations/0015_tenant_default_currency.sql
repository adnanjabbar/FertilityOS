-- Multi-currency: tenant default currency for display and new invoices
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS default_currency varchar(3) DEFAULT 'USD' NOT NULL;
