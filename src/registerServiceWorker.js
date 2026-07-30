export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && window.location.hostname !== "localhost") return;

  window.addEventListener("load", () => {
    // Consumer-only cleanup/network SW. Operator tablet registers its own
    // worker at /operator/service-worker.js with /operator/ scope.
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // PWA support is progressive; registration failure should not block the app.
    });
  });
}
