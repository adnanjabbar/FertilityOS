import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientDetailClient from "./PatientDetailClient";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { patientId } = await params;

  return (
    <div>
      <PatientDetailClient patientId={patientId} />
    </div>
  );
}
