import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import { Routes, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from "react-router-dom";

const isDevelopment = import.meta.env.DEV;
const dsn = String(import.meta.env.VITE_SENTRY_DSN || "").trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.reactRouterBrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    ...(isDevelopment ? [Sentry.replayIntegration()] : []),
  ],
  tracePropagationTargets: ["localhost", /^\//, /\.up\.railway\.app(?:\/|$)/],
  // Development stays exhaustive. Production sampling must be reduced after
  // the latency investigation establishes a representative baseline.
  tracesSampleRate: isDevelopment
    ? 1.0
    : Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1),
  replaysSessionSampleRate: isDevelopment ? 1.0 : 0,
  replaysOnErrorSampleRate: isDevelopment ? 1.0 : 0,
  sendDefaultPii: false,
});

export { Sentry };
export const SentryRoutes = Sentry.wrapReactRouterRouting(Routes);
