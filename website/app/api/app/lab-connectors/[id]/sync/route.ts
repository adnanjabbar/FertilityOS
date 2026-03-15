import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labConnectors, labOrders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const resultItemSchema = z.object({
  externalId: z.string().optional(),
  patientId: z.string().uuid(),
  cycleId: z.string().uuid().optional(),
  orderCode: z.string().optional(),
  status: z.string().default("completed"),
  resultAt: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  resultPayload: z.record(z.unknown()).optional(),
});

const syncBodySchema = z.object({
  results: z.array(resultItemSchema).min(1).max(500),
});

/**
 * POST /api/app/lab-connectors/[id]/sync
 * Import/sync lab results for a connector. Admin only.
 * Body: { results: [{ patientId, cycleId?, externalId?, orderCode?, status?, resultAt?, resultPayload? }] }
 */
export async function POST(
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

  const { id: connectorId } = await params;

  const [connector] = await db
    .select({ id: labConnectors.id, tenantId: labConnectors.tenantId })
    .from(labConnectors)
    .where(
      and(
        eq(labConnectors.id, connectorId),
        eq(labConnectors.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!connector) {
    return NextResponse.json({ error: "Lab connector not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = syncBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tenantId = connector.tenantId;
  const inserted: string[] = [];

  for (const r of parsed.data.results) {
    const resultAt = r.resultAt
      ? new Date(r.resultAt)
      : new Date();

    await db.insert(labOrders).values({
      tenantId,
      patientId: r.patientId,
      cycleId: r.cycleId ?? null,
      connectorId,
      externalId: r.externalId ?? null,
      orderCode: r.orderCode ?? null,
      status: r.status ?? "completed",
      requestedAt: resultAt,
      resultAt,
      resultPayload: r.resultPayload ?? null,
    });
    inserted.push(r.externalId ?? r.patientId);
  }

  await db
    .update(labConnectors)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(labConnectors.id, connectorId));

  return NextResponse.json({
    ok: true,
    imported: inserted.length,
    message: `Imported ${inserted.length} result(s).`,
  });
}
