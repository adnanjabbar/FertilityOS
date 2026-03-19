import Providers from "./Providers";
import { auth } from "@/auth";

export default async function RootProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch session on the server so SessionProvider renders the same initial state
  // during SSR and hydration (helps prevent React hydration error #418).
  const session = await auth();

  return <Providers session={session}>{children}</Providers>;
}

