import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { eq, desc, or, ilike, and, count } from "drizzle-orm";
import { sanitizeIlikePattern } from "@/lib/ilike-sanitize";
import { z } from "zod";
import { logAudit, getClientIp } from "@/lib/audit";
import { generateNextMrNumber } from "@/lib/mr";

const optionalEmail = z
  .union([z.string().email(), z.literal(""), z.literal(null)])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null ? undefined : v));

const optionalString = (maxLen: number) =>
  z
    .union([z.string().max(maxLen), z.literal(""), z.literal(null)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null ? undefined : v));

const createPatientSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255)
    .transform((s) => s?.trim())
    .refine((s) => s.length > 0, "First name is required"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255)
    .transform((s) => s?.trim())
    .refine((s) => s.length > 0, "Last name is required"),
  dateOfBirth: optionalString(32),
  email: optionalEmail,
  phone: optionalString(64),
  address: optionalString(500),
  city: optionalString(128),
  state: optionalString(128),
  country: z
    .union([z.string().max(128), z.literal(""), z.literal(null)])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null ? undefined : v)),
  postalCode: optionalString(32),
  gender: optionalString(32),
  genderIdentity: optionalString(64),
  relationshipStatus: optionalString(32),
  coupleType: optionalString(32),
  spouseFirstName: optionalString(255),
  spouseLastName: optionalString(255),
  spouseDateOfBirth: optionalString(32),
  spouseEmail: optionalEmail,
  spousePhone: optionalString(64),
  notes: optionalString(5000),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const limitRaw = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 50;
    const pageRaw = parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const offset = (page - 1) * limit;

    const conditions = [eq(patients.tenantId, session.user.tenantId)];
    if (q.length > 0) {
      const pattern = sanitizeIlikePattern(q);
      conditions.push(
        or(
          ilike(patients.firstName, pattern),
          ilike(patients.lastName, pattern),
          ilike(patients.email, pattern),
          ilike(patients.mrNumber, pattern),
          ilike(patients.phone, pattern)
        )!
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countRow] = await db
      .select({ n: count() })
      .from(patients)
      .where(whereClause);

    const total = Number(countRow?.n ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const list = await db
      .select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        mrNumber: patients.mrNumber,
        dateOfBirth: patients.dateOfBirth,
        email: patients.email,
        phone: patients.phone,
        createdAt: patients.createdAt,
      })
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients.createdAt))
      .limit(limit)
      .offset(offset);

    if (total > 50 && page === 1) {
      void logAudit({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "patient_list_view",
        entityType: "patient",
        entityId: null,
        details: { total, page, limit, query: q || null },
        ipAddress: getClientIp(request),
      }).catch(() => {});
    }

    return NextResponse.json({
      patients: list.map((row) => ({
        ...row,
        dateOfBirth: row.dateOfBirth ? row.dateOfBirth.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error("GET /api/app/patients error:", err);
    return NextResponse.json(
      { error: "Failed to load patients", patients: [], total: 0, page: 1, limit: 50, totalPages: 1 },
      { status: 500 }
    );
  }
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

  // Normalize: some clients send null for optional fields; Zod optional() expects undefined
  const raw = body as Record<string, unknown>;
  const normalized =
    raw && typeof raw === "object"
      ? Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])
        )
      : raw;

  const parsed = createPatientSchema.safeParse(normalized);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message = Object.entries(fieldErrors)
      .map(([f, errs]) => `${f}: ${(errs || []).join(", ")}`)
      .join("; ");
    return NextResponse.json(
      {
        error: "Validation failed",
        details: fieldErrors,
        message: message || "Validation failed",
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const dateOfBirth = data.dateOfBirth
    ? new Date(data.dateOfBirth)
    : null;

  const mrNumber = await generateNextMrNumber(session.user.tenantId);

  const spouseDateOfBirth = data.spouseDateOfBirth ? new Date(data.spouseDateOfBirth) : null;
  const [created] = await db
    .insert(patients)
    .values({
      tenantId: session.user.tenantId,
      mrNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      country: data.country ? data.country.trim() : null,
      postalCode: data.postalCode?.trim() || null,
      gender: data.gender?.trim() || null,
      genderIdentity: data.genderIdentity?.trim() || null,
      relationshipStatus: data.relationshipStatus?.trim() || null,
      coupleType: data.coupleType?.trim() || null,
      spouseFirstName: data.spouseFirstName?.trim() || null,
      spouseLastName: data.spouseLastName?.trim() || null,
      spouseDateOfBirth,
      spouseEmail: data.spouseEmail?.trim() || null,
      spousePhone: data.spousePhone?.trim() || null,
      notes: data.notes?.trim() || null,
    })
    .returning({
      id: patients.id,
      mrNumber: patients.mrNumber,
      firstName: patients.firstName,
      lastName: patients.lastName,
      dateOfBirth: patients.dateOfBirth,
      email: patients.email,
      phone: patients.phone,
      createdAt: patients.createdAt,
    });

  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "patient.create",
    entityType: "patient",
    entityId: created.id,
    details: { firstName: created.firstName, lastName: created.lastName },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(created, { status: 201 });
}
