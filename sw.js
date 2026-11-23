/* Service Worker: macht die Seite offline spielbar. Version erhöhen, wenn sich Dateien ändern. */
const VERSION = "fynnomenal-v2.0.0";
const ASSETS = [
  "./", "index.html", "datenschutz.html", "404.html", "css/main.css",
  "js/physics.js", "js/data.js", "js/fx.js", "js/audio.js", "js/store.js", "js/card.js", "js/game.js", "js/main.js",
  "fonts/bebas-neue-latin.woff2", "fonts/inter-latin-var.woff2",
  "icons/favicon.svg", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Netzwerk zuerst (immer aktuell), Cache als Fallback (offline). */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
