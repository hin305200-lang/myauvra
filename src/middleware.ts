import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const handle = auth((request) => {
  const path = request.nextUrl.pathname;
  const loggedIn = Boolean(request.auth?.user?.id);
  const role = request.auth?.user?.role;
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!loggedIn || role !== "ADMIN") {
      const url = new URL("/admin/login", request.nextUrl);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }
  if ((path.startsWith("/account") && isPrivateAccount(path) || path === "/wishlist") && !loggedIn) {
    const url = new URL("/account/login", request.nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

function isPrivateAccount(path: string) {
  return !["/account/login", "/account/register", "/account/forgot", "/account/reset", "/account/verify"].some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!process.env.AUTH_SECRET) {
    const adminLocked = path.startsWith("/admin") && path !== "/admin/login";
    const accountLocked = (path.startsWith("/account") && isPrivateAccount(path)) || path === "/wishlist";
    if (adminLocked || accountLocked) {
      const url = new URL(path.startsWith("/admin") ? "/admin/login" : "/account/login", request.nextUrl);
      url.searchParams.set("error", "config");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  return handle(request, { params: Promise.resolve({}) });
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/wishlist"],
};
