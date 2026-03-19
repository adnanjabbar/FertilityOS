import { db } from "@/db";
import { tenantBranding, tenantEmailTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type TenantEmailTemplateKey =
  | "patient_magic_link"
  | "patient_reset_password"
  | "patient_set_password"
  | "appointment_reminder";

export type RenderTenantEmailResult =
  | { ok: true; subject: string; html: string; text?: string }
  | { ok: false; error: string };

function renderString(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const key = String(k);
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key]! : "";
  });
}

async function shouldShowPoweredBy(tenantId: string): Promise<boolean> {
  const [row] = await db
    .select({ showPoweredBy: tenantBranding.showPoweredBy })
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenantId))
    .limit(1);
  return row?.showPoweredBy ?? true;
}

function applyPoweredByFooter(params: {
  html: string;
  text?: string;
  showPoweredBy: boolean;
}): { html: string; text?: string } {
  if (!params.showPoweredBy) return { html: params.html, text: params.text };

  const footerHtml = `
    <div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
      Powered by <strong style="color:#0f172a;">TheFertilityOS</strong>
    </div>
  `.trim();
  const html = params.html.includes("</body>")
    ? params.html.replace("</body>", `${footerHtml}</body>`)
    : `${params.html}\n${footerHtml}`;

  const text = params.text
    ? `${params.text}\n\nPowered by TheFertilityOS`
    : undefined;
  return { html, text };
}

export async function getTenantEmailTemplate(tenantId: string, key: TenantEmailTemplateKey) {
  const [row] = await db
    .select({
      id: tenantEmailTemplates.id,
      tenantId: tenantEmailTemplates.tenantId,
      templateKey: tenantEmailTemplates.templateKey,
      name: tenantEmailTemplates.name,
      subject: tenantEmailTemplates.subject,
      html: tenantEmailTemplates.html,
      text: tenantEmailTemplates.text,
      updatedAt: tenantEmailTemplates.updatedAt,
    })
    .from(tenantEmailTemplates)
    .where(and(eq(tenantEmailTemplates.tenantId, tenantId), eq(tenantEmailTemplates.templateKey, key)))
    .limit(1);
  return row ?? null;
}

export async function renderTenantEmailTemplate(params: {
  tenantId: string;
  key: TenantEmailTemplateKey;
  vars: Record<string, string>;
  fallback: { subject: string; html: string; text?: string };
}): Promise<RenderTenantEmailResult> {
  const tpl = await getTenantEmailTemplate(params.tenantId, params.key);

  const base = tpl
    ? {
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text ?? undefined,
      }
    : params.fallback;

  const subject = renderString(base.subject, params.vars).trim();
  const html0 = renderString(base.html, params.vars);
  const text0 = base.text ? renderString(base.text, params.vars) : undefined;

  if (!subject) return { ok: false, error: "Email subject is empty after rendering" };
  if (!html0.trim()) return { ok: false, error: "Email HTML is empty after rendering" };

  const showPoweredBy = await shouldShowPoweredBy(params.tenantId);
  const { html, text } = applyPoweredByFooter({ html: html0, text: text0, showPoweredBy });
  return { ok: true, subject, html, text };
}

