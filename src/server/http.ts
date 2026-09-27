import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import type { User } from "@prisma/client";
import { AppError, forbidden, unauthorized } from "@/server/errors";
import { resolveSession, SESSION_COOKIE } from "@/server/auth/session";
import { rateLimit } from "@/server/rate-limit";

export interface HandlerCtx<P> {
  req: NextRequest;
  user: User;
  params: P;
}

interface Options {
  auth?: boolean;
  admin?: boolean;
  /** requests per window per user (or IP when unauthenticated) */
  rate?: { limit: number; windowSec: number; key?: string };
}

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function tokenFrom(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);
  return req.cookies.get(SESSION_COOKIE)?.value;
}

/** Same-origin check for state-changing requests (CSRF defence on top of SameSite cookies). */
function checkOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (mobile app with bearer token)
  const allowed = new Set([new URL(req.url).origin, process.env.APP_URL ? new URL(process.env.APP_URL).origin : ""]);
  const host = req.headers.get("host");
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }
  if (!allowed.has(origin)) throw forbidden();
}

export function errorResponse(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json({ error: { code: "VALIDATION", message: e.issues[0]?.message ?? "Invalid input", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } }, { status: 400 });
  }
  if (e instanceof AppError) {
    return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } }, { status: 500 });
}

export function api<P = Record<string, string>>(fn: (ctx: HandlerCtx<P>) => Promise<unknown>, opts: Options = { auth: true }) {
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    try {
      checkOrigin(req);
      let user: User | null = null;
      if (opts.auth !== false || opts.admin) {
        const s = await resolveSession(tokenFrom(req));
        if (!s) throw unauthorized();
        user = s.user;
        if (opts.admin && user.role !== "ADMIN") throw forbidden();
      }
      if (opts.rate) {
        const who = user?.id ?? clientIp(req);
        await rateLimit(`${opts.rate.key ?? new URL(req.url).pathname}:${who}`, opts.rate.limit, opts.rate.windowSec);
      }
      const result = await fn({ req, user: user as User, params: context?.params ? await context.params : ({} as P) });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function body<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError(400, "BAD_JSON", "Request body must be JSON.");
  }
  return schema.parse(raw);
}
