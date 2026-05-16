/**
 * Post-build static prerender script.
 * Runs after `vite build`. Launches a Playwright browser, visits each public
 * route served from dist/, injects correct <title>, <meta>, <link>, and OG/Twitter
 * tags, then writes the result as dist/<route>/index.html so Vercel serves
 * pre-baked HTML for crawlers and social bots.
 *
 * Abort policy: all non-localhost network requests are blocked so the script
 * never depends on live API responses during CI.
 */

import { chromium } from "playwright";
import { createServer } from "http";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "../dist");
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

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
  "/browse-menus": {
    title: "Browse Restaurant Menus | Menuply",
    description: "Explore restaurant menus in your area on Menuply. Find the best local dishes near you.",
    canonical: `${SITE_BASE}/browse-menus`,
    ogTitle: "Browse Restaurant Menus | Menuply",
    ogDescription: "Explore restaurant menus in your area on Menuply. Find the best local dishes near you.",
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

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".woff2": "font/woff2",
  ".woff":  "font/woff",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  // Strip trailing slash for asset resolution
  if (urlPath !== "/" && urlPath.endsWith("/")) urlPath = urlPath.slice(0, -1);

  // Try exact file first, then /index.html fallback (SPA)
  let filePath = join(DIST, urlPath);
  const ext = extname(filePath);

  if (!ext || !existsSync(filePath)) {
    filePath = join(DIST, "index.html");
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const mime = MIME[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": mime });
  createReadStream(filePath).pipe(res);
}

/**
 * Inject page-specific meta tags into a live document.
 * Called inside page.evaluate() — runs in the browser context.
 * All DOM API usage here; no Node.js imports allowed.
 */
function injectMeta(meta) {
  function upsert(selector, attr, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      // Copy all [attr="value"] constraints from the selector onto the element
      // so that newly created tags have their property/name attribute set.
      const re = /\[([a-z:]+)="([^"]+)"\]/g;
      let m;
      while ((m = re.exec(selector)) !== null) {
        el.setAttribute(m[1], m[2]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  // <title>
  document.title = meta.title;
  let titleEl = document.querySelector("title");
  if (!titleEl) {
    titleEl = document.createElement("title");
    document.head.prepend(titleEl);
  }
  titleEl.textContent = meta.title;

  // <meta name="description">
  upsert('meta[name="description"]', "content", meta.description);

  // <link rel="canonical">
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", meta.canonical);

  // Open Graph
  upsert('meta[property="og:title"]',       "content", meta.ogTitle);
  upsert('meta[property="og:description"]', "content", meta.ogDescription);
  upsert('meta[property="og:url"]',         "content", meta.canonical);
  upsert('meta[property="og:type"]',        "content", "website");
  upsert('meta[property="og:image"]',       "content", meta.ogImage);

  // Twitter
  upsert('meta[name="twitter:card"]',        "content", "summary_large_image");
  upsert('meta[name="twitter:title"]',       "content", meta.ogTitle);
  upsert('meta[name="twitter:description"]', "content", meta.ogDescription);
  upsert('meta[name="twitter:image"]',       "content", meta.ogImage);
}

async function prerender() {
  const server = createServer(serveStatic);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Static server listening on ${BASE}`);

  const browser = await chromium.launch();
  const errors = [];

  for (const [route, meta] of Object.entries(ROUTE_META)) {
    const url = `${BASE}${route}`;
    const page = await browser.newPage();

    // Block all external requests — prerender must be fully offline-safe
    await page.route("**/*", (routeObj) => {
      const reqUrl = routeObj.request().url();
      if (reqUrl.startsWith(BASE) || reqUrl.startsWith("data:")) {
        routeObj.continue();
      } else {
        routeObj.abort();
      }
    });

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.evaluate(injectMeta, meta);
      const html = await page.content();

      // Write to dist/<route>/index.html (root route writes to dist/index.html)
      if (route === "/") {
        writeFileSync(join(DIST, "index.html"), html, "utf8");
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
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (errors.length > 0) {
    console.error(`\nPrerender failed for ${errors.length} route(s):`);
    for (const e of errors) console.error(`  ${e.route}: ${e.error}`);
    process.exit(1);
  }

  console.log(`\nPrerender complete — ${Object.keys(ROUTE_META).length} routes written.`);
}

prerender().catch((err) => {
  console.error("Prerender fatal:", err);
  process.exit(1);
});
