/**
 * Seed lab_tests with NABL-style catalog (categories, male/female reference ranges).
 * Usage: DATABASE_URL=... node scripts/seed-lab-tests-nabl.js [tenantId]
 * If tenantId is omitted, seeds for all tenants in the database.
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
  console.error("Missing DATABASE_URL. Set it in website/.env or environment.");
  process.exit(1);
}

const dataPath = join(__dirname, "..", "db", "seed-data", "nabl-style-tests.json");
let tests;
try {
  tests = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (e) {
  console.error("Failed to load nabl-style-tests.json:", e.message);
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const tenantIdArg = process.argv[2];
  let tenantIds = [];
  if (tenantIdArg) {
    tenantIds = [tenantIdArg];
  } else {
    const res = await client.query('SELECT id FROM tenants');
    tenantIds = res.rows.map((r) => r.id);
  }
  if (tenantIds.length === 0) {
    console.log("No tenants found.");
    await client.end();
    return;
  }

  for (const tenantId of tenantIds) {
    for (const t of tests) {
      await client.query(
        `INSERT INTO lab_tests (
          tenant_id, code, name, category, unit,
          reference_range_male_low, reference_range_male_high,
          reference_range_female_low, reference_range_female_high
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (tenant_id, code) DO NOTHING`,
        [
          tenantId,
          t.code,
          t.name,
          t.category || null,
          t.unit || null,
          t.referenceRangeMaleLow ?? null,
          t.referenceRangeMaleHigh ?? null,
          t.referenceRangeFemaleLow ?? null,
          t.referenceRangeFemaleHigh ?? null,
        ]
      );
    }
    const check = await client.query("SELECT COUNT(*) AS c FROM lab_tests WHERE tenant_id = $1", [tenantId]);
    console.log(`Tenant ${tenantId}: ${check.rows[0].c} lab tests in catalog.`);
  }

  await client.end();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
