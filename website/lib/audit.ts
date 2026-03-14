import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditParams = {
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | Record<string, unknown> | null;
  ipAddress?: string | null;
};

/**
 * Write an audit log entry. Use from API routes after successful key actions.
 * Details can be a string or an object (will be JSON stringified).
 */
export async function logAudit(params: AuditParams): Promise<void> {
  const detailsStr =
    params.details == null
      ? null
      : typeof params.details === "string"
        ? params.details
        : JSON.stringify(params.details);

  await db.insert(auditLogs).values({
    tenantId: params.tenantId,
    userId: params.userId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    details: detailsStr,
    ipAddress: params.ipAddress ?? null,
  });
}

/**
 * Get client IP from request headers (e.g. behind proxy).
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}
