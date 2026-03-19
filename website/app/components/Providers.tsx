"use client";

import { SessionProvider } from "next-auth/react";
import PwaRegister from "./PwaRegister";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: unknown;
}) {
  return (
    <SessionProvider session={session}>
      <PwaRegister />
      {children}
    </SessionProvider>
  );
}
