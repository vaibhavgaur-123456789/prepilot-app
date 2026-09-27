import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { errorResponse } from "@/server/http";
import { runNotificationSweep } from "@/server/services/notifications.service";
import { aggregateBenchmarks } from "@/server/services/benchmark.service";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || !got) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Scheduled jobs: /api/v1/cron/notifications | /api/v1/cron/benchmarks with Authorization: Bearer $CRON_SECRET.
 * GET is what Vercel Cron sends; POST works for any other scheduler (e.g. cron-job.org).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ job: string }> }) {
  return POST(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ job: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret." } }, { status: 401 });
  try {
    const { job } = await ctx.params;
    if (job === "notifications") return NextResponse.json(await runNotificationSweep());
    if (job === "benchmarks") return NextResponse.json({ published: await aggregateBenchmarks() });
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Unknown job." } }, { status: 404 });
  } catch (e) {
    return errorResponse(e);
  }
}
