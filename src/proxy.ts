import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/server/auth/session";

const PUBLIC = ["/login", "/signup", "/offline"];

/** Redirect signed-out visitors to /login. Full session checks (revocation, roles) happen server-side per request. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const sid = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!sid && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (sid && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes (they authenticate themselves), static files, and PWA assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|manifest.webmanifest|sw.js|icons/).*)"],
};
