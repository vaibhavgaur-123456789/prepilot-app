import { NextResponse, type NextRequest } from "next/server";
import { REFERRAL_COOKIE } from "@/server/services/referral.service";

/** Invite link (/r/K7M2QX): remember the code for 30 days, then open the sign-up page. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const res = NextResponse.redirect(new URL("/signup", req.url));
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  if (clean) res.cookies.set(REFERRAL_COOKIE, clean, { maxAge: 30 * 86_400, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return res;
}
