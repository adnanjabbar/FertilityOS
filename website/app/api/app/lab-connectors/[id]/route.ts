import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labConnectors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const LAB_PROVIDERS = ["hl7_fhir", "custom_api", "file_import"] as const;
const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["lis", "lims"]).optional(),
  provider: z.enum(LAB_PROVIDERS).optional(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/app/lab-connectors/[id]
 * Get a single lab connector. Admin only.
 */
export async function GET(
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

  const [row] = await db
    .select()
    .from(labConnectors)
    .where(
      and(
        eq(labConnectors.id, id),
        eq(labConnectors.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Lab connector not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

/**
 * PATCH /api/app/lab-connectors/[id]
 * Update a lab connector. Admin only.
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: labConnectors.id })
    .from(labConnectors)
    .where(
      and(
        eq(labConnectors.id, id),
        eq(labConnectors.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Lab connector not found" }, { status: 404 });
  }

  const payload: Partial<typeof labConnectors.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.name !== undefined) payload.name = parsed.data.name.trim();
  if (parsed.data.type !== undefined) payload.type = parsed.data.type;
  if (parsed.data.provider !== undefined) payload.provider = parsed.data.provider;
  if (parsed.data.config !== undefined) payload.config = parsed.data.config;
  if (parsed.data.isActive !== undefined) payload.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(labConnectors)
    .set(payload)
    .where(eq(labConnectors.id, id))
    .returning({
      id: labConnectors.id,
      name: labConnectors.name,
      type: labConnectors.type,
      provider: labConnectors.provider,
      config: labConnectors.config,
      isActive: labConnectors.isActive,
      lastSyncAt: labConnectors.lastSyncAt,
      createdAt: labConnectors.createdAt,
      updatedAt: labConnectors.updatedAt,
    });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/app/lab-connectors/[id]
 * Delete a lab connector. Admin only.
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

  const [deleted] = await db
    .delete(labConnectors)
    .where(
      and(
        eq(labConnectors.id, id),
        eq(labConnectors.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: labConnectors.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Lab connector not found or already deleted" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
