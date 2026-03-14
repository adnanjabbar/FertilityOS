import { NextResponse } from "next/server";
import { auth } from "@/auth";

const authPagePaths = ["/login", "/register"];

export default auth((req) => {
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

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
