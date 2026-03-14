import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DonorDetailClient from "./DonorDetailClient";

export default async function DonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  return (
    <div>
      <DonorDetailClient donorId={id} />
    </div>
  );
}
