const CACHE_NAME = "revyne-ai-v20260518-2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=20260518-2",
  "/app.js?v=20260518-2",
  "/supabase-config.js?v=20260518-2",
  "/manifest.webmanifest?v=20260514-1",
  "/assets/favicon.png?v=20260514-1",
  "/assets/vendor/qrcode-generator.js?v=20260514-1",
  "/robots.txt",
  "/sitemap.xml",
  "/assets/revyne-icon-192.png",
  "/assets/revyne-icon-512.png",
  "/assets/screenshot-mobile.png",
  "/assets/screenshot-wide.png"
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

// Paths that must never be served from cache (auth state, API, service worker itself).
const BYPASS_CACHE_PATHS = ["/api/", "/auth/", "/.well-known/", "/sw.js"];

// Only cache static assets — JS, CSS, fonts, images, the app shell.
// Anything that could carry session/pricing state is served fresh.
function isCacheable(request, url) {
  if (!url || url.origin !== self.location.origin) return false;
  if (BYPASS_CACHE_PATHS.some((p) => url.pathname.startsWith(p))) return false;
  // Skip if the server explicitly opts out of caching
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(request, url) && response.ok) {
          // Don't cache responses that carry no-store / no-cache directives
          const cc = response.headers.get("cache-control") || "";
          if (!cc.includes("no-store") && !cc.includes("no-cache")) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }
        if (sameOrigin && !response.ok) {
          // Network returned an error — try the cache, then fall back to index.html for navigation
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            const accept = request.headers.get("accept") || "";
            if (accept.includes("text/html")) return caches.match("/index.html");
            return response;
          });
        }
        return response;
      })
      .catch(() => {
        if (!sameOrigin) return Response.error();
        return caches.match(request).then((cached) => cached || caches.match("/index.html"));
      })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "revyne-background-sync") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "revyne-refresh") {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}));
  }
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "RevYne";
  const options = {
    body: data.body || "You have a RevYne update.",
    icon: "/assets/revyne-icon-192.png",
    badge: "/assets/favicon.png",
    data: {
      url: data.url || "/"
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    })
  );
});
