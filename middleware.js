// Vercel Edge Middleware — SEO meta injection
// Intercepts restaurant and menu-item URL requests before the catch-all rewrite fires.
// Fetches lightweight meta from the backend and injects unique title/canonical/OG tags
// into the SPA shell HTML so crawlers see page-specific content.
// On any failure, falls through to normal Vercel routing (no regression from baseline).

import {
  absoluteCanonicalUrl,
  cityPath,
  restaurantMenuPath,
  restaurantPath,
} from "./src/lib/canonicalUrlCore.js";
import { clusterPath } from "./src/lib/clusterUrl.js";
import { getClusterSeoContent } from "./src/lib/clusterSeoContent.js";
import { INDEXABLE_STATIC_PAGES } from "./src/lib/sitemapConfig.js";
import {
  destinationVenuePageJsonLd,
  menuItemPageJsonLd,
  restaurantPageJsonLd,
  toJsonLdScriptTag,
  videoWatchPageJsonLd,
} from "./src/lib/seo/jsonLdBuilders.js";

const BACKEND = "https://menubloc-backend-production.up.railway.app";
const ORIGIN = "https://menuply.com";

// Canonical 3-segment: /restaurants/:state/:city/:slug[/menu]
const CANONICAL_MENU_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/menu\/?$/;
const CANONICAL_PROFILE_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
// Legacy 1-segment: /restaurants/:slug[/menu]
const RESTAURANT_MENU_RE = /^\/restaurants\/([^/]+)\/menu\/?$/;
const RESTAURANT_PROFILE_RE = /^\/restaurants\/([^/]+)\/?$/;
// Consumer detail: /restaurants/:restaurantSlug/menu-items/:id
// MUST be matched before CANONICAL_PROFILE_RE — otherwise
// /restaurants/in-n-out-burger-3/menu-items/24862 is parsed as
// state=in-n-out-burger-3, city=menu-items, slug=24862 and 301s to
// whatever restaurant id 24862 is (e.g. Dunkin' Knoxville).
const RESTAURANT_MENU_ITEM_RE = /^\/restaurants\/([^/]+)\/menu-items\/([^/]+)\/?$/;
// Legacy numeric from public path
const LEGACY_NUMERIC_RE = /^\/public\/restaurants\/(\d+)\/menu\/?$/;
const MENU_ITEM_RE = /^\/menu-items\/(\d+)\/?$/;
const CLUSTER_RE = /^\/clusters\/([^/]+)\/([^/]+)\/([^/]+)\/?$/;
const CLUSTER_CITY_RE = /^\/clusters\/([^/]+)\/([^/]+)\/?$/;
const VIDEO_WATCH_RE = /^\/videos\/([a-z]+)\/(\d+)\/?$/;
const DESTINATION_VENUE_RE = /^\/destination-venues\/([^/]+)\/?$/;
const SITEMAP_CHUNK_RE = /^\/sitemaps\/sitemap-(\d+)\.xml$/;
const SITEMAP_LIMIT = 45000;

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectMeta(html, title, description, canonical, image) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  let next = html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"[^>]*>/, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta name="description" content="[^"]*"[^>]*>/, `<meta name="description" content="${d}">`)
    .replace(/<meta property="og:title" content="[^"]*"[^>]*>/, `<meta property="og:title" content="${t}">`)
    .replace(/<meta property="og:description" content="[^"]*"[^>]*>/, `<meta property="og:description" content="${d}">`)
    .replace(/<meta property="og:url" content="[^"]*"[^>]*>/, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta name="twitter:title" content="[^"]*"[^>]*>/, `<meta name="twitter:title" content="${t}">`)
    .replace(/<meta name="twitter:description" content="[^"]*"[^>]*>/, `<meta name="twitter:description" content="${d}">`);

  if (image) {
    const img = escapeHtml(image);
    next = next
      .replace(/<meta property="og:image" content="[^"]*"[^>]*>/, `<meta property="og:image" content="${img}">`)
      .replace(/<meta name="twitter:image" content="[^"]*"[^>]*>/, `<meta name="twitter:image" content="${img}">`);
  }

  return next;
}

