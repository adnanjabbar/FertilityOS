import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DonorsClient from "./DonorsClient";

export default async function DonorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Donors</h1>
      <p className="text-slate-600 mb-8">
        Manage egg, sperm, and embryo donors. Donor code is unique per clinic.
      </p>
      <DonorsClient />
    </div>
  );
}
