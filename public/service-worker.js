/**
 * Consumer site service worker.
 * Must NEVER precache Operator tablet icons/manifest or landscape orientation.
 * Also deletes the historic menuply-operator-pwa-* caches that poisoned consumer launch.
 */
const CONSUMER_SW_VERSION = "menuply-consumer-pwa-v2-cleanup";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("menuply-operator-pwa") ||
              (key.startsWith("menuply-") && key !== CONSUMER_SW_VERSION)
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Network-only — do not intercept/cache consumer navigations or icons.
self.addEventListener("fetch", () => {
  // intentionally empty: browser default network fetch
});
