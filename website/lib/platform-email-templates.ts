import { db } from "@/db";
import { platformEmailTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PlatformEmailTemplateKey = "staff_forgot_password";

export type RenderPlatformEmailResult =
  | { ok: true; subject: string; html: string; text?: string }
  | { ok: false; error: string };

export async function getPlatformEmailTemplateByKey(key: PlatformEmailTemplateKey) {
  const [row] = await db
    .select({
      id: platformEmailTemplates.id,
      templateKey: platformEmailTemplates.templateKey,
      name: platformEmailTemplates.name,
      subject: platformEmailTemplates.subject,
      html: platformEmailTemplates.html,
      text: platformEmailTemplates.text,
      updatedAt: platformEmailTemplates.updatedAt,
    })
    .from(platformEmailTemplates)
    .where(eq(platformEmailTemplates.templateKey, key))
    .limit(1);
  return row ?? null;
}

function renderString(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const key = String(k);
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key]! : "";
  });
}

export async function renderPlatformEmailTemplate(params: {
  key: PlatformEmailTemplateKey;
  vars: Record<string, string>;
}): Promise<RenderPlatformEmailResult> {
  const tpl = await getPlatformEmailTemplateByKey(params.key);
  if (!tpl) return { ok: false, error: "Template not found" };
  const subject = renderString(tpl.subject, params.vars).trim();
  const html = renderString(tpl.html, params.vars);
  const text = tpl.text ? renderString(tpl.text, params.vars) : undefined;
  if (!subject) return { ok: false, error: "Template subject is empty after rendering" };
  if (!html.trim()) return { ok: false, error: "Template HTML is empty after rendering" };
  return { ok: true, subject, html, text };
}

