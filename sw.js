const CACHE_NAME = "revyne-ai-v20260430-8";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=20260430-8",
  "/app.js?v=20260430-8",
  "/supabase-config.js?v=20260430-8",
  "/manifest.webmanifest?v=20260430-8",
  "/assets/favicon.png?v=20260430-8",
  "/assets/revyne-icon-192.png",
  "/assets/revyne-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
