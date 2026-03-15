import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { emailCampaigns } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(512),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  recipientFilter: z.string().max(500).default("all"),
});

/**
 * GET /api/app/email-campaigns — list campaigns for tenant (admin only).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = await db
    .select({
      id: emailCampaigns.id,
      name: emailCampaigns.name,
      subject: emailCampaigns.subject,
      status: emailCampaigns.status,
      scheduledAt: emailCampaigns.scheduledAt,
      sentAt: emailCampaigns.sentAt,
      recipientFilter: emailCampaigns.recipientFilter,
      createdAt: emailCampaigns.createdAt,
      updatedAt: emailCampaigns.updatedAt,
    })
    .from(emailCampaigns)
    .where(eq(emailCampaigns.tenantId, session.user.tenantId))
    .orderBy(desc(emailCampaigns.createdAt));

  return NextResponse.json(list);
}

/**
 * POST /api/app/email-campaigns — create draft campaign (admin only).
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(emailCampaigns)
    .values({
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      subject: parsed.data.subject,
      bodyHtml: parsed.data.bodyHtml,
      bodyText: parsed.data.bodyText,
      recipientFilter: parsed.data.recipientFilter,
      status: "draft",
      createdById: session.user.id,
    })
    .returning({
      id: emailCampaigns.id,
      name: emailCampaigns.name,
      subject: emailCampaigns.subject,
      status: emailCampaigns.status,
      createdAt: emailCampaigns.createdAt,
    });

  return NextResponse.json(created);
}
