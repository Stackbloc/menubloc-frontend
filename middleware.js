// Vercel Edge Middleware — SEO meta injection
// Intercepts restaurant and menu-item URL requests before the catch-all rewrite fires.
// Fetches lightweight meta from the backend and injects unique title/canonical/OG tags
// into the SPA shell HTML so crawlers see page-specific content.
// On any failure, falls through to normal Vercel routing (no regression from baseline).

const BACKEND = "https://menubloc-backend-production.up.railway.app";
const ORIGIN = "https://menuply.com";

// Canonical 3-segment: /restaurants/:state/:city/:slug[/menu]
const CANONICAL_MENU_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/menu\/?$/;
const CANONICAL_PROFILE_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
// Legacy 1-segment: /restaurants/:slug[/menu]
const RESTAURANT_MENU_RE = /^\/restaurants\/([^/]+)\/menu\/?$/;
const RESTAURANT_PROFILE_RE = /^\/restaurants\/([^/]+)\/?$/;
// Legacy numeric from public path
const LEGACY_NUMERIC_RE = /^\/public\/restaurants\/(\d+)\/menu\/?$/;
const MENU_ITEM_RE = /^\/menu-items\/(\d+)\/?$/;

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectMeta(html, title, description, canonical) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  // canonical is constructed by the middleware — not from user data — so no escaping needed
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"[^>]*>/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta name="description" content="[^"]*"[^>]*>/, `<meta name="description" content="${d}">`)
    .replace(/<meta property="og:title" content="[^"]*"[^>]*>/, `<meta property="og:title" content="${t}">`)
    .replace(/<meta property="og:description" content="[^"]*"[^>]*>/, `<meta property="og:description" content="${d}">`)
    .replace(/<meta property="og:url" content="[^"]*"[^>]*>/, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/, `<meta name="twitter:title" content="${t}">`)
    .replace(/<meta name="twitter:description" content="[^"]*"[^>]*>/, `<meta name="twitter:description" content="${d}">`);
}

