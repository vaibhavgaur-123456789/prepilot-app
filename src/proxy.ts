import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/server/auth/session";

// Pages anyone (and search engines) can open without signing in.
const PUBLIC = ["/welcome", "/login", "/signup", "/offline", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/twitter-image", "/.well-known", "/privacy"];

/** Signed-out visitors: "/" shows the public landing page; other private pages go to /login. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)) ||
    /^\/google[0-9a-f]+\.html$/.test(pathname); // Google Search Console verification file
  const sid = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!sid && !isPublic) {
    const url = req.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/welcome";
      url.search = "";
    } else {
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
    }
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
