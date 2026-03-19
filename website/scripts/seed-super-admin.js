/**
 * Seed the Super Admin user (platform owner dashboard).
 * Login: dradnanjabbar@gmail.com / @AdnanJabbar007 (or set SUPER_ADMIN_PASSWORD in .env)
 *
 * Run migrations first (including 0003_super_admin.sql). Then from website/:
 *   node scripts/seed-super-admin.js
 *
 * For full reset (delete all users/tenants and recreate only Super Admin):
 *   node scripts/reset-users-and-tenants.js
 */

const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

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

const SUPER_EMAIL = "dradnanjabbar@gmail.com";
const SUPER_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "@AdnanJabbar007";
const SYSTEM_TENANT_SLUG = "system";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
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
    const tenantId = tenantRes.rows[0].id;

    // Delete old super admin sessions and users (clean slate)
    const oldSuperIds = await client.query(
      "SELECT id FROM users WHERE tenant_id = $1 AND (email = $2 OR email = 'super@thefertilityos.com' OR email = 'super@fertilityos.com')",
      [tenantId, SUPER_EMAIL]
    );
    if (oldSuperIds.rows.length > 0) {
      const ids = oldSuperIds.rows.map((r) => r.id);
      await client.query("DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])", [ids]);
      await client.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
      console.log("Removed", oldSuperIds.rows.length, "old super admin user(s) and their sessions.");
    }

    const passwordHash = await bcrypt.hash(SUPER_PASSWORD, 12);
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role_slug)
       VALUES ($1, $2, $3, $4, 'super_admin')`,
      [tenantId, SUPER_EMAIL, passwordHash, "Super Administrator"]
    );
    console.log("Created super admin:", SUPER_EMAIL);

    console.log("\nSuper admin login: " + SUPER_EMAIL + " / " + SUPER_PASSWORD);
    console.log("Dashboard: /app/super");
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
