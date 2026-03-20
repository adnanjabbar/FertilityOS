import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SuperPatientSearchClient from "./SuperPatientSearchClient";

export default async function SuperPatientSearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "super_admin") {
    redirect("/app/dashboard");
  }
  return <SuperPatientSearchClient />;
}
