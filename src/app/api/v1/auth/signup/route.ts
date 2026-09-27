import { NextResponse } from "next/server";
import { api, body } from "@/server/http";
import { signupSchema } from "@/lib/validation/schemas";
import { signup } from "@/server/services/auth.service";
import { withSessionCookie } from "@/server/auth/cookies";

export const POST = api(
  async ({ req }) => {
    const input = await body(req, signupSchema);
    const user = await signup(input);
    return withSessionCookie(NextResponse.json({ ok: true, next: "/onboarding" }), user.id, req.headers.get("user-agent"));
  },
  { auth: false, rate: { limit: 10, windowSec: 60, key: "auth" } },
);
