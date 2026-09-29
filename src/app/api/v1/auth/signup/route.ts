import { NextResponse } from "next/server";
import { api, body } from "@/server/http";
import { signupSchema } from "@/lib/validation/schemas";
import { signup } from "@/server/services/auth.service";
import { attachReferrer, REFERRAL_COOKIE } from "@/server/services/referral.service";
import { withSessionCookie } from "@/server/auth/cookies";

export const POST = api(
  async ({ req }) => {
    const input = await body(req, signupSchema);
    const user = await signup(input);
    // Invited by a friend (/r/<code> sets this cookie)? Remember it; both get XP after setup.
    await attachReferrer(user.id, req.cookies.get(REFERRAL_COOKIE)?.value).catch(() => undefined);
    const res = withSessionCookie(NextResponse.json({ ok: true, next: "/onboarding" }), user.id, req.headers.get("user-agent"));
    return res;
  },
  { auth: false, rate: { limit: 10, windowSec: 60, key: "auth" } },
);
