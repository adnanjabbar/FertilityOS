import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { surrogacyCases, patients } from "@/db/schema";
import { eq, and, desc, like } from "drizzle-orm";
import { z } from "zod";

const createSurrogacyCaseSchema = z.object({
  intendedParentPatientId: z.string().uuid(),
  surrogateName: z.string().min(1, "Surrogate name is required").max(255),
  surrogateContact: z.string().max(2000).optional().nullable(),
  status: z.enum(["matching", "pregnant", "delivered", "closed"]).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conditions = [eq(surrogacyCases.tenantId, session.user.tenantId)];

  const list = await db
    .select({
      id: surrogacyCases.id,
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
    .where(conditions[0])
    .orderBy(desc(surrogacyCases.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSurrogacyCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

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

  const year = new Date().getFullYear();
  const prefix = `SUR-${year}-`;
  const [last] = await db
    .select({ caseNumber: surrogacyCases.caseNumber })
    .from(surrogacyCases)
    .where(
      and(
        eq(surrogacyCases.tenantId, session.user.tenantId),
        like(surrogacyCases.caseNumber, `${prefix}%`)
      )
    )
    .orderBy(desc(surrogacyCases.caseNumber))
    .limit(1);

  let nextNum = 1;
  if (last?.caseNumber) {
    const match = last.caseNumber.match(new RegExp(`^${prefix.replace(/[-]/g, "\\$&")}(\\d+)$`));
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const caseNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;

  const startDate = data.startDate ? new Date(data.startDate) : null;
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const [created] = await db
    .insert(surrogacyCases)
    .values({
      tenantId: session.user.tenantId,
      caseNumber,
      intendedParentPatientId: data.intendedParentPatientId,
      surrogateName: data.surrogateName.trim(),
      surrogateContact: data.surrogateContact?.trim() || null,
      status: data.status ?? "matching",
      startDate,
      dueDate,
      notes: data.notes?.trim() || null,
    })
    .returning();

  if (!created) {
    return NextResponse.json({ error: "Failed to create surrogacy case" }, { status: 500 });
  }

  return NextResponse.json(created, { status: 201 });
}
