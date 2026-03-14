import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { surrogacyCases, patients } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateSurrogacyCaseSchema = z.object({
  intendedParentPatientId: z.string().uuid().optional(),
  surrogateName: z.string().min(1).max(255).optional(),
  surrogateContact: z.string().max(2000).optional().nullable(),
  status: z.enum(["matching", "pregnant", "delivered", "closed"]).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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
    .select({
      id: surrogacyCases.id,
      tenantId: surrogacyCases.tenantId,
      caseNumber: surrogacyCases.caseNumber,
      intendedParentPatientId: surrogacyCases.intendedParentPatientId,
      intendedParentFirstName: patients.firstName,
      intendedParentLastName: patients.lastName,
      surrogateName: surrogacyCases.surrogateName,
      surrogateContact: surrogacyCases.surrogateContact,
      status: surrogacyCases.status,
      startDate: surrogacyCases.startDate,
      dueDate: surrogacyCases.dueDate,
      notes: surrogacyCases.notes,
      createdAt: surrogacyCases.createdAt,
      updatedAt: surrogacyCases.updatedAt,
    })
    .from(surrogacyCases)
    .innerJoin(patients, eq(surrogacyCases.intendedParentPatientId, patients.id))
    .where(
      and(
        eq(surrogacyCases.id, id),
        eq(surrogacyCases.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Surrogacy case not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSurrogacyCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(surrogacyCases)
    .where(
      and(
        eq(surrogacyCases.id, id),
        eq(surrogacyCases.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Surrogacy case not found" }, { status: 404 });
  }

  if (data.intendedParentPatientId !== undefined) {
    const [patient] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.id, data.intendedParentPatientId),
          eq(patients.tenantId, session.user.tenantId)
        )
      )
      .limit(1);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found or does not belong to your tenant" }, { status: 404 });
    }
  }

  const updateValues: Partial<typeof surrogacyCases.$inferInsert> = { updatedAt: new Date() };
  if (data.intendedParentPatientId !== undefined) updateValues.intendedParentPatientId = data.intendedParentPatientId;
  if (data.surrogateName !== undefined) updateValues.surrogateName = data.surrogateName.trim();
  if (data.surrogateContact !== undefined) updateValues.surrogateContact = data.surrogateContact?.trim() || null;
  if (data.status !== undefined) updateValues.status = data.status;
  if (data.startDate !== undefined) updateValues.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.dueDate !== undefined) updateValues.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(surrogacyCases)
    .set(updateValues)
    .where(
      and(
        eq(surrogacyCases.id, id),
        eq(surrogacyCases.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Surrogacy case not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
