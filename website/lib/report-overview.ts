import { db } from "@/db";
import { appointments, patients, ivfCycles, invoices } from "@/db/schema";
import { eq, ne, and, gte, lte, sql, count } from "drizzle-orm";

export type OverviewReportData = {
  from: string;
  to: string;
  appointments: number;
  newPatients: number;
  ivfCycles: number;
  revenuePaid: number;
  revenueOutstanding: number;
  unpaidInvoicesInPeriod: number;
  appointmentsByDay: { date: string; count: number }[];
};

/**
 * Shared aggregates for /api/app/reports/overview and CSV export.
 */
export async function getOverviewReport(params: {
  tenantId: string;
  fromParam: string | null;
  toParam: string | null;
  locationId: string | null;
  includeChart: boolean;
}): Promise<OverviewReportData> {
  const { tenantId, fromParam, toParam, locationId, includeChart } = params;

  let fromDate: Date;
  let toDate: Date;

  if (fromParam && toParam) {
    fromDate = new Date(fromParam);
    toDate = new Date(toParam);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new Error("Invalid from or to date");
    }
    if (fromDate > toDate) {
      [fromDate, toDate] = [toDate, fromDate];
    }
  } else {
    const now = new Date();
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const fromTs = fromDate;
  const toTs = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);

  const appointmentConditions = [
    eq(appointments.tenantId, tenantId),
    gte(appointments.startAt, fromTs),
    lte(appointments.startAt, toTs),
  ];
  if (locationId) {
    appointmentConditions.push(eq(appointments.locationId, locationId));
  }

  const [appointmentsCount] = await db
    .select({ count: count() })
    .from(appointments)
    .where(and(...appointmentConditions));

  const [patientsCount] = await db
    .select({ count: count() })
    .from(patients)
    .where(
      and(
        eq(patients.tenantId, tenantId),
        gte(patients.createdAt, fromTs),
        lte(patients.createdAt, toTs)
      )
    );

  const [cyclesCount] = await db
    .select({ count: count() })
    .from(ivfCycles)
    .where(
      and(
        eq(ivfCycles.tenantId, tenantId),
        gte(ivfCycles.createdAt, fromTs),
        lte(ivfCycles.createdAt, toTs)
      )
    );

  const revenueResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS NUMERIC)), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, fromTs),
        lte(invoices.paidAt, toTs)
      )
    );

  const revenue = revenueResult[0]?.total ?? "0";

  const outstandingResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS NUMERIC)), 0)`,
      cnt: count(),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, tenantId),
        ne(invoices.status, "paid"),
        gte(invoices.createdAt, fromTs),
        lte(invoices.createdAt, toTs)
      )
    );

  const outstandingTotal = outstandingResult[0]?.total ?? "0";
  const outstandingCount = outstandingResult[0]?.cnt ?? 0;

  let appointmentsByDay: { date: string; count: number }[] = [];
  if (includeChart) {
    const byDay = await db
      .select({
        date: sql<string>`DATE(${appointments.startAt})::text`,
        count: count(),
      })
      .from(appointments)
      .where(and(...appointmentConditions))
      .groupBy(sql`DATE(${appointments.startAt})`)
      .orderBy(sql`DATE(${appointments.startAt})`);
    appointmentsByDay = byDay.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    appointments: appointmentsCount?.count ?? 0,
    newPatients: patientsCount?.count ?? 0,
    ivfCycles: cyclesCount?.count ?? 0,
    revenuePaid: parseFloat(revenue),
    revenueOutstanding: parseFloat(outstandingTotal),
    unpaidInvoicesInPeriod: Number(outstandingCount),
    appointmentsByDay,
  };
}
