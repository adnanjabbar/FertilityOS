import { NextResponse } from "next/server";
import { db } from "@/db";
import { tenants, users, userSessions } from "@/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";

const DEMO_EMAIL = "thefertilityos@gmail.com";
const DEMO_TENANT_SLUG = "demo-clinic";
const SUPER_ADMIN_EMAIL = "dradnanjabbar@gmail.com";
const SYSTEM_TENANT_SLUG = "system";

function getSecretFromRequest(request: Request): string | null {
  const secret = process.env.SEED_DEMO_SECRET;
  if (!secret) return null;
  const url = new URL(request.url);
  const provided = url.searchParams.get("secret") ?? request.headers.get("x-seed-secret");
  return provided === secret ? secret : null;
}

/**
 * Remove seeded demo and super-admin users (and their sessions) so you can register fresh.
 * GET or POST /api/admin/reset-seeded-accounts?secret=YOUR_SEED_DEMO_SECRET
 */
async function runReset() {
  const deleted: string[] = [];

  // Demo user(s) in demo-clinic
  const [demoTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);
  if (demoTenant) {
    const demoUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.tenantId, demoTenant.id),
          or(
            eq(users.email, DEMO_EMAIL),
            eq(users.email, "demo@thefertilityos.com"),
            eq(users.email, "demo")
          )
        )
      );
    if (demoUsers.length > 0) {
      const ids = demoUsers.map((u) => u.id);
      await db.delete(userSessions).where(inArray(userSessions.userId, ids));
      await db.delete(users).where(inArray(users.id, ids));
      deleted.push(...demoUsers.map((u) => u.email));
    }
  }

  // Super-admin in system tenant
  const [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, SYSTEM_TENANT_SLUG))
    .limit(1);
  if (systemTenant) {
    const superUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.tenantId, systemTenant.id),
          or(
            eq(users.email, SUPER_ADMIN_EMAIL),
            eq(users.email, "super@thefertilityos.com")
          )
        )
      );
    if (superUsers.length > 0) {
      const ids = superUsers.map((u) => u.id);
      await db.delete(userSessions).where(inArray(userSessions.userId, ids));
      await db.delete(users).where(inArray(users.id, ids));
      deleted.push(...superUsers.map((u) => u.email));
    }
  }

  return deleted;
}

export async function GET(request: Request) {
  if (!process.env.SEED_DEMO_SECRET) {
    return new NextResponse(
      "<!DOCTYPE html><html><body><h1>Not configured</h1><p>Set SEED_DEMO_SECRET in your app environment.</p></body></html>",
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }
  if (!getSecretFromRequest(request)) {
    return new NextResponse(
      "<!DOCTYPE html><html><body><h1>Forbidden</h1><p>Use ?secret=YOUR_SEED_DEMO_SECRET</p></body></html>",
      { status: 403, headers: { "Content-Type": "text/html" } }
    );
  }
  try {
    const deleted = await runReset();
    const base =
      request.headers.get("x-forwarded-proto") && request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "https://www.thefertilityos.com";
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Accounts reset</title></head><body style="font-family:sans-serif;max-width:480px;margin:3rem auto;padding:1rem;"><h1>Seeded accounts removed</h1><p>Deleted users: ${deleted.length ? deleted.join(", ") : "none found"}.</p><p>You can now <a href="${base}/register">register</a> with your email.</p><p><a href="${base}/register" style="display:inline-block;background:#2563eb;color:white;padding:0.5rem 1rem;text-decoration:none;border-radius:0.5rem;">Go to Register</a></p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("[reset-seeded-accounts] error:", e);
    return new NextResponse(
      `<!DOCTYPE html><html><body><h1>Error</h1><p>${e instanceof Error ? e.message : "Reset failed"}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

export async function POST(request: Request) {
  if (!process.env.SEED_DEMO_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }
  if (!getSecretFromRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const deleted = await runReset();
    return NextResponse.json({
      success: true,
      message: "Seeded accounts removed. You can register at /register.",
      deleted,
    });
  } catch (e) {
    console.error("[reset-seeded-accounts] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reset failed" },
      { status: 500 }
    );
  }
}
