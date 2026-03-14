import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SurrogacyCaseDetailClient from "./SurrogacyCaseDetailClient";

export default async function SurrogacyCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return (
    <div className="space-y-6">
      <SurrogacyCaseDetailClient caseId={id} />
    </div>
  );
}
