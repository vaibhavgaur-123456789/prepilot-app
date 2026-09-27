import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSession, SESSION_COOKIE } from "./session";

/** For server components/pages. */
export async function getCurrentUser() {
  const store = await cookies();
  const s = await resolveSession(store.get(SESSION_COOKIE)?.value);
  return s?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Signed in AND onboarded (has a study profile). */
export async function requireStudent() {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
