/**
 * The SEO Bot's list of page types (public/seo-pages.json) vs the routes in src/App.jsx.
 * Shared by the post-build step (scripts/buildSeoPages.mjs) and its contract test.
 */

/** Top-level routes in App.jsx (nested relative routes belong to their parent). */
export function appRoutes(appSource) {
  return [...new Set([...String(appSource).matchAll(/\bpath="(\/[^"]*|\*)"/g)].map((m) => m[1]))];
}

export function covers(entry, route) {
  if (entry.route === route) return true;
  if (entry.route.endsWith("/*")) {
    const base = entry.route.slice(0, -2);
    return route === base || route.startsWith(`${base}/`);
  }
  return false;
}

/** Routes no catalog line covers. */
export function unlistedRoutes(catalog, routes) {
  return routes.filter((r) => !catalog.pages.some((e) => covers(e, r)));
}

/**
 * The catalog as published: every unlisted route is added as kind "new" so the SEO
 * Bot checks it and asks for a decision (in Google or not) instead of skipping it.
 */
export function withNewRoutes(catalog, routes) {
  const missing = unlistedRoutes(catalog, routes);
  return {
    ...catalog,
    pages: [
      ...catalog.pages,
      ...missing.map((route) => ({ route, kind: "new", label: route, added_by: "build" })),
    ],
  };
}
