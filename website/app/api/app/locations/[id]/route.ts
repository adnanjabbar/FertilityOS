import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateLocationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().max(2000).optional().nullable(),
  city: z.string().max(128).optional().nullable(),
  state: z.string().max(128).optional().nullable(),
  country: z.string().length(2).optional().nullable(),
  postalCode: z.string().max(32).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/app/locations/[id]
 * Get a single location (tenant-scoped).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.id, id),
        eq(locations.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

/**
 * PATCH /api/app/locations/[id]
 * Update a location. Admin only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.id, id),
        eq(locations.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const data = parsed.data;
  const updateValues: Partial<typeof locations.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.address !== undefined) updateValues.address = data.address?.trim() ?? null;
  if (data.city !== undefined) updateValues.city = data.city?.trim() ?? null;
  if (data.state !== undefined) updateValues.state = data.state?.trim() ?? null;
  if (data.country !== undefined) updateValues.country = data.country?.trim() ?? null;
  if (data.postalCode !== undefined) updateValues.postalCode = data.postalCode?.trim() ?? null;
  if (data.timezone !== undefined) updateValues.timezone = data.timezone?.trim() ?? null;
  if (data.isDefault === true) {
    await db
      .update(locations)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(locations.tenantId, session.user.tenantId));
    updateValues.isDefault = true;
  } else if (data.isDefault === false) {
    updateValues.isDefault = false;
  }

  const [updated] = await db
    .update(locations)
    .set(updateValues)
    .where(
      and(
        eq(locations.id, id),
        eq(locations.tenantId, session.user.tenantId)
      )
    )
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/app/locations/[id]
 * Delete a location. Admin only. Sets locationId to null on appointments.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.id, id),
        eq(locations.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  await db
    .delete(locations)
    .where(
      and(
        eq(locations.id, id),
        eq(locations.tenantId, session.user.tenantId)
      )
    );

  return NextResponse.json({ ok: true });
}
