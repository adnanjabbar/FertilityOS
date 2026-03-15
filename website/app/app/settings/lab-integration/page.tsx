import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LabIntegrationClient from "./LabIntegrationClient";

export default async function LabIntegrationPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return <LabIntegrationClient />;
}
