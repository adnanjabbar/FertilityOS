import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SurrogacyClient from "./SurrogacyClient";

export default async function SurrogacyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Surrogacy cases</h1>
      <SurrogacyClient />
    </div>
  );
}
