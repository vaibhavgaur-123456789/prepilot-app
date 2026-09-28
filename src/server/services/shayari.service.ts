import { prisma } from "@/server/db";
import { badRequest } from "@/server/errors";
import { lineId, SHAYARI, type ShayariLang } from "@/content/shayari";

export interface ShayariView {
  id: string;
  t: string;
  p: string;
  s: string;
  m: string;
  l: ShayariLang;
  custom: boolean;
}

const LANGS: ShayariLang[] = ["hi", "ur", "sa", "en", "bn"];
const asLang = (l: string): ShayariLang => (LANGS.includes(l as ShayariLang) ? (l as ShayariLang) : "hi");

/** Built-in lines plus the admin's additions. */
export async function allShayari(): Promise<ShayariView[]> {
  const extra = await prisma.shayari.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  return [
    ...SHAYARI.map((x) => ({ id: lineId(x.t), t: x.t, p: x.p, s: x.s ?? "", m: x.m ?? "", l: x.l, custom: false })),
    ...extra.map((x) => ({ id: x.id, t: x.text, p: x.poet, s: x.source, m: x.meaning, l: asLang(x.lang), custom: true })),
  ];
}

export async function randomShayari(exclude: string[] = []) {
  const all = await allShayari();
  const skip = new Set(exclude);
  const pool = all.filter((x) => !skip.has(x.id));
  const from = pool.length ? pool : all;
  return from[Math.floor(Math.random() * from.length)];
}

// ── Admin ──

export async function adminListShayari() {
  return prisma.shayari.findMany({ orderBy: { createdAt: "desc" } });
}

/**
 * Bulk add. One line per entry: `text || poet || source || meaning`, with " / " between verses.
 * The poet is required: every line must belong to a real, named poet.
 */
export async function adminAddShayari(raw: string, lang: ShayariLang) {
  const rows = raw.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  if (rows.length === 0) throw badRequest("Paste at least one line.");
  if (rows.length > 2000) throw badRequest("Add up to 2000 lines at a time.");
  const existing = new Set((await allShayari()).map((x) => x.t.replace(/\s+/g, " ")));
  const data: { text: string; poet: string; source: string; meaning: string; lang: string }[] = [];
  const skipped: string[] = [];
  for (const r of rows) {
    const [text = "", poet = "", source = "", meaning = ""] = r.split("||").map((x) => x.trim());
    const norm = text.replace(/\s+/g, " ");
    if (!text || !poet) {
      skipped.push(`${r.slice(0, 40)}… (poet missing)`);
      continue;
    }
    if (existing.has(norm)) {
      skipped.push(`${r.slice(0, 40)}… (already added)`);
      continue;
    }
    existing.add(norm);
    data.push({ text: text.slice(0, 1000), poet: poet.slice(0, 120), source: source.slice(0, 200), meaning: meaning.slice(0, 1000), lang });
  }
  if (data.length) await prisma.shayari.createMany({ data });
  return { added: data.length, skipped };
}

export async function adminSetShayari(id: string, active: boolean) {
  await prisma.shayari.update({ where: { id }, data: { active } });
}

export async function adminDeleteShayari(id: string) {
  await prisma.shayari.deleteMany({ where: { id } });
}
