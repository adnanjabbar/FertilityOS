import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SuperClinicsDirectory from "../SuperClinicsDirectory";

export default async function SuperClinicsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/app/super"
            className="text-sm font-semibold text-blue-700 hover:underline mb-2 inline-block"
          >
            ← Platform overview
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900">All clinics</h1>
          <p className="text-slate-600 mt-1">
            Search, paginate, and open a clinic snapshot (no patient PII at platform level).
          </p>
        </div>
      </div>
      <SuperClinicsDirectory />
    </div>
  );
}
