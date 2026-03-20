import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients, tenants } from "@/db/schema";
import { and, eq, ilike, ne, or, desc } from "drizzle-orm";
import { sanitizeIlikePattern } from "@/lib/ilike-sanitize";
import { SYSTEM_TENANT_SLUG } from "@/lib/super-admin-queries";
import { logAudit, getClientIp } from "@/lib/audit";

const MAX_RESULTS = 40;
const MIN_QUERY_LEN = 2;

/**
 * GET /api/app/super/patient-search?q=...
 * Super admin only: find patients across all clinics (support / operations).
 * Audited on system tenant without embedding PHI in audit details.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < MIN_QUERY_LEN) {
    return NextResponse.json({
      results: [],
      message: `Enter at least ${MIN_QUERY_LEN} characters.`,
    });
  }

  const pattern = sanitizeIlikePattern(q);

  const rows = await db
    .select({
      patientId: patients.id,
      firstName: patients.firstName,
      lastName: patients.lastName,
      mrNumber: patients.mrNumber,
      email: patients.email,
      phone: patients.phone,
      tenantId: patients.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
    })
    .from(patients)
    .innerJoin(tenants, eq(patients.tenantId, tenants.id))
    .where(
      and(
        ne(tenants.slug, SYSTEM_TENANT_SLUG),
        or(
          ilike(patients.firstName, pattern),
          ilike(patients.lastName, pattern),
          ilike(patients.email, pattern),
          ilike(patients.mrNumber, pattern),
          ilike(patients.phone, pattern)
        )
      )!
    )
    .orderBy(desc(patients.updatedAt))
    .limit(MAX_RESULTS);

  const [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, SYSTEM_TENANT_SLUG))
    .limit(1);

  if (systemTenant) {
    void logAudit({
      tenantId: systemTenant.id,
      userId: session.user.id,
      action: "super_admin.cross_tenant_patient_search",
      entityType: "platform",
      entityId: null,
      details: {
        queryLength: q.length,
        resultCount: rows.length,
        complianceNote: "No PHI in audit payload",
      },
      ipAddress: getClientIp(request),
    }).catch(() => {});
  }

  return NextResponse.json({
    results: rows.map((r) => ({
      patientId: r.patientId,
      firstName: r.firstName,
      lastName: r.lastName,
      mrNumber: r.mrNumber,
      email: r.email,
      phone: r.phone,
      tenantId: r.tenantId,
      tenantName: r.tenantName,
      tenantSlug: r.tenantSlug,
    })),
  });
}
