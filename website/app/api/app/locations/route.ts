import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const createLocationSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().max(2000).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(128).optional(),
  country: z.string().length(2).optional(),
  postalCode: z.string().max(32).optional(),
  timezone: z.string().max(64).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/app/locations
 * Returns all locations for the current tenant.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, session.user.tenantId))
    .orderBy(asc(locations.name));

  return NextResponse.json(list);
}

/**
 * POST /api/app/locations
 * Create a location. Admin only.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.isDefault) {
    await db
      .update(locations)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(locations.tenantId, session.user.tenantId));
  }

  const [created] = await db
    .insert(locations)
    .values({
      tenantId: session.user.tenantId,
      name: data.name.trim(),
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      country: data.country?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
      timezone: data.timezone?.trim() || null,
      isDefault: data.isDefault ?? false,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
