import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const WHATSAPP_PROVIDERS = ["twilio_whatsapp", "meta_cloud_api"] as const;

const PATCH_BODY = z.object({
  twilioAccountSid: z.string().trim().optional(),
  twilioAuthToken: z.string().trim().optional(),
  twilioPhoneNumber: z.string().trim().max(32).optional(),
  dailyApiKey: z.string().trim().optional(),
  whatsappProvider: z.enum(WHATSAPP_PROVIDERS).optional().nullable(),
  whatsappPhoneNumberId: z.string().trim().optional().nullable(),
  whatsappAccessToken: z.string().trim().optional().nullable(),
  whatsappFromNumber: z.string().trim().max(32).optional().nullable(),
  whatsappTemplateNamespace: z.string().trim().optional().nullable(),
  emailSendingMode: z.enum(["platform", "custom_domain"]).optional(),
  customSmtpHost: z.string().trim().optional(),
  customSmtpPort: z.number().int().min(1).max(65535).optional(),
  customSmtpUser: z.string().trim().optional(),
  customSmtpPassword: z.string().trim().optional(),
  customSmtpFromEmail: z.string().trim().max(255).optional(),
  customSmtpSecure: z.boolean().optional(),
});

/**
 * GET /api/app/integrations
 * Returns tenant integration status (no secrets). Tenants use their own Twilio and Daily.co accounts.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({
      twilioAccountSid: tenantIntegrations.twilioAccountSid,
      twilioPhoneNumber: tenantIntegrations.twilioPhoneNumber,
      dailyApiKey: tenantIntegrations.dailyApiKey,
      whatsappProvider: tenantIntegrations.whatsappProvider,
      whatsappPhoneNumberId: tenantIntegrations.whatsappPhoneNumberId,
      whatsappFromNumber: tenantIntegrations.whatsappFromNumber,
      emailSendingMode: tenantIntegrations.emailSendingMode,
      customSmtpHost: tenantIntegrations.customSmtpHost,
      customSmtpPort: tenantIntegrations.customSmtpPort,
      customSmtpFromEmail: tenantIntegrations.customSmtpFromEmail,
      customSmtpSecure: tenantIntegrations.customSmtpSecure,
    })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, session.user.tenantId))
    .limit(1);

  const whatsappConfigured =
    !!row?.whatsappProvider &&
    (row.whatsappProvider === "meta_cloud_api"
      ? !!row.whatsappPhoneNumberId
      : !!(row.whatsappFromNumber || row.twilioPhoneNumber) && !!row.twilioAccountSid);

  return NextResponse.json({
    twilioConfigured: !!(row?.twilioAccountSid && row?.twilioPhoneNumber),
    twilioPhoneNumber: row?.twilioPhoneNumber ? `••••${row.twilioPhoneNumber.slice(-4)}` : null,
    dailyConfigured: !!row?.dailyApiKey,
    whatsappConfigured,
    whatsappProvider: row?.whatsappProvider ?? null,
    whatsappPhoneNumberId: row?.whatsappPhoneNumberId ? `••••${row.whatsappPhoneNumberId.slice(-4)}` : null,
    whatsappFromNumber: row?.whatsappFromNumber ? `••••${row.whatsappFromNumber.slice(-4)}` : null,
    emailSendingMode: row?.emailSendingMode ?? "platform",
    customSmtpConfigured: !!(row?.customSmtpHost && row?.customSmtpFromEmail),
    customSmtpHost: row?.customSmtpHost ?? null,
    customSmtpPort: row?.customSmtpPort ?? null,
    customSmtpFromEmail: row?.customSmtpFromEmail ?? null,
    customSmtpSecure: row?.customSmtpSecure ?? true,
  });
}

/**
 * PATCH /api/app/integrations
 * Set tenant-owned Twilio and Daily.co credentials. Admin only. No platform keys — clinics add their own.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = PATCH_BODY.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload: Partial<typeof tenantIntegrations.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.twilioAccountSid !== undefined) payload.twilioAccountSid = parsed.data.twilioAccountSid || null;
  if (parsed.data.twilioAuthToken !== undefined) payload.twilioAuthToken = parsed.data.twilioAuthToken || null;
  if (parsed.data.twilioPhoneNumber !== undefined) payload.twilioPhoneNumber = parsed.data.twilioPhoneNumber || null;
  if (parsed.data.dailyApiKey !== undefined) payload.dailyApiKey = parsed.data.dailyApiKey || null;
  if (parsed.data.emailSendingMode !== undefined) payload.emailSendingMode = parsed.data.emailSendingMode;
  if (parsed.data.customSmtpHost !== undefined) payload.customSmtpHost = parsed.data.customSmtpHost || null;
  if (parsed.data.customSmtpPort !== undefined) payload.customSmtpPort = parsed.data.customSmtpPort ?? null;
  if (parsed.data.customSmtpUser !== undefined) payload.customSmtpUser = parsed.data.customSmtpUser || null;
  if (parsed.data.customSmtpPassword !== undefined) payload.customSmtpPassword = parsed.data.customSmtpPassword || null;
  if (parsed.data.customSmtpFromEmail !== undefined) payload.customSmtpFromEmail = parsed.data.customSmtpFromEmail || null;
  if (parsed.data.customSmtpSecure !== undefined) payload.customSmtpSecure = parsed.data.customSmtpSecure;
  if (parsed.data.whatsappProvider !== undefined) payload.whatsappProvider = parsed.data.whatsappProvider ?? null;
  if (parsed.data.whatsappPhoneNumberId !== undefined) payload.whatsappPhoneNumberId = parsed.data.whatsappPhoneNumberId ?? null;
  if (parsed.data.whatsappAccessToken !== undefined) payload.whatsappAccessToken = parsed.data.whatsappAccessToken ?? null;
  if (parsed.data.whatsappFromNumber !== undefined) payload.whatsappFromNumber = parsed.data.whatsappFromNumber ?? null;
  if (parsed.data.whatsappTemplateNamespace !== undefined) payload.whatsappTemplateNamespace = parsed.data.whatsappTemplateNamespace ?? null;

  const [existing] = await db
    .select({ tenantId: tenantIntegrations.tenantId })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, session.user.tenantId))
    .limit(1);

  if (existing) {
    await db
      .update(tenantIntegrations)
      .set(payload)
      .where(eq(tenantIntegrations.tenantId, session.user.tenantId));
  } else {
    await db.insert(tenantIntegrations).values({
      tenantId: session.user.tenantId,
      ...payload,
    });
  }

  return NextResponse.json({ ok: true });
}
