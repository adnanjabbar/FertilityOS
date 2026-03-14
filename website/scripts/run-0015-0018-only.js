/**
 * Run only Phase 6 migrations (0015 default_currency, 0016 donors, 0017 audit_logs, 0018 surrogacy_cases).
 * Use when the DB already has 0000-0014 applied and full run-migrations.js fails.
 * From website/: node scripts/run-0015-0018-only.js
 */

const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");

function loadEnv() {
  try {
    const path = join(__dirname, "..", ".env");
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to website/.env and run again.");
  process.exit(1);
}

const pending = [
  "0015_tenant_default_currency.sql",
  "0016_donors.sql",
  "0017_audit_logs.sql",
  "0018_surrogacy_cases.sql",
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const dir = join(__dirname, "..", "db", "migrations");
  try {
    await client.connect();
    for (const file of pending) {
      const path = join(dir, file);
      const sql = readFileSync(path, "utf8");
      await client.query(sql);
      console.log("Ran:", file);
    }
    console.log("Pending migrations (0015-0018) finished successfully.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
