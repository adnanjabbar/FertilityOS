import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { emailCampaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { sendCampaignEmail } from "@/lib/campaign-email";

const bodySchema = z.object({
  to: z.string().email(),
});

/**
 * POST /api/app/email-campaigns/[id]/send-test — send a test email for this campaign (admin).
 */
export async function POST(
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
  const [campaign] = await db
    .select({
      id: emailCampaigns.id,
      tenantId: emailCampaigns.tenantId,
      subject: emailCampaigns.subject,
      bodyHtml: emailCampaigns.bodyHtml,
      bodyText: emailCampaigns.bodyText,
    })
    .from(emailCampaigns)
    .where(
      and(
        eq(emailCampaigns.id, id),
        eq(emailCampaigns.tenantId, session.user.tenantId!)
      )
    )
    .limit(1);

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", to: "required email" }, { status: 400 });
  }

  const result = await sendCampaignEmail({
    tenantId: campaign.tenantId,
    to: parsed.data.to,
    subject: `[Test] ${campaign.subject}`,
    html: campaign.bodyHtml,
    text: campaign.bodyText,
    fromName: session.user.tenantName ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Test email sent" });
}
