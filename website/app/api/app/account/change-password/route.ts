import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only app users (users table) can change password here; patients use portal flows
  if (session.user.roleSlug === "patient") {
    return NextResponse.json(
      { error: "Use the patient portal to change your password." },
      { status: 403 }
    );
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword.trim() : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword.trim() : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const [row] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!row.passwordHash) {
    return NextResponse.json(
      { error: "Your account uses a different sign-in method. You cannot change password here." },
      { status: 400 }
    );
  }

  const currentOk = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!currentOk) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, row.id));

  return NextResponse.json({ success: true });
}
