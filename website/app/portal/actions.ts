"use server";

import { signOut } from "@/auth";

export async function signOutPortal() {
  await signOut({ redirectTo: "/portal/login" });
}
