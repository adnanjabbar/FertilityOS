import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { platformEmailTemplates } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { renderPlatformEmailTemplate } from "@/lib/platform-email-templates";

function requireSuperAdmin(session: Awaited<ReturnType<typeof auth>>) {
  if (!session?.user) return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.roleSlug !== "super_admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Super admin only" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  const session = await auth();
  const guard = requireSuperAdmin(session);
  if (!guard.ok) return guard.res;

  const rows = await db
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
    .orderBy(asc(platformEmailTemplates.templateKey));

  return NextResponse.json({ templates: rows });
}

const upsertSchema = z.object({
  templateKey: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  subject: z.string().min(1).max(255),
  html: z.string().min(1),
  text: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  const session = await auth();
  const guard = requireSuperAdmin(session);
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => ({}));
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { templateKey, name, subject, html, text } = parsed.data;

  await db
    .insert(platformEmailTemplates)
    .values({
      templateKey,
      name,
      subject,
      html,
      text: text ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [platformEmailTemplates.templateKey],
      set: { name, subject, html, text: text ?? null, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

const testSchema = z.object({
  templateKey: z.string().min(1).max(64),
  to: z.string().email(),
  vars: z.record(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const guard = requireSuperAdmin(session);
  if (!guard.ok) return guard.res;

  const body = await req.json().catch(() => ({}));
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { templateKey, to, vars } = parsed.data;
  // Only allow known keys for now.
  if (templateKey !== "staff_forgot_password") {
    return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
  }

  const rendered = await renderPlatformEmailTemplate({
    key: "staff_forgot_password",
    vars: {
      brandName: "TheFertilityOS",
      resetUrl: "https://www.thefertilityos.com/reset-password?token=TEST_TOKEN",
      name: "Dr Adnan",
      ...(vars ?? {}),
    },
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

