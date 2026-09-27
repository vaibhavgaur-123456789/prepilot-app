// PrepPilot service worker: app shell + today's data available offline.
const VERSION = "pp-v1";
const SHELL = ["/offline", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // mutations go through the in-app outbox
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
    return;
  }

  // Today's plan data and app pages: network-first, fall back to the last cached copy.
  const cacheable = url.pathname === "/api/v1/today" || url.pathname === "/api/v1/plan" || req.mode === "navigate";
  if (!cacheable || url.pathname.startsWith("/api/v1/auth")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/offline") : new Response(JSON.stringify({ error: { code: "OFFLINE", message: "Offline" } }), { status: 503, headers: { "content-type": "application/json" } })))),
  );
});
