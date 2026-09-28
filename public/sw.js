// Service worker: installability, offline fallback, static-asset caching and push notifications.
// Pages are never cached (they are personal and may redirect), so a stale or someone else's page can never appear.
const VERSION = "pp-v2";
const SHELL = ["/offline", "/icon.svg", "/icons/192"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Push notifications (Web Push).
self.addEventListener("push", (e) => {
  let data = { title: "PrepPilot", body: "", href: "/" };
  try {
    data = { ...data, ...e.data.json() };
  } catch {
    /* plain text or empty push */
  }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/192", badge: "/icons/192", tag: data.tag, data: { href: data.href } }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const href = (e.notification.data && e.notification.data.href) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.navigate(href).then((w) => (w || c).focus()).catch(() => self.clients.openWindow(href));
      return self.clients.openWindow(href);
    }),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: always from the network (redirects handled by the browser). Offline → friendly page.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline").then((r) => r || Response.error())));
    return;
  }

  // Versioned static assets: cache-first, only successful responses are stored.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.svg") {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
  // Everything else (API calls etc.) goes straight to the network.
});
