import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listClinicTenants } from "@/lib/super-admin-queries";

/**
 * GET /api/app/super/tenants?page=1&limit=20&q=search
 * Paginated clinic list for super admin (excludes system tenant).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );
  const q = searchParams.get("q") ?? undefined;

  try {
    const { rows, total } = await listClinicTenants({ page, limit, q });
    return NextResponse.json({
      tenants: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("super/tenants list error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load tenants" },
      { status: 500 }
    );
  }
}
