import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labTests } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/app/lab/tests
 * List lab tests (catalog) for the tenant. Returns [] if table missing or error.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const list = await db
      .select({
        id: labTests.id,
        code: labTests.code,
        name: labTests.name,
        category: labTests.category,
        unit: labTests.unit,
        referenceRangeLow: labTests.referenceRangeLow,
        referenceRangeHigh: labTests.referenceRangeHigh,
        referenceRangeMaleLow: labTests.referenceRangeMaleLow,
        referenceRangeMaleHigh: labTests.referenceRangeMaleHigh,
        referenceRangeFemaleLow: labTests.referenceRangeFemaleLow,
        referenceRangeFemaleHigh: labTests.referenceRangeFemaleHigh,
        referenceRangeText: labTests.referenceRangeText,
        isPanel: labTests.isPanel,
      })
      .from(labTests)
      .where(eq(labTests.tenantId, session.user.tenantId))
      .orderBy(asc(labTests.code));
    return NextResponse.json(list);
  } catch (err) {
    console.error("GET /api/app/lab/tests error:", err);
    return NextResponse.json([]);
  }
}
