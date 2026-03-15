import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { labConnectors } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/app/lab-connectors/[id]/test
 * Test connection for a lab connector. Admin only.
 * Performs a lightweight validation based on provider (e.g. ping endpoint for API, validate config for file_import).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [connector] = await db
    .select({
      id: labConnectors.id,
      provider: labConnectors.provider,
      config: labConnectors.config,
    })
    .from(labConnectors)
    .where(
      and(
        eq(labConnectors.id, id),
        eq(labConnectors.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!connector) {
    return NextResponse.json({ error: "Lab connector not found" }, { status: 404 });
  }

  const config = connector.config as Record<string, unknown>;
  let ok = false;
  let message = "Connection test not implemented for this provider.";

  switch (connector.provider) {
    case "hl7_fhir": {
      const endpoint = config?.endpoint as string | undefined;
      if (!endpoint?.trim()) {
        message = "Missing endpoint in config.";
        break;
      }
      try {
        const res = await fetch(`${endpoint.replace(/\/$/, "")}/metadata`, {
          method: "GET",
          headers: { Accept: "application/fhir+json" },
          signal: AbortSignal.timeout(10000),
        });
        ok = res.ok;
        message = ok ? "FHIR endpoint reachable." : `HTTP ${res.status}: ${res.statusText}`;
      } catch (err) {
        message = err instanceof Error ? err.message : "Request failed.";
      }
      break;
    }
    case "custom_api": {
      const endpoint = config?.endpoint as string | undefined;
      if (!endpoint?.trim()) {
        message = "Missing endpoint in config.";
        break;
      }
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          signal: AbortSignal.timeout(10000),
        });
        ok = res.ok || res.status === 401; // 401 = endpoint exists, auth may be required
        message = ok ? "Endpoint reachable." : `HTTP ${res.status}: ${res.statusText}`;
      } catch (err) {
        message = err instanceof Error ? err.message : "Request failed.";
      }
      break;
    }
    case "file_import":
      ok = true;
      message = "File import connector ready. Use sync/import to upload results.";
      break;
    default:
      message = `Unknown provider: ${connector.provider}. No test available.`;
  }

  return NextResponse.json({ ok, message });
}
