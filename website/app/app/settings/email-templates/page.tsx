import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmailTemplatesClient from "./EmailTemplatesClient";

export default async function EmailTemplatesSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") redirect("/app/dashboard");
  return <EmailTemplatesClient />;
}

