import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Audit log</h1>
      <p className="text-slate-600 mb-8">
        Recent key actions for compliance and debugging. Admin only.
      </p>
      <AuditLogsClient />
    </div>
  );
}
