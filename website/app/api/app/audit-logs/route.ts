import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

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
  const actionPrefix = url.searchParams.get("actionPrefix")?.trim() || null;
  const entityType = url.searchParams.get("entityType")?.trim() || null;
  const dateFrom = url.searchParams.get("dateFrom")?.trim() || null;
  const dateTo = url.searchParams.get("dateTo")?.trim() || null;
  const userQuery = url.searchParams.get("user")?.trim() || null;
  const search = url.searchParams.get("search")?.trim() || null;
  const pageRaw = url.searchParams.get("page");
  const pageSizeRaw = url.searchParams.get("pageSize") ?? url.searchParams.get("limit");

  const page = Math.max(1, pageRaw ? parseInt(pageRaw, 10) || 1 : 1);
  const pageSize = Math.min(
    Math.max(1, pageSizeRaw ? parseInt(pageSizeRaw, 10) || DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );

  const conditions = [eq(auditLogs.tenantId, session.user.tenantId)];
  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }
  if (actionPrefix) {
    const pattern = `${actionPrefix}%`;
    conditions.push(ilike(auditLogs.action, pattern));
  }
  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType));
  }
  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(gte(auditLogs.createdAt, from));
    }
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, endOfDay));
    }
  }

  if (userQuery) {
    const pattern = `%${userQuery}%`;
    conditions.push(
      or(
        ilike(users.email, pattern),
        ilike(users.fullName, pattern)
      )
    );
  }

  if (search && search.length >= 3) {
    const pattern = `%${search}%`;
    const isUuidLike = /^[0-9a-fA-F-]{36}$/.test(search);
    const searchConditions = [
      ilike(auditLogs.details, pattern),
      ilike(users.email, pattern),
    ];
    if (isUuidLike) {
      searchConditions.push(eq(auditLogs.entityId, search));
    }
    conditions.push(or(...searchConditions));
  }

  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userName: users.fullName,
      userEmail: users.email,
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
    .limit(pageSize + 1)
    .offset(offset);

  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName ?? null,
    userEmail: row.userEmail ?? null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    details: row.details,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    hasMore,
  });
}
