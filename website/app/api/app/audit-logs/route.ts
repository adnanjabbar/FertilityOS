import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action")?.trim() || null;
  const entityType = url.searchParams.get("entityType")?.trim() || null;
  const dateFrom = url.searchParams.get("dateFrom")?.trim() || null;
  const dateTo = url.searchParams.get("dateTo")?.trim() || null;
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    Math.max(1, limitRaw ? parseInt(limitRaw, 10) : DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const conditions = [eq(auditLogs.tenantId, session.user.tenantId)];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) conditions.push(gte(auditLogs.createdAt, from));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) conditions.push(lte(auditLogs.createdAt, to));
  }

  const list = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userName: users.fullName,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return NextResponse.json(
    list.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      details: row.details,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    }))
  );
}
