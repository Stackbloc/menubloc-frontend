/**
 * Consumer launch hygiene.
 * Historic Operator tablet PWA used scope "/" + landscape + X icons for the whole origin.
 * Before JS can paint, an installed web-app/splash can still flash that shell.
 * This runs on every consumer load to unregister root-scoped workers and wipe operator caches.
 * Operator tablet registers its own /operator/ scoped worker separately.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== "localhost") return;

  const purge = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (registration) => {
          const scopePath = new URL(registration.scope).pathname;
          // Keep only workers scoped under /operator/
          if (scopePath === "/" || scopePath === "") {
            await registration.unregister();
          }
        })
      );
    } catch {
      // ignore
    }

    try {
      if (!caches?.keys) return;
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("menuply-operator-pwa") ||
              key.startsWith("menuply-consumer-pwa") ||
              key.includes("operator-pwa")
          )
          .map((key) => caches.delete(key))
      );
    } catch {
      // ignore
    }
  };

  // Run ASAP (not only on load) so poisoned SW loses control sooner.
  void purge();
  window.addEventListener("load", () => {
    void purge();
  });
}
