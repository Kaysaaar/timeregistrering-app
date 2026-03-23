/* Simple “cache-first” PWA service worker for GitHub Pages wrapper */
const CACHE_NAME = "timer-wrapper-v2026-03-23";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./sw.js"
];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch:
// - Wrapper files: cache-first
// - Everything else (incl. Apps Script iframe): network-first (don’t cache cross-site)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== "GET") return;

  // Same-origin = your GitHub Pages domain
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    // Cache-first for wrapper assets
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((resp) => {
          // cache a copy
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return resp;
        });
      })
    );
    return;
  }

  // Cross-origin (e.g. script.google.com): network-first (don’t cache)
  event.respondWith(
    fetch(req).catch(() => caches.match("./"))
  );
});
