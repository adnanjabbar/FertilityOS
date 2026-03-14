import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { donors } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateDonorSchema = z.object({
  type: z.enum(["egg", "sperm", "embryo"]).optional(),
  donorCode: z.string().min(1).max(64).optional(),
  firstName: z.string().max(255).optional().nullable(),
  lastName: z.string().max(255).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  bloodType: z.string().max(16).optional().nullable(),
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

  const [donor] = await db
    .select()
    .from(donors)
    .where(
      and(
        eq(donors.id, id),
        eq(donors.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!donor) {
    return NextResponse.json({ error: "Donor not found" }, { status: 404 });
  }

  return NextResponse.json(donor);
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

  const parsed = updateDonorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth =
    data.dateOfBirth === null || data.dateOfBirth === ""
      ? null
      : data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : undefined;

  const updateValues: Partial<typeof donors.$inferInsert> = { updatedAt: new Date() };
  if (data.type !== undefined) updateValues.type = data.type;
  if (data.donorCode !== undefined) updateValues.donorCode = data.donorCode.trim();
  if (data.firstName !== undefined) updateValues.firstName = data.firstName?.trim() || null;
  if (data.lastName !== undefined) updateValues.lastName = data.lastName?.trim() || null;
  if (data.dateOfBirth !== undefined) updateValues.dateOfBirth = dateOfBirth;
  if (data.bloodType !== undefined) updateValues.bloodType = data.bloodType?.trim() || null;
  if (data.notes !== undefined) updateValues.notes = data.notes?.trim() || null;

  const [updated] = await db
    .update(donors)
    .set(updateValues)
    .where(
      and(
        eq(donors.id, id),
        eq(donors.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Donor not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
