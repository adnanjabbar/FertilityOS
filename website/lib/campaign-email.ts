/**
 * Campaign email sending: platform (Resend + FertilityOS footer) vs custom_domain (tenant SMTP, no footer).
 */

import { db } from "@/db";
import { tenantIntegrations, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { appendPlatformFooter, appendPlatformFooterText } from "./email-footer";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_PLATFORM_FROM = "FertilityOS <noreply@thefertilityos.com>";
const PLATFORM_FROM_EMAIL = process.env.REMINDER_FROM_EMAIL ?? DEFAULT_PLATFORM_FROM;

function platformFromAddress(displayName: string): string {
  const match = PLATFORM_FROM_EMAIL.match(/<([^>]+)>/);
  const email = match ? match[1].trim() : "noreply@thefertilityos.com";
  return `${displayName} <${email}>`;
}

export type TenantEmailConfig = {
  mode: "platform" | "custom_domain";
  tenantName: string;
  customSmtpHost?: string | null;
  customSmtpPort?: number | null;
  customSmtpUser?: string | null;
  customSmtpPassword?: string | null;
  customSmtpFromEmail?: string | null;
  customSmtpSecure?: boolean | null;
};

export async function getTenantEmailConfig(tenantId: string): Promise<TenantEmailConfig | null> {
  const [tenant] = await db
    .select({ name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant) return null;

  const [int] = await db
    .select({
      emailSendingMode: tenantIntegrations.emailSendingMode,
      customSmtpHost: tenantIntegrations.customSmtpHost,
      customSmtpPort: tenantIntegrations.customSmtpPort,
      customSmtpUser: tenantIntegrations.customSmtpUser,
      customSmtpPassword: tenantIntegrations.customSmtpPassword,
      customSmtpFromEmail: tenantIntegrations.customSmtpFromEmail,
      customSmtpSecure: tenantIntegrations.customSmtpSecure,
    })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, tenantId))
    .limit(1);

  const mode = int?.emailSendingMode ?? "platform";
  return {
    mode,
    tenantName: tenant.name,
    customSmtpHost: int?.customSmtpHost,
    customSmtpPort: int?.customSmtpPort,
    customSmtpUser: int?.customSmtpUser,
    customSmtpPassword: int?.customSmtpPassword,
    customSmtpFromEmail: int?.customSmtpFromEmail,
    customSmtpSecure: int?.customSmtpSecure,
  };
}

export type SendCampaignEmailOptions = {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  fromName?: string;
};

/**
 * Send a single campaign email. Uses platform (Resend + footer) or tenant SMTP (no footer).
 * Returns provider used: "resend" | "smtp" for logging.
 */
export async function sendCampaignEmail(
  options: SendCampaignEmailOptions
): Promise<{ ok: boolean; error?: string; provider?: "resend" | "smtp" }> {
  const { tenantId, to, subject, html, text, fromName } = options;
  const config = await getTenantEmailConfig(tenantId);
  if (!config) return { ok: false, error: "Tenant not found" };

  const safeFromName = (fromName || config.tenantName).replace(/</g, "").trim();

  if (config.mode === "custom_domain") {
    if (!config.customSmtpHost || !config.customSmtpFromEmail) {
      return { ok: false, error: "Custom SMTP not configured" };
    }
    return sendViaSmtp({
      to,
      subject,
      html,
      text,
      from: config.customSmtpFromEmail,
      host: config.customSmtpHost,
      port: config.customSmtpPort ?? 465,
      user: config.customSmtpUser ?? undefined,
      password: config.customSmtpPassword ?? undefined,
      secure: config.customSmtpSecure !== false,
    });
  }

  // Platform: Resend + FertilityOS footer
  const htmlWithFooter = appendPlatformFooter(html);
  const textWithFooter = appendPlatformFooterText(text);
  const resendFrom = safeFromName ? platformFromAddress(safeFromName) : PLATFORM_FROM_EMAIL;

  if (!RESEND_API_KEY) {
    console.log("[campaign-email] (no RESEND_API_KEY) Would send:", { to, subject });
    return { ok: true, provider: "resend" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: resendFrom,
      to: to.trim(),
      subject,
      html: htmlWithFooter,
      text: textWithFooter,
    });
    if (error) {
      console.error("[campaign-email] Resend error:", error);
      return { ok: false, error: String(error), provider: "resend" };
    }
    return { ok: true, provider: "resend" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[campaign-email] Send failed:", msg);
    return { ok: false, error: msg, provider: "resend" };
  }
}

type SmtpOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
  host: string;
  port: number;
  user?: string;
  password?: string;
  secure: boolean;
};

async function sendViaSmtp(opts: SmtpOptions): Promise<{ ok: boolean; error?: string; provider?: "smtp" }> {
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.secure,
      auth: opts.user && opts.password ? { user: opts.user, pass: opts.password } : undefined,
    });
    await transport.sendMail({
      from: opts.from,
      to: opts.to.trim(),
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { ok: true, provider: "smtp" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[campaign-email] SMTP error:", msg);
    return { ok: false, error: msg, provider: "smtp" };
  }
}
