/**
 * Post-build static prerender script.
 * Runs after `vite build`. Injects route-specific <title>, meta, canonical, and
 * OG/Twitter tags into dist/index.html and writes dist/<route>/index.html.
 *
 * Uses cheerio (no Playwright) so Vercel builds do not require Chromium system libs.
 */

import { load } from "cheerio";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "../dist");

const SITE_BASE = "https://menuply.com";

const ROUTE_META = {
  "/": {
    title: "Menuply | Discover Local Menus, Deals & Nutrition",
    description: "Browse restaurant menus near you. Find dishes, deals, and nutrition insights on Menuply.",
    canonical: `${SITE_BASE}/`,
    ogTitle: "Menuply | Discover Local Menus, Deals & Nutrition",
    ogDescription: "Browse restaurant menus near you. Find dishes, deals, and nutrition insights on Menuply.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/about": {
    title: "About Menuply | Food Intelligence Platform",
    description: "Learn how Menuply helps you explore restaurant menus, compare dishes, and make better food choices.",
    canonical: `${SITE_BASE}/about`,
    ogTitle: "About Menuply | Food Intelligence Platform",
    ogDescription: "Learn how Menuply helps you explore restaurant menus, compare dishes, and make better food choices.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/contact": {
    title: "Contact Menuply | Get in Touch",
    description: "Contact the Menuply team for support, restaurant partnerships, or general inquiries.",
    canonical: `${SITE_BASE}/contact`,
    ogTitle: "Contact Menuply | Get in Touch",
    ogDescription: "Contact the Menuply team for support, restaurant partnerships, or general inquiries.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/terms": {
    title: "Terms of Service | Menuply",
    description: "Read the Menuply Terms of Service governing use of the platform.",
    canonical: `${SITE_BASE}/terms`,
    ogTitle: "Terms of Service | Menuply",
    ogDescription: "Read the Menuply Terms of Service governing use of the platform.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/privacy": {
    title: "Privacy Policy | Menuply",
    description: "Read the Menuply Privacy Policy covering how your data is collected and used.",
    canonical: `${SITE_BASE}/privacy`,
    ogTitle: "Privacy Policy | Menuply",
    ogDescription: "Read the Menuply Privacy Policy covering how your data is collected and used.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/restaurant/onboarding": {
    title: "List Your Restaurant on Menuply | Get Found Online",
    description: "Join Menuply and get your restaurant menu in front of local customers searching for food.",
    canonical: `${SITE_BASE}/restaurant/onboarding`,
    ogTitle: "List Your Restaurant on Menuply",
    ogDescription: "Join Menuply and get your restaurant menu in front of local customers searching for food.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
  "/signup": {
    title: "Restaurant Sign Up | Menuply",
    description: "Create your Menuply restaurant account and start managing your menu online.",
    canonical: `${SITE_BASE}/signup`,
    ogTitle: "Restaurant Sign Up | Menuply",
    ogDescription: "Create your Menuply restaurant account and start managing your menu online.",
    ogImage: `${SITE_BASE}/menuply-share-default.svg`,
  },
};

function upsertMeta($, selector, attr, value) {
  let el = $(selector);
  if (!el.length) {
    const re = /\[([a-z:]+)="([^"]+)"\]/g;
    const attrs = {};
    let m;
    while ((m = re.exec(selector)) !== null) {
      attrs[m[1]] = m[2];
    }
    if (selector.startsWith('link[rel="canonical"]')) {
      el = $("<link>").attr({ rel: "canonical" });
    } else {
      el = $("<meta>").attr(attrs);
    }
    $("head").append(el);
  }
  el.attr(attr, value);
}

function applyMetaToHtml(html, meta) {
  const $ = load(html, { decodeEntities: false });

  $("title").text(meta.title);
  upsertMeta($, 'meta[name="description"]', "content", meta.description);

  let canonical = $('link[rel="canonical"]');
  if (!canonical.length) {
    canonical = $('<link rel="canonical">');
    $("head").append(canonical);
  }
  canonical.attr("href", meta.canonical);

  upsertMeta($, 'meta[property="og:title"]', "content", meta.ogTitle);
  upsertMeta($, 'meta[property="og:description"]', "content", meta.ogDescription);
  upsertMeta($, 'meta[property="og:url"]', "content", meta.canonical);
  upsertMeta($, 'meta[property="og:type"]', "content", "website");
  upsertMeta($, 'meta[property="og:image"]', "content", meta.ogImage);

  upsertMeta($, 'meta[name="twitter:card"]', "content", "summary_large_image");
  upsertMeta($, 'meta[name="twitter:title"]', "content", meta.ogTitle);
  upsertMeta($, 'meta[name="twitter:description"]', "content", meta.ogDescription);
  upsertMeta($, 'meta[name="twitter:image"]', "content", meta.ogImage);

  return $.html();
}

function prerender() {
  if (process.env.SKIP_PRERENDER === "1") {
    console.log("SKIP_PRERENDER=1 — skipping static meta prerender");
    return;
  }

  const shellPath = join(DIST, "index.html");
  if (!existsSync(shellPath)) {
    throw new Error(`dist/index.html not found — run vite build first (${shellPath})`);
  }

  const shellHtml = readFileSync(shellPath, "utf8");
  const errors = [];

  for (const [route, meta] of Object.entries(ROUTE_META)) {
    try {
      const html = applyMetaToHtml(shellHtml, meta);
      if (route === "/") {
        writeFileSync(shellPath, html, "utf8");
        console.log(`  [OK] / → dist/index.html`);
      } else {
        const outDir = join(DIST, route);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, "index.html"), html, "utf8");
        console.log(`  [OK] ${route} → dist${route}/index.html`);
      }
    } catch (err) {
      console.error(`  [FAIL] ${route}: ${err.message}`);
      errors.push({ route, error: err.message });
    }
  }

  if (errors.length > 0) {
    console.error(`\nPrerender failed for ${errors.length} route(s):`);
    for (const e of errors) console.error(`  ${e.route}: ${e.error}`);
    process.exit(1);
  }

  console.log(`\nPrerender complete — ${Object.keys(ROUTE_META).length} routes written.`);
}

try {
  prerender();
} catch (err) {
  console.error("Prerender fatal:", err);
  process.exit(1);
}
