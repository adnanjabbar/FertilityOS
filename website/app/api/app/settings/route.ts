import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "INR"] as const;
const patchSchema = z.object({
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES),
});

/**
 * GET /api/app/settings
 * Returns tenant settings including defaultCurrency. Authenticated app user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tenant] = await db
    .select({ defaultCurrency: tenants.defaultCurrency })
    .from(tenants)
    .where(eq(tenants.id, session.user.tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    defaultCurrency: tenant.defaultCurrency ?? "USD",
  });
}

/**
 * PATCH /api/app/settings
 * Update tenant settings (e.g. defaultCurrency). Admin only.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(tenants)
    .set({
      defaultCurrency: parsed.data.defaultCurrency,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, session.user.tenantId))
    .returning({ defaultCurrency: tenants.defaultCurrency });

  if (!updated) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ defaultCurrency: updated.defaultCurrency });
}
