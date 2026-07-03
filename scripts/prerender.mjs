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
import { INDEXABLE_STATIC_META, INDEXABLE_STATIC_PAGES } from "../src/lib/sitemapConfig.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "../dist");

const ROUTE_META = INDEXABLE_STATIC_META;

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

  $("noscript[data-sitemap-navigation]").remove();
  const navigation = $("<nav>").attr("aria-label", "Public pages");
  for (const page of INDEXABLE_STATIC_PAGES) {
    navigation.append($("<a>").attr("href", page.path).text(page.title));
    navigation.append(" ");
  }
  $("body").append($("<noscript>").attr("data-sitemap-navigation", "true").append(navigation));

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
