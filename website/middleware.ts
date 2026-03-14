import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const authPagePaths = ["/login", "/register"];

const authMiddleware = auth((req) => {
  const isApp = req.nextUrl.pathname.startsWith("/app");
  const isAuthPage = authPagePaths.includes(req.nextUrl.pathname);
  const isLoggedIn = !!req.auth;

  if (isApp && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/app/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export default async function middleware(req: NextRequest) {
  const isAuthPage = authPagePaths.includes(req.nextUrl.pathname);
  try {
    return await authMiddleware(req);
  } catch {
    if (isAuthPage) {
      return NextResponse.next();
    }
    throw new Error("Auth failed");
  }
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
