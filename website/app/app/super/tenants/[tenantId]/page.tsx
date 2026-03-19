import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TenantDeepDiveClient from "./TenantDeepDiveClient";

type PageProps = { params: Promise<{ tenantId: string }> };

export default async function SuperTenantDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") {
    redirect("/app/dashboard");
  }
  const { tenantId } = await params;
  return <TenantDeepDiveClient tenantId={tenantId} />;
}
