/**
 * One-shot cleanup worker for browsers still controlled by the historic root Operator SW.
 * Unregisters itself after deleting operator caches. Consumer app no longer keeps a SW registered.
 */
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
          .filter((key) => key.startsWith("menuply-operator-pwa") || key.startsWith("menuply-consumer-pwa"))
          .map((key) => caches.delete(key))
      );
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch {
          // ignore
        }
      }
    })()
  );
});
