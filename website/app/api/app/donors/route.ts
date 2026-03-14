import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { donors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createDonorSchema = z.object({
  type: z.enum(["egg", "sperm", "embryo"]),
  donorCode: z.string().min(1, "Donor code is required").max(64),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  dateOfBirth: z.string().optional(),
  bloodType: z.string().max(16).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: donors.id,
      type: donors.type,
      donorCode: donors.donorCode,
      firstName: donors.firstName,
      lastName: donors.lastName,
      dateOfBirth: donors.dateOfBirth,
      bloodType: donors.bloodType,
      createdAt: donors.createdAt,
    })
    .from(donors)
    .where(eq(donors.tenantId, session.user.tenantId))
    .orderBy(desc(donors.createdAt));

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

  const parsed = createDonorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth)
    : null;

  const [created] = await db
    .insert(donors)
    .values({
      tenantId: session.user.tenantId,
      type: data.type,
      donorCode: data.donorCode.trim(),
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      dateOfBirth,
      bloodType: data.bloodType?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .returning({
      id: donors.id,
      type: donors.type,
      donorCode: donors.donorCode,
      firstName: donors.firstName,
      lastName: donors.lastName,
      dateOfBirth: donors.dateOfBirth,
      bloodType: donors.bloodType,
      notes: donors.notes,
      createdAt: donors.createdAt,
    });

  return NextResponse.json(created, { status: 201 });
}
