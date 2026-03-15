/**
 * WhatsApp sending for FertilityOS. Tenants use their own WhatsApp Business API credentials
 * (stored in tenant_integrations). No platform WhatsApp account — only storage and sending
 * via the tenant's provider (Twilio WhatsApp or Meta Cloud API).
 */

export type SendWhatsAppOptions = {
  to: string;
  body: string;
  /** Required: use this tenant's WhatsApp config from tenant_integrations. */
  tenantId: string;
};

export type SendWhatsAppResult = { ok: boolean; error?: string };

/**
 * Send a WhatsApp message using the tenant's configured provider (Twilio or Meta Cloud API).
 * Returns { ok: true } on success, { ok: false, error } on failure.
 * If tenant has no WhatsApp configured, returns ok: false with error message.
 */
export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const { to, body, tenantId } = options;

  const normalizedTo = to?.trim().replace(/\s/g, "");
  if (!normalizedTo) {
    return { ok: false, error: "Missing recipient phone" };
  }

  const { db } = await import("@/db");
  const { tenantIntegrations } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const [row] = await db
    .select({
      whatsappProvider: tenantIntegrations.whatsappProvider,
      whatsappPhoneNumberId: tenantIntegrations.whatsappPhoneNumberId,
      whatsappAccessToken: tenantIntegrations.whatsappAccessToken,
      whatsappFromNumber: tenantIntegrations.whatsappFromNumber,
      twilioAccountSid: tenantIntegrations.twilioAccountSid,
      twilioAuthToken: tenantIntegrations.twilioAuthToken,
      twilioPhoneNumber: tenantIntegrations.twilioPhoneNumber,
    })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, tenantId))
    .limit(1);

  if (!row?.whatsappProvider) {
    return { ok: false, error: "WhatsApp not configured for this tenant" };
  }

  if (row.whatsappProvider === "twilio_whatsapp") {
    const fromNumber = (row.whatsappFromNumber ?? row.twilioPhoneNumber)?.trim();
    if (!row.twilioAccountSid || !row.twilioAuthToken || !fromNumber) {
      return { ok: false, error: "Twilio WhatsApp: missing account SID, auth token, or from number (set WhatsApp from number or Twilio phone)" };
    }
    const fromWhatsApp = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
    const toWhatsApp = normalizedTo.startsWith("whatsapp:") ? normalizedTo : `whatsapp:${normalizedTo}`;
    try {
      const twilio = await import("twilio");
      const client = twilio.default(row.twilioAccountSid, row.twilioAuthToken);
      await client.messages.create({
        body,
        from: fromWhatsApp,
        to: toWhatsApp,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[whatsapp] Twilio error:", msg);
      return { ok: false, error: msg };
    }
  }

  if (row.whatsappProvider === "meta_cloud_api") {
    if (!row.whatsappPhoneNumberId || !row.whatsappAccessToken) {
      return { ok: false, error: "Meta Cloud API: missing phone number ID or access token" };
    }
    const phoneNumberId = row.whatsappPhoneNumberId;
    const accessToken = row.whatsappAccessToken;
    const toWaId = normalizedTo.replace(/^\+/, "");
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toWaId,
          type: "text",
          text: { body },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) {
        const msg = data?.error?.message ?? res.statusText ?? "Meta API error";
        console.error("[whatsapp] Meta API error:", msg);
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[whatsapp] Meta request error:", msg);
      return { ok: false, error: msg };
    }
  }

  return { ok: false, error: "Unknown WhatsApp provider" };
}

/**
 * Build body text for an appointment reminder sent via WhatsApp.
 */
export function appointmentReminderWhatsAppBody(params: {
  patientFirstName: string;
  startAt: Date;
  type: string;
  clinicName?: string;
}): string {
  const { patientFirstName, startAt, type, clinicName } = params;
  const dateStr = startAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  const clinic = clinicName ?? "Your clinic";
  return `${patientFirstName}, reminder: ${type} appointment on ${dateStr}. ${clinic}`;
}
