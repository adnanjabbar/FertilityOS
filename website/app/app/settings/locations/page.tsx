import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LocationsClient from "./LocationsClient";

export default async function LocationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.roleSlug !== "admin") {
    redirect("/app/dashboard");
  }

  return <LocationsClient />;
}
