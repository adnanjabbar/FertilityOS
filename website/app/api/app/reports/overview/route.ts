import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOverviewReport } from "@/lib/report-overview";

/**
 * GET /api/app/reports/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns counts for the date range: appointments, new patients, IVF cycles, revenue.
 * Optional: appointmentsByDay for a simple chart.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const includeChart = url.searchParams.get("chart") === "true";
  const locationId = url.searchParams.get("locationId")?.trim() || null;

  try {
    const data = await getOverviewReport({
      tenantId: session.user.tenantId,
      fromParam,
      toParam,
      locationId,
      includeChart,
    });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "Invalid from or to date") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("GET /api/app/reports/overview error:", e);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
