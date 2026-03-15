import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { emailCampaigns, emailSendLog, patients } from "@/db/schema";
import { eq, and, isNotNull, ne } from "drizzle-orm";
import { sendCampaignEmail } from "@/lib/campaign-email";

/**
 * POST /api/app/email-campaigns/[id]/send — send campaign now to all recipients (admin).
 * Campaign must be draft or scheduled. Resolves recipients from recipientFilter ("all" = patients with email).
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
  const [campaign] = await db
    .select()
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

  if (campaign.status === "sent") {
    return NextResponse.json({ error: "Campaign already sent" }, { status: 400 });
  }

  // Resolve recipients: "all" = patients with non-empty email
  const recipientList = await db
    .select({ id: patients.id, email: patients.email })
    .from(patients)
    .where(
      and(
        eq(patients.tenantId, campaign.tenantId),
        isNotNull(patients.email),
        ne(patients.email, "")
      )
    );

  const toSend = recipientList.filter((p) => p.email?.trim());
  if (toSend.length === 0) {
    return NextResponse.json(
      { error: "No recipients with email address found" },
      { status: 400 }
    );
  }

  const tenantName = session.user.tenantName ?? undefined;
  const results: { patientId: string; email: string; ok: boolean; error?: string }[] = [];
  let provider: "resend" | "smtp" = "resend";

  for (const rec of toSend) {
    const email = rec.email!.trim();
    const result = await sendCampaignEmail({
      tenantId: campaign.tenantId,
      to: email,
      subject: campaign.subject,
      html: campaign.bodyHtml,
      text: campaign.bodyText,
      fromName: tenantName,
    });
    provider = result.provider ?? provider;
    results.push({
      patientId: rec.id,
      email,
      ok: result.ok,
      error: result.error,
    });
    if (result.ok) {
      await db.insert(emailSendLog).values({
        campaignId: campaign.id,
        patientId: rec.id,
        provider,
      });
    }
  }

  const sentCount = results.filter((r) => r.ok).length;
  await db
    .update(emailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, id));

  return NextResponse.json({
    ok: true,
    sent: sentCount,
    failed: results.length - sentCount,
    total: results.length,
    results,
  });
}
