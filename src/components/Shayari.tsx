"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client/api";
import { lineId, LANG_LABEL, MOODS, moodsOf, SHAYARI, type Mood, type ShayariLang } from "@/content/shayari";
import { useLang, useT } from "@/i18n/client";
import { cx, inputClass } from "./ui";

export type ShayariItem = { id: string; t: string; p: string; s: string; m: string; l: ShayariLang; custom?: boolean };

const SEEN = "rp_shayari_seen";
const FAVS = "rp_shayari_favs";

function readList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}
function writeList(key: string, v: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

/** Only called from click handlers, never during render. */
function randomOf<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

const local = (): ShayariItem[] => SHAYARI.map((x) => ({ id: lineId(x.t), t: x.t, p: x.p, s: x.s ?? "", m: x.m ?? "", l: x.l }));

function shareText(x: ShayariItem) {
  return `${x.t.split(" / ").join("\n")}\n— ${x.p}${x.s ? ` (${x.s})` : ""}`;
}

async function share(x: ShayariItem) {
  const text = shareText(x);
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  if (nav.share) return nav.share({ text }).catch(() => undefined);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function useFavs() {
  const [favs, setFavs] = useState<string[]>([]);
  // localStorage only exists after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFavs(readList(FAVS)), []);
  const toggle = (id: string) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [id, ...favs].slice(0, 500);
    setFavs(next);
    writeList(FAVS, next);
  };
  return { favs, toggle };
}

function Verse({ x, big = false }: { x: ShayariItem; big?: boolean }) {
  return (
    <blockquote className={cx("whitespace-pre-line font-medium leading-relaxed", big ? "text-lg" : "text-base")} lang={x.l === "en" ? "en" : "hi"}>
      {x.t.split(" / ").join("\n")}
    </blockquote>
  );
}

function Actions({ x, fav, onFav, onNext }: { x: ShayariItem; fav: boolean; onFav: () => void; onNext?: () => void }) {
  const t = useT();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
      <button type="button" onClick={onFav} aria-pressed={fav} className="press min-h-10 rounded-xl border border-border px-3 font-semibold">{fav ? "❤️" : "🤍"} {t("shayari.save")}</button>
      <button type="button" onClick={() => share(x)} className="press min-h-10 rounded-xl border border-border px-3 font-semibold">📤 {t("shayari.share")}</button>
      {onNext && <button type="button" onClick={onNext} className="press min-h-10 rounded-xl border border-border px-3 font-semibold">🔄 {t("shayari.another")}</button>}
    </div>
  );
}

/** One famous line, shown after a study session or paper to lift the mood. */
export function ShayariCard({ className }: { className?: string }) {
  const t = useT();
  const [x, setX] = useState<ShayariItem | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const { favs, toggle } = useFavs();

  async function next() {
    const seen = readList(SEEN);
    let line: ShayariItem | null = null;
    try {
      line = (await apiFetch<{ line: ShayariItem }>(`/api/v1/shayari?skip=${encodeURIComponent(seen.slice(0, 40).join(","))}`)).line;
    } catch {
      const pool = local().filter((l) => !seen.includes(l.id));
      const from = pool.length ? pool : local();
      line = from[Math.floor(Math.random() * from.length)];
    }
    if (!line) return;
    writeList(SEEN, [line.id, ...seen.filter((s) => s !== line!.id)].slice(0, 120));
    setShowMeaning(false);
    setX(line);
  }

  useEffect(() => {
    // Fetching the first line on mount is the point of this component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    next();
  }, []);

  if (!x) return <div className={cx("skeleton h-32 rounded-2xl", className)} />;
  return (
    <section className={cx("animate-in rounded-2xl border border-border bg-surface p-4 text-left shadow-[var(--shadow)]", className)} aria-label={t("shayari.forYou")}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">✨ {t("shayari.forYou")}</p>
      <div className="mt-2 border-l-4 border-[var(--accent)] pl-3">
        <Verse x={x} big />
        <p className="mt-2 text-sm font-semibold text-primary">— {x.p}{x.s ? <span className="font-normal text-muted"> · {x.s}</span> : null}</p>
      </div>
      {x.m && (showMeaning ? <p className="mt-2 rounded-xl bg-surface-2 p-2 text-sm">{x.m}</p> : <button type="button" className="mt-2 text-sm font-semibold text-primary" onClick={() => setShowMeaning(true)}>{t("shayari.meaning")}</button>)}
      <Actions x={x} fav={favs.includes(x.id)} onFav={() => toggle(x.id)} onNext={next} />
      <Link href="/shayari" className="mt-2 inline-block text-xs font-semibold text-muted underline">{t("shayari.all")}</Link>
    </section>
  );
}

