/**
 * Reset all users and tenants, then create only the Super Admin.
 * - Deletes all tenants except "system" (CASCADE removes their data and users).
 * - Deletes all remaining users (CASCADE removes sessions, password tokens, etc.).
 * - Inserts Super Admin: dradnanjabbar@gmail.com / @AdnanJabbar007
 *
 * Run migrations first. Then from website/:
 *   node scripts/reset-users-and-tenants.js
 *
 * Admin accounts: you register via /register; Super Admin approves (when that flow is built).
 */

const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

function loadEnv() {
  try {
    const path = join(__dirname, "..", ".env");
    const content = readFileSync(path, "utf8");
    const cleaned = content.replace(/^\uFEFF/, "");
    for (const rawLine of cleaned.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const normalized = line.startsWith("export ") ? line.slice("export ".length) : line;
      const m = normalized.match(/^([^=]+)=(.*)$/);
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

function stripSslmode(url) {
  return url
    .replace(/([?&])sslmode=[^&]+&?/i, "$1")
    .replace(/[?&]$/, "");
}

const SUPER_EMAIL = "dradnanjabbar@gmail.com";
const SUPER_PASSWORD = "@AdnanJabbar007";
const SYSTEM_TENANT_SLUG = "system";

async function main() {
  const client = new Client({
    connectionString: stripSslmode(DATABASE_URL),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const tenantRes = await client.query(
      "SELECT id FROM tenants WHERE slug = $1 LIMIT 1",
      [SYSTEM_TENANT_SLUG]
    );
    if (tenantRes.rows.length === 0) {
      console.error("System tenant not found. Run migrations first (including 0003_super_admin.sql).");
      process.exit(1);
    }
    const systemTenantId = tenantRes.rows[0].id;

    console.log("Deleting all tenants except system (CASCADE removes their data and users)...");
    const delTenants = await client.query(
      "DELETE FROM tenants WHERE slug != $1 RETURNING id",
      [SYSTEM_TENANT_SLUG]
    );
    console.log("Removed", delTenants.rowCount, "tenant(s).");

    console.log("Deleting all users (CASCADE removes sessions, password tokens, etc.)...");
    const delUsers = await client.query("DELETE FROM users RETURNING id");
    console.log("Removed", delUsers.rowCount, "user(s).");

    const passwordHash = await bcrypt.hash(SUPER_PASSWORD, 12);
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role_slug)
       VALUES ($1, $2, $3, $4, 'super_admin')`,
      [systemTenantId, SUPER_EMAIL, passwordHash, "Super Administrator"]
    );
    console.log("Created Super Admin:", SUPER_EMAIL);

    console.log("\nSuper Admin login: " + SUPER_EMAIL + " / " + SUPER_PASSWORD);
    console.log("Dashboard: /app/super");
    console.log("Register new clinics via /register; Super Admin approves.");
  } catch (e) {
    console.error("Reset failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
