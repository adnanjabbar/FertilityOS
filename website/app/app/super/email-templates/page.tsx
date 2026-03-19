import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuperEmailTemplatesClient from "./super-email-templates-client";

export default async function SuperEmailTemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") redirect("/app/dashboard");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Email templates</h1>
        <p className="text-slate-600 mt-1">
          Platform-level templates used for admin/tenant emails.
        </p>
      </div>
      <SuperEmailTemplatesClient />
    </div>
  );
}