/** The full collection: filter by language, poet, search or favourites. */
export function ShayariBrowser({ items, todayIndex, initialMood = null }: { items: ShayariItem[]; todayIndex: number; initialMood?: Mood | null }) {
  const t = useT();
  const lang = useLang();
  const { favs, toggle } = useFavs();
  const [filter, setFilter] = useState<"all" | "fav" | ShayariLang>("all");
  const [poet, setPoet] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(40);
  const byMood = useMemo(() => new Map(items.map((x) => [x.id, moodsOf(x)])), [items]);
  const inMood = (x: ShayariItem, md: Mood) => byMood.get(x.id)?.includes(md) ?? false;
  const [mood, setMood] = useState<Mood | null>(initialMood);
  // The first pick for a mood opened from a link is deterministic (no randomness during render).
  const [pick, setPick] = useState<ShayariItem | null>(() => (initialMood ? items.find((x) => inMood(x, initialMood)) ?? null : null));
  function chooseMood(md: Mood | null) {
    setMood(md);
    if (!md) return setPick(null);
    const pool = items.filter((x) => inMood(x, md) && x.id !== pick?.id);
    setPick(randomOf(pool));
  }

  const poets = useMemo(() => [...new Set(items.map((x) => x.p))].sort((a, b) => a.localeCompare(b)), [items]);
  const langs = useMemo(() => [...new Set(items.map((x) => x.l))], [items]);
  const list = items.filter((x) => (!mood || inMood(x, mood)) && (filter === "all" ? true : filter === "fav" ? favs.includes(x.id) : x.l === filter) && (!poet || x.p === poet) && (!q || `${x.t} ${x.p} ${x.m}`.toLowerCase().includes(q.toLowerCase())));
  const today = items.length ? items[todayIndex % items.length] : null;
  const moodInfo = MOODS.find((m) => m.key === mood);

  return (
    <div className="space-y-4">
      <section aria-label={t("shayari.howFeel")}>
        <p className="mb-2 text-sm font-semibold">{t("shayari.howFeel")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOODS.map((m) => (
            <button key={m.key} type="button" aria-pressed={mood === m.key} onClick={() => chooseMood(mood === m.key ? null : m.key)} className={cx("press flex min-h-12 items-center gap-2 rounded-2xl border px-3 text-left text-sm font-semibold", mood === m.key ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface")}>
              <span className="text-xl" aria-hidden>{m.emoji}</span>{m[lang]}
            </button>
          ))}
        </div>
      </section>

      {moodInfo && pick && (
        <section className="animate-in rounded-3xl border-2 border-primary bg-surface p-5" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{moodInfo.emoji} {t("shayari.forMood")}: {moodInfo[lang]}</p>
          <div className="mt-2"><Verse x={pick} big /></div>
          <p className="mt-2 text-sm font-semibold text-primary">— {pick.p}{pick.s ? <span className="font-normal text-muted"> · {pick.s}</span> : null}</p>
          {pick.m && <p className="mt-2 rounded-xl bg-surface-2 p-2 text-sm">{pick.m}</p>}
          <Actions x={pick} fav={favs.includes(pick.id)} onFav={() => toggle(pick.id)} onNext={() => chooseMood(moodInfo.key)} />
        </section>
      )}

      {!mood && today && (
        <section className="bg-grad shadow-brand animate-in rounded-3xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">🌅 {t("shayari.today")}</p>
          <div className="mt-2"><Verse x={today} big /></div>
          <p className="mt-2 text-sm font-semibold text-white/90">— {today.p}{today.s ? ` · ${today.s}` : ""}</p>
          {today.m && <p className="mt-2 text-sm text-white/85">{today.m}</p>}
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {(["all", "fav", ...langs] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold", filter === f ? "border-primary bg-primary-soft text-primary" : "border-border")}>
            {f === "all" ? `${t("shayari.allTab")} (${items.length})` : f === "fav" ? `❤️ ${t("shayari.saved")} (${favs.length})` : LANG_LABEL[f][lang]}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClass} placeholder={t("shayari.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("shayari.search")} />
        <select className={inputClass} value={poet} onChange={(e) => setPoet(e.target.value)} aria-label={t("shayari.poet")}>
          <option value="">{t("shayari.allPoets")}</option>
          {poets.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{filter === "fav" ? t("shayari.noSaved") : t("shayari.none")}</p>
      ) : (
        <ul className="stagger space-y-3">
          {list.slice(0, limit).map((x) => (
            <li key={x.id} className="rounded-2xl border border-border bg-surface p-4">
              <Verse x={x} />
              <p className="mt-2 text-sm font-semibold text-primary">— {x.p}{x.s ? <span className="font-normal text-muted"> · {x.s}</span> : null}</p>
              {x.m && (open === x.id ? <p className="mt-2 rounded-xl bg-surface-2 p-2 text-sm">{x.m}</p> : <button type="button" className="mt-1 text-sm font-semibold text-primary" onClick={() => setOpen(x.id)}>{t("shayari.meaning")}</button>)}
              <Actions x={x} fav={favs.includes(x.id)} onFav={() => toggle(x.id)} />
            </li>
          ))}
        </ul>
      )}
      {list.length > limit && <button type="button" className="press min-h-11 w-full rounded-xl border border-border text-sm font-semibold" onClick={() => setLimit((l) => l + 40)}>{t("shayari.more")}</button>}
      <p className="text-xs text-muted">{t("shayari.note")}</p>
    </div>
  );
}
