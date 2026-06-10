// Vercel Edge Middleware — SEO meta injection
// Intercepts restaurant and menu-item URL requests before the catch-all rewrite fires.
// Fetches lightweight meta from the backend and injects unique title/canonical/OG tags
// into the SPA shell HTML so crawlers see page-specific content.
// On any failure, falls through to normal Vercel routing (no regression from baseline).

const BACKEND = "https://menubloc-backend-production.up.railway.app";
const ORIGIN = "https://menuply.com";

const RESTAURANT_MENU_RE = /^\/restaurants\/([^/]+)\/menu\/?$/;
const RESTAURANT_PROFILE_RE = /^\/restaurants\/([^/]+)\/?$/;
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

function buildRestaurantMenuMeta(data) {
  const name = escapeHtml(data.name);
  const title = `${name} — Menu | Menuply`;
  const hasLocation = data.city && data.state;
  const description = hasLocation
    ? `Browse the full ${name} menu in ${escapeHtml(data.city)}, ${escapeHtml(data.state)}. View dishes, nutrition insights, and deals on Menuply.`
    : `Browse the full ${name} menu. View dishes, nutrition insights, and deals on Menuply.`;
  const canonical = data.slug
    ? `${ORIGIN}/restaurants/${data.slug}/menu`
    : `${ORIGIN}/public/restaurants/${data.id}/menu`;
  return { title, description, canonical };
}

function buildRestaurantProfileMeta(data) {
  const name = escapeHtml(data.name);
  const title = `${name} | Menuply`;
  const hasLocation = data.city && data.state;
  const description = hasLocation
    ? `Explore ${name} in ${escapeHtml(data.city)}, ${escapeHtml(data.state)}. View the full menu, nutrition insights, and deals on Menuply.`
    : `Explore ${name}. View the full menu, nutrition insights, and deals on Menuply.`;
  const canonical = data.slug
    ? `${ORIGIN}/restaurants/${data.slug}`
    : `${ORIGIN}/public/restaurants/${data.id}`;
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

  // --- /restaurants/:param/menu ---
  let m = RESTAURANT_MENU_RE.exec(pathname);
  if (m) {
    const param = m[1];
    const isNumeric = /^\d+$/.test(param);
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/restaurants/${encodeURIComponent(param)}`),
    ]);
    if (!meta || !meta.ok) return;
    if (isNumeric && meta.data.slug) {
      return Response.redirect(`${ORIGIN}/restaurants/${meta.data.slug}/menu`, 301);
    }
    if (!shell) return;
    const { title, description, canonical } = buildRestaurantMenuMeta(meta.data);
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- /restaurants/:param (profile) ---
  m = RESTAURANT_PROFILE_RE.exec(pathname);
  if (m) {
    const param = m[1];
    const isNumeric = /^\d+$/.test(param);
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/restaurants/${encodeURIComponent(param)}`),
    ]);
    if (!meta || !meta.ok) return;
    if (isNumeric && meta.data.slug) {
      return Response.redirect(`${ORIGIN}/restaurants/${meta.data.slug}`, 301);
    }
    if (!shell) return;
    const { title, description, canonical } = buildRestaurantProfileMeta(meta.data);
    return injectedResponse(injectMeta(shell, title, description, canonical));
  }

  // --- /public/restaurants/:id/menu (legacy numeric) ---
  m = LEGACY_NUMERIC_RE.exec(pathname);
  if (m) {
    const id = m[1];
    const meta = await fetchMeta(`/public/meta/restaurants/${id}`);
    if (!meta || !meta.ok) return;
    if (meta.data.slug) {
      return Response.redirect(`${ORIGIN}/restaurants/${meta.data.slug}/menu`, 301);
    }
    // No slug — inject meta with numeric canonical
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const { title, description, canonical } = buildRestaurantMenuMeta(meta.data);
    return injectedResponse(injectMeta(shell, title, description, canonical));
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