async function fetchShell(requestUrl) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2000);
  try {
    const res = await fetch(new URL("/", requestUrl).toString(), { signal: ac.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMeta(path) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 3000);
  try {
    const res = await fetch(`${BACKEND}${path}`, { signal: ac.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// STATE_NAMES: 2-letter code → full lowercase state slug (mirrors src/lib/slugs.js)
const STATE_NAMES = {
  AL:"alabama",AK:"alaska",AZ:"arizona",AR:"arkansas",CA:"california",CO:"colorado",
  CT:"connecticut",DE:"delaware",FL:"florida",GA:"georgia",HI:"hawaii",ID:"idaho",
  IL:"illinois",IN:"indiana",IA:"iowa",KS:"kansas",KY:"kentucky",LA:"louisiana",
  ME:"maine",MD:"maryland",MA:"massachusetts",MI:"michigan",MN:"minnesota",MS:"mississippi",
  MO:"missouri",MT:"montana",NE:"nebraska",NV:"nevada",NH:"new-hampshire",NJ:"new-jersey",
  NM:"new-mexico",NY:"new-york",NC:"north-carolina",ND:"north-dakota",OH:"ohio",OK:"oklahoma",
  OR:"oregon",PA:"pennsylvania",RI:"rhode-island",SC:"south-carolina",SD:"south-dakota",
  TN:"tennessee",TX:"texas",UT:"utah",VT:"vermont",VA:"virginia",WA:"washington",
  WV:"west-virginia",WI:"wisconsin",WY:"wyoming",DC:"district-of-columbia",
};

function toSlugMW(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/['''""`]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80);
}

function toStateSlugMW(code) {
  if (!code) return "";
  const upper = String(code).trim().toUpperCase();
  return STATE_NAMES[upper] || toSlugMW(code);
}

// Returns the canonical path for a restaurant given DB data ({slug, city, state, id}).
function buildCanonicalRestaurantPath(data, suffix = "") {
  if (data.slug && data.city && data.state) {
    const stateSlug = data.state.length === 2 ? toStateSlugMW(data.state) : toSlugMW(data.state);
    const citySlug = toSlugMW(data.city);
    return `${ORIGIN}/restaurants/${stateSlug}/${citySlug}/${data.slug}${suffix}`;
  }
  // Fallback to legacy 1-segment slug or numeric ID
  if (data.slug) return `${ORIGIN}/restaurants/${data.slug}${suffix}`;
  if (suffix === "/menu") return `${ORIGIN}/public/restaurants/${data.id}/menu`;
  return `${ORIGIN}/public/restaurants/${data.id}`;
}

function buildRestaurantMenuMeta(data) {
  const name = escapeHtml(data.name);
  const title = `${name} — Menu | Menuply`;
  const hasLocation = data.city && data.state;
  const description = hasLocation
    ? `Browse the full ${name} menu in ${escapeHtml(data.city)}, ${escapeHtml(data.state)}. View dishes, nutrition insights, and deals on Menuply.`
    : `Browse the full ${name} menu. View dishes, nutrition insights, and deals on Menuply.`;
  const canonical = buildCanonicalRestaurantPath(data, "/menu");
  return { title, description, canonical };
}

function buildRestaurantProfileMeta(data) {
  const name = escapeHtml(data.name);
  const title = `${name} | Menuply`;
  const hasLocation = data.city && data.state;
  const description = hasLocation
    ? `Explore ${name} in ${escapeHtml(data.city)}, ${escapeHtml(data.state)}. View the full menu, nutrition insights, and deals on Menuply.`
    : `Explore ${name}. View the full menu, nutrition insights, and deals on Menuply.`;
  const canonical = buildCanonicalRestaurantPath(data);
  return { title, description, canonical };
}

function buildMenuItemMeta(data, itemId) {
  const itemName = escapeHtml(data.name);
  const hasRestaurant = data.restaurant_name != null;
  const hasLocation = data.city && data.state;
  const title = hasRestaurant
    ? `${itemName} at ${escapeHtml(data.restaurant_name)} | Menuply`
    : `${itemName} | Menuply`;
  const description = hasRestaurant && hasLocation
    ? `See price, nutrition breakdown, and menu details for ${itemName} at ${escapeHtml(data.restaurant_name)} in ${escapeHtml(data.city)}, ${escapeHtml(data.state)} on Menuply.`
    : `View nutrition facts and menu details for ${itemName} on Menuply.`;
  const canonical = `${ORIGIN}/menu-items/${itemId}`;
  return { title, description, canonical };
}

function injectedResponse(html) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-SEO-Middleware": "injected",
    },
  });
}

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  // --- Canonical 3-segment: /restaurants/:state/:city/:slug/menu ---
  let m = CANONICAL_MENU_RE.exec(pathname);
  if (m) {
    const slug = m[3];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/restaurants/${encodeURIComponent(slug)}`),
    ]);
    if (!shell || !meta || !meta.ok) return;
    const { title, description, canonical } = buildRestaurantMenuMeta(meta.data);
    // Geographic validation: URL state/city must match DB data — redirect if not
    if (canonical !== `${ORIGIN}${pathname}`) {
      return Response.redirect(canonical, 301);
    }
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- Canonical 3-segment: /restaurants/:state/:city/:slug (profile) ---
  m = CANONICAL_PROFILE_RE.exec(pathname);
  if (m) {
    const slug = m[3];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/restaurants/${encodeURIComponent(slug)}`),
    ]);
    if (!shell || !meta || !meta.ok) return;
    const { title, description, canonical } = buildRestaurantProfileMeta(meta.data);
    // Geographic validation: URL state/city must match DB data — redirect if not
    if (canonical !== `${ORIGIN}${pathname}`) {
      return Response.redirect(canonical, 301);
    }
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- Legacy 1-segment: /restaurants/:slug/menu → redirect to canonical ---
  m = RESTAURANT_MENU_RE.exec(pathname);
  if (m) {
    const slug = m[1];
    const meta = await fetchMeta(`/public/meta/restaurants/${encodeURIComponent(slug)}`);
    if (!meta || !meta.ok) return;
    const canonical = buildCanonicalRestaurantPath(meta.data, "/menu");
    // Only redirect when the canonical differs from the current URL (avoids redirect loops)
    if (canonical !== `${ORIGIN}${pathname}`) {
      const search = new URL(request.url).search;
      return Response.redirect(canonical + search, 301);
    }
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const { title, description } = buildRestaurantMenuMeta(meta.data);
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- Legacy 1-segment: /restaurants/:slug (profile) → redirect to canonical ---
  m = RESTAURANT_PROFILE_RE.exec(pathname);
  if (m) {
    const slug = m[1];
    const meta = await fetchMeta(`/public/meta/restaurants/${encodeURIComponent(slug)}`);
    if (!meta || !meta.ok) return;
    const canonical = buildCanonicalRestaurantPath(meta.data);
    if (canonical !== `${ORIGIN}${pathname}`) {
      return Response.redirect(canonical, 301);
    }
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const { title, description } = buildRestaurantProfileMeta(meta.data);
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- /public/restaurants/:id/menu (legacy numeric) → redirect to canonical ---
  m = LEGACY_NUMERIC_RE.exec(pathname);
  if (m) {
    const id = m[1];
    const meta = await fetchMeta(`/public/meta/restaurants/${id}`);
    if (!meta || !meta.ok) return;
    const canonical = buildCanonicalRestaurantPath(meta.data, "/menu");
    return Response.redirect(canonical, 301);
  }

  // --- /menu-items/:id ---
  m = MENU_ITEM_RE.exec(pathname);
  if (m) {
    const id = m[1];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/menu-items/${id}`),
    ]);
    if (!shell || !meta || !meta.ok) return;
    const { title, description, canonical } = buildMenuItemMeta(meta.data, id);
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // Not a matched path — pass through to normal Vercel routing
}

export const config = {
  matcher: [
    "/restaurants/:path*",
    "/public/restaurants/:path*",
    "/menu-items/:path*",
  ],
};
