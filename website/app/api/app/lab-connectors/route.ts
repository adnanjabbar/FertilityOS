import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labConnectors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const LAB_PROVIDERS = ["hl7_fhir", "custom_api", "file_import"] as const;
const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["lis", "lims"]),
  provider: z.enum(LAB_PROVIDERS),
  config: z.record(z.unknown()).default({}),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/app/lab-connectors
 * List lab connectors for the tenant. Admin only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = await db
    .select({
      id: labConnectors.id,
      name: labConnectors.name,
      type: labConnectors.type,
      provider: labConnectors.provider,
      config: labConnectors.config,
      isActive: labConnectors.isActive,
      lastSyncAt: labConnectors.lastSyncAt,
      createdAt: labConnectors.createdAt,
      updatedAt: labConnectors.updatedAt,
    })
    .from(labConnectors)
    .where(eq(labConnectors.tenantId, session.user.tenantId))
    .orderBy(desc(labConnectors.createdAt));

  return NextResponse.json(list);
}

/**
 * POST /api/app/lab-connectors
 * Create a lab connector. Admin only.
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(labConnectors)
    .values({
      tenantId: session.user.tenantId,
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      provider: parsed.data.provider,
      config: parsed.data.config ?? {},
      isActive: parsed.data.isActive ?? true,
    })
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

  if (!created) {
    return NextResponse.json(
      { error: "Failed to create lab connector" },
      { status: 500 }
    );
  }

  return NextResponse.json(created, { status: 201 });
}
