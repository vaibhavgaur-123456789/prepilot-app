import { prisma, isUniqueViolation } from "@/server/db";
import { dayKey } from "@/lib/engine/dates";
import { newCode, normalizeCode } from "./classroom.service";
import { awardXp } from "./gamification.service";

export const REFERRAL_COOKIE = "rp_ref";
const REFERRAL_XP = 100;

/** The student's invite code (created the first time it's needed) and how many friends joined. */
export async function myReferral(userId: string) {
  let user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  for (let i = 0; !user.referralCode && i < 5; i++) {
    try {
      user = await prisma.user.update({ where: { id: userId }, data: { referralCode: newCode() }, select: { referralCode: true } });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  const [invited, joined] = await Promise.all([
    prisma.user.count({ where: { referredById: userId } }),
    prisma.user.count({ where: { referredById: userId, onboardedAt: { not: null } } }),
  ]);
  return { code: user.referralCode!, invited, joined };
}

/** Remember who invited a new account (called right after signup). */
export async function attachReferrer(newUserId: string, rawCode: string | undefined) {
  if (!rawCode) return;
  const inviter = await prisma.user.findUnique({ where: { referralCode: normalizeCode(rawCode) }, select: { id: true } });
  if (!inviter || inviter.id === newUserId) return;
  await prisma.user.updateMany({ where: { id: newUserId, referredById: null }, data: { referredById: inviter.id } });
}

/** When an invited friend finishes setup, both get XP (once). */
export async function rewardReferral(userId: string, now = new Date()) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referredById: true, timezone: true, name: true } });
  if (!u?.referredById) return;
  const inviter = await prisma.user.findUnique({ where: { id: u.referredById }, select: { id: true, timezone: true } });
  if (!inviter) return;
  await awardXp(inviter.id, dayKey(now, inviter.timezone), [{ type: "ACHIEVEMENT", amount: REFERRAL_XP, reason: `${u.name.split(" ")[0]} joined with your invite`, dedupeKey: `referral:${userId}` }]);
  await awardXp(userId, dayKey(now, u.timezone), [{ type: "ACHIEVEMENT", amount: REFERRAL_XP, reason: "Joined with a friend's invite", dedupeKey: "referral:joined" }]);
}
