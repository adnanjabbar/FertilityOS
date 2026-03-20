import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOverviewReport } from "@/lib/report-overview";
import { logAudit, getClientIp } from "@/lib/audit";

function csvCell(value: string | number): string {
  const s = typeof value === "number" ? String(value) : value;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(values: (string | number)[]): string {
  return values.map(csvCell).join(",");
}

/**
 * GET /api/app/reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD&locationId=optional
 * CSV download (UTF-8 BOM) for the same aggregates as the overview report.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const locationId = url.searchParams.get("locationId")?.trim() || null;

  let data: Awaited<ReturnType<typeof getOverviewReport>>;
  try {
    data = await getOverviewReport({
      tenantId: session.user.tenantId,
      fromParam,
      toParam,
      locationId,
      includeChart: true,
    });
  } catch {
    return NextResponse.json({ error: "Invalid from or to date" }, { status: 400 });
  }

  let locationName = "";
  if (locationId) {
    const [loc] = await db
      .select({ name: locations.name })
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.tenantId, session.user.tenantId)))
      .limit(1);
    locationName = loc?.name ?? "";
  }

  void logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "report.csv_export",
    entityType: "report",
    entityId: null,
    details: {
      from: data.from,
      to: data.to,
      locationId: locationId ?? null,
      locationName: locationName || undefined,
    },
    ipAddress: getClientIp(request),
  }).catch(() => {});

  const lines: string[] = [];
  lines.push(row(["FertilityOS — clinic report"]));
  lines.push(row(["Exported at (UTC)", new Date().toISOString()]));
  lines.push(row(["Clinic", session.user.tenantName ?? ""]));
  lines.push(row(["Period start", data.from]));
  lines.push(row(["Period end", data.to]));
  if (locationId) {
    lines.push(row(["Location filter", locationName || locationId]));
  }
  lines.push("");
  lines.push(row(["Metric", "Value"]));
  lines.push(row(["Appointments (in period)", data.appointments]));
  lines.push(row(["New patients (registered in period)", data.newPatients]));
  lines.push(row(["IVF cycles (created in period)", data.ivfCycles]));
  lines.push(row(["Revenue paid (in period)", data.revenuePaid.toFixed(2)]));
  lines.push(row(["Revenue outstanding — unpaid invoices created in period", data.revenueOutstanding.toFixed(2)]));
  lines.push(row(["Unpaid invoice count (created in period)", data.unpaidInvoicesInPeriod]));
  lines.push("");
  lines.push(row(["Appointments by day"]));
  lines.push(row(["Date", "Appointment count"]));
  for (const d of data.appointmentsByDay) {
    lines.push(row([d.date, d.count]));
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const filename = `fertilityos-report-${data.from}-to-${data.to}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
