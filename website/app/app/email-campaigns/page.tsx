import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmailCampaignsClient from "./EmailCampaignsClient";

export default async function EmailCampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") redirect("/app/dashboard");

  return <EmailCampaignsClient />;
}
