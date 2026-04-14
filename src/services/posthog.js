import posthog from "posthog-js";

let isInitialized = false;

export function initPostHog() {
  if (isInitialized) return;

  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;

  if (!key) {
    console.warn("PostHog key missing");
    return;
  }

  posthog.init(key, {
    api_host: host || "https://app.posthog.com",
    capture_pageview: false,
    autocapture: true,
  });

  isInitialized = true;
}

export function captureEvent(event, properties = {}) {
  if (!isInitialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId, traits = {}) {
  if (!isInitialized) return;
  posthog.identify(userId, traits);
}

export default posthog;