function injectRobots(html, content) {
  const robots = escapeHtml(content);
  if (/<meta\s+name="robots"/i.test(html)) {
    return html.replace(
      /<meta\s+name="robots"\s+content="[^"]*"[^>]*>/i,
      `<meta name="robots" content="${robots}">`
    );
  }
  return html.replace("</head>", `<meta name="robots" content="${robots}">\n</head>`);
}

function injectJsonLd(html, graph) {
  const tag = toJsonLdScriptTag(graph);
  if (!tag) return html;
  return html.replace("</head>", `${tag}\n</head>`);
}

function injectNoScriptLinks(html, links, label) {
  const unique = [...new Map(
    links.filter((link) => link?.href && link?.text).map((link) => [link.href, link])
  ).values()];
  if (!unique.length) return html;
  const anchors = unique
    .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a>`)
    .join(" ");
  return html.replace("</body>", `<noscript><nav aria-label="${escapeHtml(label)}">${anchors}</nav></noscript></body>`);
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

async function fetchMeta(path, timeoutMs = 3000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlResponse(body) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

function sitemapUrlset(entries) {
  const rows = entries.map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${escapeXml(String(entry.lastmod).slice(0, 10))}</lastmod>` : "";
    const changefreq = entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : "";
    const priority = entry.priority != null ? `<priority>${entry.priority}</priority>` : "";
    return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}${changefreq}${priority}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.join("")}</urlset>`;
}

function sitemapIndex(count) {
  const chunks = Math.ceil(count / SITEMAP_LIMIT);
  const rows = Array.from({ length: chunks }, (_, index) =>
    `<sitemap><loc>${ORIGIN}/sitemaps/sitemap-${index + 1}.xml</loc></sitemap>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.join("")}</sitemapindex>`;
}

async function buildSitemapEntries() {
  const inventory = await fetchMeta("/public/sitemap-inventory", 10000);
  if (!inventory?.ok) return null;

  const entries = INDEXABLE_STATIC_PAGES.map((page) => ({
    url: page.canonical,
    changefreq: page.changefreq,
    priority: page.priority,
    category: "static",
  }));

  for (const city of inventory.cities || []) {
    const path = cityPath(city);
    if (path) entries.push({ url: absoluteCanonicalUrl(path), changefreq: "daily", priority: 0.7, category: "city" });
  }
  for (const restaurant of inventory.restaurants || []) {
    const profilePath = restaurantPath(restaurant);
    const menuPath = restaurantMenuPath(restaurant);
    if (profilePath) entries.push({ url: absoluteCanonicalUrl(profilePath), lastmod: restaurant.updated_at, changefreq: "weekly", priority: 0.8, category: "restaurant" });
    if (menuPath) entries.push({ url: absoluteCanonicalUrl(menuPath), lastmod: restaurant.updated_at, changefreq: "daily", priority: 0.9, category: "menu" });
  }
  for (const cluster of inventory.clusters || []) {
    const path = cluster.path || clusterPath(cluster);
    if (path) {
      entries.push({
        url: absoluteCanonicalUrl(path),
        lastmod: cluster.updated_at,
        changefreq: "weekly",
        priority: 0.75,
        category: "cluster",
      });
    }
  }
  for (const venue of inventory.destination_venues || []) {
    const path = venue.path || (venue.slug ? `/destination-venues/${encodeURIComponent(venue.slug)}` : null);
    if (path) {
      entries.push({
        url: absoluteCanonicalUrl(path),
        lastmod: venue.updated_at,
        changefreq: "weekly",
        priority: 0.7,
        category: "destination_venue",
      });
    }
  }
  for (const video of inventory.videos || []) {
    const path = video.path || null;
    if (path) {
      entries.push({
        url: absoluteCanonicalUrl(path),
        lastmod: video.updated_at,
        changefreq: "weekly",
        priority: 0.6,
        category: "video",
      });
    }
  }

  const seen = new Set();
  return entries.filter((entry) => entry.url && !seen.has(entry.url) && seen.add(entry.url));
}

// Returns the canonical path for a restaurant given DB data ({slug, city, state, id}).
function buildCanonicalRestaurantPath(data, suffix = "") {
  const path = suffix === "/menu" ? restaurantMenuPath(data) : restaurantPath(data);
  return absoluteCanonicalUrl(path);
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

function buildClusterMeta(cluster, pathname) {
  // Do not HTML-escape here — injectMeta() escapes title/description once.
  const seo = getClusterSeoContent(cluster?.slug);
  const title =
    seo?.seoTitle || cluster.share_title || `${cluster.name || "Area Restaurants"} | Menuply`;
  const description =
    seo?.metaDescription
      || cluster.share_description
      || `Browse menu information for restaurants around ${cluster.area_name || cluster.name || "this area"}. Menuply is an independent menu discovery platform.`;
  const path = clusterPath({
    state: cluster.state,
    city: cluster.city,
    slug: cluster.slug,
  });
  const canonical = path ? `${ORIGIN}${path}` : `${ORIGIN}${pathname}`;
  const image = cluster.og_image_url || null;
  return { title, description, canonical, image };
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

  if (pathname === "/sitemap.xml" || SITEMAP_CHUNK_RE.test(pathname)) {
    const entries = await buildSitemapEntries();
    if (!entries) return new Response("Sitemap inventory unavailable", { status: 503 });
    if (pathname === "/sitemap.xml") {
      return xmlResponse(entries.length > SITEMAP_LIMIT ? sitemapIndex(entries.length) : sitemapUrlset(entries));
    }
    const match = SITEMAP_CHUNK_RE.exec(pathname);
    const chunk = Number(match?.[1] || 0);
    const start = (chunk - 1) * SITEMAP_LIMIT;
    if (chunk < 1 || start >= entries.length) return new Response("Not found", { status: 404 });
    return xmlResponse(sitemapUrlset(entries.slice(start, start + SITEMAP_LIMIT)));
  }

  // --- /restaurants/:restaurantSlug/menu-items/:id (before 3-segment profile) ---
  let m = RESTAURANT_MENU_ITEM_RE.exec(pathname);
  if (m) {
    const itemId = m[2];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/menu-items/${encodeURIComponent(itemId)}`),
    ]);
    if (!shell || !meta || !meta.ok) return;
    const { title, description, canonical } = buildMenuItemMeta(meta.data, itemId);
    const restaurant = meta.data.restaurant_id
      ? {
          id: meta.data.restaurant_id,
          name: meta.data.restaurant_name,
          slug: meta.data.restaurant_slug,
          city: meta.data.city,
          state: meta.data.state,
        }
      : null;
    const html = injectJsonLd(
      injectMeta(shell, title, description, canonical),
      menuItemPageJsonLd({ id: itemId, name: meta.data.name, description: meta.data.description }, restaurant)
    );
    return injectedResponse(html);
  }

  // --- Canonical 3-segment: /restaurants/:state/:city/:slug/menu ---
  m = CANONICAL_MENU_RE.exec(pathname);
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
    const cityUrl = absoluteCanonicalUrl(cityPath(meta.data));
    let html = injectNoScriptLinks(injectMeta(shell, title, description, canonical), [
      { href: cityUrl, text: `Restaurants in ${meta.data.city}, ${meta.data.state}` },
    ], "Related city");
    html = injectJsonLd(html, restaurantPageJsonLd(meta.data));
    return injectedResponse(html);
  }

  // --- Canonical 3-segment: /restaurants/:state/:city/:slug (profile) ---
  m = CANONICAL_PROFILE_RE.exec(pathname);
  if (m) {
    // Guard: never treat .../menu-items/:id as state/city/slug.
    if (m[2] === "menu-items") return;
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
    const cityUrl = absoluteCanonicalUrl(cityPath(meta.data));
    let html = injectNoScriptLinks(injectMeta(shell, title, description, canonical), [
      { href: cityUrl, text: `Restaurants in ${meta.data.city}, ${meta.data.state}` },
    ], "Related city");
    html = injectJsonLd(html, restaurantPageJsonLd(meta.data));
    return injectedResponse(html);
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
    return injectedResponse(
      injectJsonLd(injectMeta(shell, title, description, canonical), restaurantPageJsonLd(meta.data))
    );
  }

  // --- Legacy 1-segment: /restaurants/:slug (profile) → redirect to canonical ---
  m = RESTAURANT_PROFILE_RE.exec(pathname);
  if (m) {
    const slug = m[1];
    const inventory = await fetchMeta("/public/sitemap-inventory", 10000);
    const city = inventory?.ok
      ? (inventory.cities || []).find((entry) => cityPath(entry) === pathname)
      : null;
    if (city) {
      const shell = await fetchShell(request.url);
      if (!shell) return;
      const canonical = absoluteCanonicalUrl(cityPath(city));
      const title = `Restaurants in ${escapeHtml(city.city)}, ${escapeHtml(city.state)} | Menuply`;
      const description = `Browse published restaurant menus in ${escapeHtml(city.city)}, ${escapeHtml(city.state)} on Menuply.`;
      const cityRestaurants = (inventory.restaurants || []).filter(
        (entry) => cityPath(entry) === pathname
      );
      const links = cityRestaurants.flatMap((entry) => [
        { href: absoluteCanonicalUrl(restaurantPath(entry)), text: entry.slug },
        { href: absoluteCanonicalUrl(restaurantMenuPath(entry)), text: `${entry.slug} menu` },
      ]);
      return injectedResponse(injectNoScriptLinks(
        injectMeta(shell, title, description, canonical),
        links,
        `Published restaurants in ${city.city}, ${city.state}`
      ));
    }
    const meta = await fetchMeta(`/public/meta/restaurants/${encodeURIComponent(slug)}`);
    if (!meta || !meta.ok) return;
    const canonical = buildCanonicalRestaurantPath(meta.data);
    if (canonical !== `${ORIGIN}${pathname}`) {
      return Response.redirect(canonical, 301);
    }
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const { title, description } = buildRestaurantProfileMeta(meta.data);
    return injectedResponse(
      injectJsonLd(injectMeta(shell, title, description, canonical), restaurantPageJsonLd(meta.data))
    );
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

  // --- /clusters directory ---
  if (pathname === "/clusters" || pathname === "/clusters/") {
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const title = "Restaurant Clusters | Menuply";
    const description =
      "Browse destination areas — malls, campuses, entertainment districts, airports, and more.";
    return injectedResponse(injectMeta(shell, title, description, `${ORIGIN}/clusters`));
  }

  // --- /clusters/:state/:city/:slug ---
  m = CLUSTER_RE.exec(pathname);
  if (m) {
    const clusterSlug = m[3];
    const stateSlug = m[1];
    const citySlug = m[2];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(
        `/public/clusters/${encodeURIComponent(clusterSlug)}?stateSlug=${encodeURIComponent(stateSlug)}&citySlug=${encodeURIComponent(citySlug)}`
      ),
    ]);
    if (!shell || !meta?.ok || !meta.cluster) return;
    const { title, description, canonical, image } = buildClusterMeta(meta.cluster, pathname);
    if (canonical !== `${ORIGIN}${pathname}`) {
      return Response.redirect(canonical, 301);
    }
    return injectedResponse(injectMeta(shell, title, description, canonical, image));
  }

  // --- /clusters/:state/:city ---
  m = CLUSTER_CITY_RE.exec(pathname);
  if (m) {
    const shell = await fetchShell(request.url);
    if (!shell) return;
    const citySlug = m[2];
    const cityLabel = citySlug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const title = `${cityLabel} Restaurant Clusters | Menuply`;
    const description = `Browse restaurant clusters around ${cityLabel} — campuses, entertainment districts, airports, and more.`;
    return injectedResponse(injectMeta(shell, title, description, `${ORIGIN}${pathname}`));
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
    const restaurant = meta.data.restaurant_id
      ? {
          id: meta.data.restaurant_id,
          name: meta.data.restaurant_name,
          slug: meta.data.restaurant_slug,
          city: meta.data.city,
          state: meta.data.state,
        }
      : null;
    const html = injectJsonLd(
      injectMeta(shell, title, description, canonical),
      menuItemPageJsonLd({ id, name: meta.data.name, description: meta.data.description }, restaurant)
    );
    return injectedResponse(html);
  }

  // --- /videos/:kind/:id ---
  m = VIDEO_WATCH_RE.exec(pathname);
  if (m) {
    const kind = m[1];
    const id = m[2];
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/videos/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`),
    ]);
    if (!shell || !meta?.ok || !meta.data) return;
    const data = meta.data;
    const canonical = `${ORIGIN}${data.path || `/videos/${kind}/${id}`}`;
    const titleBase = data.title || "Menuply video";
    const title = `${escapeHtml(titleBase)} | Menuply`;
    const description = escapeHtml(
      data.description ||
        (data.restaurant?.name
          ? `Watch ${titleBase} from ${data.restaurant.name} on Menuply.`
          : `Watch ${titleBase} on Menuply.`)
    );
    let html = injectMeta(shell, title, description, canonical, data.photo_url || null);
    if (!data.indexable) {
      html = injectRobots(html, "noindex, follow");
    }
    html = injectJsonLd(html, videoWatchPageJsonLd(data));
    const links = [];
    if (data.restaurant?.slug) {
      const rPath = restaurantPath(data.restaurant);
      if (rPath) links.push({ href: absoluteCanonicalUrl(rPath), text: data.restaurant.name || "Restaurant" });
    }
    if (data.menu_item?.id) {
      links.push({
        href: `${ORIGIN}/menu-items/${data.menu_item.id}`,
        text: data.menu_item.name || "Menu item",
      });
    }
    if (data.destination_venue?.slug) {
      links.push({
        href: `${ORIGIN}/destination-venues/${encodeURIComponent(data.destination_venue.slug)}`,
        text: data.destination_venue.name || "Venue",
      });
    }
    if (data.cluster?.path) {
      links.push({
        href: absoluteCanonicalUrl(data.cluster.path),
        text: data.cluster.name || "Area",
      });
    }
    if (links.length) html = injectNoScriptLinks(html, links, "Related");
    return injectedResponse(html);
  }

  // --- /destination-venues/:slug (base page only; not /food or /order) ---
  m = DESTINATION_VENUE_RE.exec(pathname);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    const [shell, meta] = await Promise.all([
      fetchShell(request.url),
      fetchMeta(`/public/meta/destination-venues/${encodeURIComponent(slug)}`),
    ]);
    if (!shell || !meta?.ok || !meta.data) return;
    const data = meta.data;
    const name = data.official_name || data.name || slug;
    const hasLocation = data.city && data.state;
    const title = `${escapeHtml(name)} | Menuply`;
    const description = hasLocation
      ? `Explore food and venue details for ${escapeHtml(name)} in ${escapeHtml(data.city)}, ${escapeHtml(data.state)} on Menuply.`
      : `Explore food and venue details for ${escapeHtml(name)} on Menuply.`;
    const canonical = `${ORIGIN}/destination-venues/${encodeURIComponent(data.slug || slug)}`;
    const html = injectJsonLd(
      injectMeta(shell, title, description, canonical),
      destinationVenuePageJsonLd(data)
    );
    return injectedResponse(html);
  }

  // Not a matched path — pass through to normal Vercel routing
}

export const config = {
  matcher: [
    "/sitemap.xml",
    "/sitemaps/:path*",
    "/clusters",
    "/clusters/:path*",
    "/restaurants/:path*",
    "/public/restaurants/:path*",
    "/menu-items/:path*",
    "/videos/:path*",
    "/destination-venues/:slug",
  ],
};
