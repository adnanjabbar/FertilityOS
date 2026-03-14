import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientsClient from "./PatientsClient";

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Patients</h1>
      <p className="text-slate-600 mb-8">
        Register and manage patient records. Search by name or email.
      </p>
      <PatientsClient />
    </div>
  );
}
