/**
 * Seed a demo clinic and demo user for testing.
 * Login: demo / demo
 *
 * Usage: from website/ run:
 *   node scripts/seed-demo.js
 * Requires DATABASE_URL in website/.env (same as migrations).
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

const DEMO_EMAIL = "demo@thefertilityos.com";
const DEMO_PASSWORD = "demo";
const DEMO_TENANT_SLUG = "demo-clinic";
const DEMO_TENANT_NAME = "Demo Clinic";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    let tenantId;
    const tenantRes = await client.query(
      "SELECT id FROM tenants WHERE slug = $1 LIMIT 1",
      [DEMO_TENANT_SLUG]
    );
    if (tenantRes.rows.length === 0) {
      const insertTenant = await client.query(
        `INSERT INTO tenants (name, slug, country) VALUES ($1, $2, $3) RETURNING id`,
        [DEMO_TENANT_NAME, DEMO_TENANT_SLUG, "US"]
      );
      tenantId = insertTenant.rows[0].id;
      console.log("Created tenant:", DEMO_TENANT_NAME);
    } else {
      tenantId = tenantRes.rows[0].id;
      console.log("Tenant already exists:", DEMO_TENANT_NAME);
    }

    // Delete old demo user sessions and users (clean slate)
    const oldDemoIds = await client.query(
      "SELECT id FROM users WHERE tenant_id = $1 AND (email = $2 OR email = 'demo' OR email LIKE 'demo@%')",
      [tenantId, DEMO_EMAIL]
    );
    if (oldDemoIds.rows.length > 0) {
      const ids = oldDemoIds.rows.map((r) => r.id);
      await client.query("DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])", [ids]);
      await client.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
      console.log("Removed", oldDemoIds.rows.length, "old demo user(s) and their sessions.");
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role_slug)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenantId, DEMO_EMAIL, passwordHash, "Demo User"]
    );
    console.log("Created demo user:", DEMO_EMAIL);

    console.log("\nDemo login: " + DEMO_EMAIL + " / " + DEMO_PASSWORD + "\n(Sign in at /login or demo-clinic subdomain)");
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
