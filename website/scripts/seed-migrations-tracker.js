/**
 * One-time: seed _schema_migrations with migration filenames already applied on the DB
 * (so run-migrations.js can skip them). Use when the DB had migrations run before we added tracking.
 * Usage: DATABASE_URL=... node scripts/seed-migrations-tracker.js
 */
const { Client } = require("pg");

function loadEnv() {
  try {
    const path = require("path").join(__dirname, "..", ".env");
    const content = require("fs").readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}
loadEnv();

const alreadyApplied = [
  "0000_phase2_tenants_users_roles.sql",
  "0001_invitations.sql",
  "0002_patients.sql",
  "0003_super_admin.sql",
  "0004_appointments.sql",
  "0005_clinical_notes.sql",
  "0006_ivf_cycles.sql",
  "0007_invoices.sql",
  "0008_appointment_reminder_sent.sql",
  "0009_tenant_subscriptions.sql",
  "0010_tenant_enabled_modules.sql",
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      filename varchar(255) PRIMARY KEY,
      applied_at timestamptz DEFAULT now() NOT NULL
    )
  `);
  for (const file of alreadyApplied) {
    await client.query(
      "INSERT INTO _schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
      [file]
    );
  }
  console.log("Seeded", alreadyApplied.length, "already-applied migrations.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
