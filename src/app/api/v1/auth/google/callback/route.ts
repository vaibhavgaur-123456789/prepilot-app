import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { googleEnabled, withSessionCookie } from "@/server/auth/cookies";
import { upsertGoogleUser } from "@/server/services/auth.service";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: NextRequest) {
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
  if (!googleEnabled()) return fail("google_disabled");
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = req.cookies.get("pp_oauth_state")?.value;
  const verifier = req.cookies.get("pp_oauth_verifier")?.value;
  if (!code || !state || !expected || !verifier || !safeEqual(state, expected)) return fail("google_state");

  try {
    const base = process.env.APP_URL ?? url.origin;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${base}/api/v1/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenRes.ok) return fail("google_token");
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) return fail("google_token");
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${access_token}` } });
    if (!infoRes.ok) return fail("google_profile");
    const info = (await infoRes.json()) as { sub: string; email: string; email_verified: boolean; name?: string };
    const user = await upsertGoogleUser({ sub: info.sub, email: info.email, name: info.name ?? "", emailVerified: !!info.email_verified });
    const res = NextResponse.redirect(new URL(user.onboardedAt ? "/" : "/onboarding", req.url));
    res.cookies.delete("pp_oauth_state");
    res.cookies.delete("pp_oauth_verifier");
    return withSessionCookie(res, user.id, req.headers.get("user-agent"));
  } catch {
    return fail("google_failed");
  }
}
