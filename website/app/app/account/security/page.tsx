import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AccountSecurityClient from "./AccountSecurityClient";

export default async function AccountSecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug === "patient") {
    redirect("/app/dashboard");
  }

  return <AccountSecurityClient />;
}

