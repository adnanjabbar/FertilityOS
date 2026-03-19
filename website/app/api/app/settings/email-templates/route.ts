import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantEmailTemplates } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { renderTenantEmailTemplate, type TenantEmailTemplateKey } from "@/lib/tenant-email-templates";
import {
  appointmentReminderContent,
  patientPortalMagicLinkContent,
  patientPortalPasswordResetContent,
  patientPortalSetPasswordContent,
} from "@/lib/email";

function requireTenantAdmin(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user?.tenantId) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.roleSlug !== "admin" && session.user.roleSlug !== "super_admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return { ok: true as const, tenantId: session.user.tenantId };
}

export async function GET() {
  const session = await auth();
  const guard = requireTenantAdmin(session);
  if (!guard.ok) return guard.res;

  const rows = await db
    .select({
      id: tenantEmailTemplates.id,
      templateKey: tenantEmailTemplates.templateKey,
      name: tenantEmailTemplates.name,
      subject: tenantEmailTemplates.subject,
      html: tenantEmailTemplates.html,
      text: tenantEmailTemplates.text,
      updatedAt: tenantEmailTemplates.updatedAt,
    })
    .from(tenantEmailTemplates)
    .where(eq(tenantEmailTemplates.tenantId, guard.tenantId))
    .orderBy(asc(tenantEmailTemplates.templateKey));

  return NextResponse.json({ templates: rows });
}

const upsertSchema = z.object({
  templateKey: z.enum(["patient_magic_link", "patient_reset_password", "patient_set_password", "appointment_reminder"]),
  name: z.string().min(1).max(128),
  subject: z.string().min(1).max(255),
  html: z.string().min(1),
  text: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  const session = await auth();
  const guard = requireTenantAdmin(session);
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => ({}));
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { templateKey, name, subject, html, text } = parsed.data;

  await db
    .insert(tenantEmailTemplates)
    .values({
      tenantId: guard.tenantId,
      templateKey,
      name,
      subject,
      html,
      text: text ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [tenantEmailTemplates.tenantId, tenantEmailTemplates.templateKey],
      set: { name, subject, html, text: text ?? null, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

const testSchema = z.object({
  templateKey: z.enum(["patient_magic_link", "patient_reset_password", "patient_set_password", "appointment_reminder"]),
  to: z.string().email(),
});

export async function POST(req: Request) {
  const session = await auth();
  const guard = requireTenantAdmin(session);
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => ({}));
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { templateKey, to } = parsed.data;

  // Build a default fallback + vars for preview.
  const origin = "https://www.thefertilityos.com";
  const vars: Record<string, string> = {
    brandName: "TheFertilityOS",
    clinicName: "Demo Clinic",
    patientName: "Patient",
    magicLinkUrl: `${origin}/portal?token=TEST`,
    resetUrl: `${origin}/portal/reset-password?token=TEST`,
    setPasswordUrl: `${origin}/portal/set-password?token=TEST`,
    appointmentType: "Consultation",
    appointmentDate: new Date().toLocaleString(),
  };

  const fallback = (() => {
    switch (templateKey) {
      case "patient_magic_link":
        return patientPortalMagicLinkContent({ magicLinkUrl: vars.magicLinkUrl, patientFirstName: "Patient" });
      case "patient_reset_password":
        return patientPortalPasswordResetContent({ resetUrl: vars.resetUrl, patientFirstName: "Patient" });
      case "patient_set_password":
        return patientPortalSetPasswordContent({ setPasswordUrl: vars.setPasswordUrl, patientFirstName: "Patient" });
      case "appointment_reminder":
        return appointmentReminderContent({
          patientFirstName: "Patient",
          patientLastName: "Example",
          startAt: new Date(),
          type: vars.appointmentType,
          clinicName: vars.clinicName,
        });
    }
  })();

  const rendered = await renderTenantEmailTemplate({
    tenantId: guard.tenantId,
    key: templateKey as TenantEmailTemplateKey,
    vars,
    fallback,
  });
  if (!rendered.ok) {
    return NextResponse.json({ error: rendered.error }, { status: 400 });
  }

  const result = await sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

