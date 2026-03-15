import { auth } from "@/auth";
import { redirect } from "next/navigation";
import NewEmailCampaignClient from "./NewEmailCampaignClient";

export default async function NewEmailCampaignPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") redirect("/app/dashboard");

  return <NewEmailCampaignClient />;
}
