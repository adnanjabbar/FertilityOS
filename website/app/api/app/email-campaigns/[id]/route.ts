import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { emailCampaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(512).optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyText: z.string().min(1).optional(),
  recipientFilter: z.string().max(500).optional(),
  status: z.enum(["draft", "scheduled", "sent"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

/**
 * GET /api/app/email-campaigns/[id] — get one campaign (admin, same tenant).
 */
export async function GET(
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
  const [row] = await db
    .select()
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.tenantId, session.user.tenantId!)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

/**
 * PATCH /api/app/email-campaigns/[id] — update draft or set scheduled (admin).
 */
export async function PATCH(
  request: Request,
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
  const [existing] = await db
    .select({ id: emailCampaigns.id, status: emailCampaigns.status })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.tenantId, session.user.tenantId!)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "draft" && existing.status !== "scheduled") {
    return NextResponse.json(
      { error: "Only draft or scheduled campaigns can be updated" },
      { status: 400 }
    );
  }

  const parsed = patchBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.subject !== undefined) update.subject = parsed.data.subject;
  if (parsed.data.bodyHtml !== undefined) update.bodyHtml = parsed.data.bodyHtml;
  if (parsed.data.bodyText !== undefined) update.bodyText = parsed.data.bodyText;
  if (parsed.data.recipientFilter !== undefined) update.recipientFilter = parsed.data.recipientFilter;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.scheduledAt !== undefined) {
    update.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  }

  const [updated] = await db
    .update(emailCampaigns)
    .set(update as typeof emailCampaigns.$inferInsert)
    .where(eq(emailCampaigns.id, id))
    .returning();

  return NextResponse.json(updated);
}

/**
 * DELETE /api/app/email-campaigns/[id] — delete campaign (draft only, admin).
 */
export async function DELETE(
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
  const [existing] = await db
    .select({ id: emailCampaigns.id, status: emailCampaigns.status })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.tenantId, session.user.tenantId!)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft campaigns can be deleted" },
      { status: 400 }
    );
  }

  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  return NextResponse.json({ ok: true });
}
