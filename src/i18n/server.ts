import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/server/auth/guards";
import { isLang, translate, type Key, type Lang } from "./dict";

export const LANG_COOKIE = "pp_lang";

/** Signed-in: the profile language. Otherwise: cookie, then browser language. */
export async function getLang(): Promise<Lang> {
  const user = await getCurrentUser().catch(() => null);
  if (user && isLang(user.language)) return user.language;
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("hi") ? "hi" : "en";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars) };
}
