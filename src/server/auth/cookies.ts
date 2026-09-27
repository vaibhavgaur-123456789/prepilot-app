import { NextResponse } from "next/server";
import { cookieOptions, createSession, SESSION_COOKIE } from "./session";

export async function withSessionCookie(res: NextResponse, userId: string, userAgent: string | null) {
  const { token, expiresAt } = await createSession(userId, userAgent);
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
  return res;
}

export function googleEnabled() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
