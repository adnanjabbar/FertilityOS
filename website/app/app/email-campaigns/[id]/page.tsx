import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EmailCampaignDetailClient from "./EmailCampaignDetailClient";

export default async function EmailCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") redirect("/app/dashboard");

  const { id } = await params;
  return <EmailCampaignDetailClient campaignId={id} />;
}
