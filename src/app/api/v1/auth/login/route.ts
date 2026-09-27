import { NextResponse } from "next/server";
import { api, body } from "@/server/http";
import { loginSchema } from "@/lib/validation/schemas";
import { login } from "@/server/services/auth.service";
import { withSessionCookie } from "@/server/auth/cookies";

export const POST = api(
  async ({ req }) => {
    const { email, password } = await body(req, loginSchema);
    const user = await login(email, password);
    return withSessionCookie(NextResponse.json({ ok: true, next: user.onboardedAt ? "/" : "/onboarding" }), user.id, req.headers.get("user-agent"));
  },
  { auth: false, rate: { limit: 10, windowSec: 60, key: "auth" } },
);
