#!/usr/bin/env node
/**
 * Post-build static prerender for Menuply public pages.
 *
 * Run automatically via `npm run build` (vite build && node scripts/prerender.mjs).
 * For each route in ROUTES, launches a headless Chromium instance, navigates to
 * the SPA served from dist/, waits for React to render, then injects the correct
 * <title> and <meta> tags via page.evaluate() before writing the HTML to
 * dist/{route}/index.html.
 *
 * Protected files (GrubbidDiscovery, BrowseMenus) are not modified — meta is
 * injected here instead. Non-protected pages also have usePageMeta() which handles
 * SPA in-app navigation; the evaluate() call here ensures the static snapshot
 * always has canonical metadata regardless of hydration timing.
 *
 * Vercel serves these prerendered files as static assets before the SPA catch-all
 * rewrite fires, so crawlers and link-unfurlers see real <title> and <meta> tags.
 */
import { chromium } from "playwright";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../dist");
const PORT = 5174;

// Mirrors staticPageMeta.js — kept in sync manually when SEO copy changes
const BASE = "https://menuply.com";
const ROUTE_META = {
  "/": {
    title: "Menuply | Discover Local Menus, Deals & Nutrition",
    description: "Browse restaurant menus near you. Find dishes, deals, and nutrition insights on Menuply.",
    canonical: `${BASE}/`,
    ogTitle: "Menuply | Discover Local Menus, Deals & Nutrition",
    ogDescription: "Browse restaurant menus near you. Find dishes, deals, and nutrition insights on Menuply.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/about": {
    title: "About Menuply | Food Intelligence Platform",
    description: "Learn how Menuply helps you explore restaurant menus, compare dishes, and make better food choices.",
    canonical: `${BASE}/about`,
    ogTitle: "About Menuply | Food Intelligence Platform",
    ogDescription: "Learn how Menuply helps you explore restaurant menus, compare dishes, and make better food choices.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/contact": {
    title: "Contact Menuply | Get in Touch",
    description: "Contact the Menuply team for support, restaurant partnerships, or general inquiries.",
    canonical: `${BASE}/contact`,
    ogTitle: "Contact Menuply | Get in Touch",
    ogDescription: "Contact the Menuply team for support, restaurant partnerships, or general inquiries.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/terms": {
    title: "Terms of Service | Menuply",
    description: "Read the Menuply Terms of Service governing use of the platform.",
    canonical: `${BASE}/terms`,
    ogTitle: "Terms of Service | Menuply",
    ogDescription: "Read the Menuply Terms of Service governing use of the platform.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/privacy": {
    title: "Privacy Policy | Menuply",
    description: "Read the Menuply Privacy Policy covering how your data is collected and used.",
    canonical: `${BASE}/privacy`,
    ogTitle: "Privacy Policy | Menuply",
    ogDescription: "Read the Menuply Privacy Policy covering how your data is collected and used.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/browse-menus": {
    title: "Browse Restaurant Menus | Menuply",
    description: "Explore restaurant menus in your area on Menuply. Find the best local dishes near you.",
    canonical: `${BASE}/browse-menus`,
    ogTitle: "Browse Restaurant Menus | Menuply",
    ogDescription: "Explore restaurant menus in your area on Menuply. Find the best local dishes near you.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/restaurant/onboarding": {
    title: "List Your Restaurant on Menuply | Get Found Online",
    description: "Join Menuply and get your restaurant menu in front of local customers searching for food.",
    canonical: `${BASE}/restaurant/onboarding`,
    ogTitle: "List Your Restaurant on Menuply",
    ogDescription: "Join Menuply and get your restaurant menu in front of local customers searching for food.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
  "/signup": {
    title: "Restaurant Sign Up | Menuply",
    description: "Create your Menuply restaurant account and start managing your menu online.",
    canonical: `${BASE}/signup`,
    ogTitle: "Restaurant Sign Up | Menuply",
    ogDescription: "Create your Menuply restaurant account and start managing your menu online.",
    ogImage: `${BASE}/menuply-share-default.svg`,
  },
};

const ROUTES = Object.keys(ROUTE_META);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = req.url.split("?")[0].replace(/\/+$/, "") || "/";
    let filePath = path.join(DIST, urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST, "index.html");
    }

    const ext = path.extname(filePath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function injectMeta(meta) {
  function upsert(selector, attr, value) {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      const tagName = selector.split("[")[0];
      el = document.createElement(tagName);
      // Copy all attribute constraints from the selector onto the new element
      // so tags like <meta property="og:image"> get the property attribute set.
      const re = /\[([a-z:]+)="([^"]+)"\]/g;
      let m;
      while ((m = re.exec(selector)) !== null) {
        el.setAttribute(m[1], m[2]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  document.title = meta.title;
  upsert('meta[name="description"]', "content", meta.description);
  upsert('link[rel="canonical"]', "href", meta.canonical);
  upsert('meta[property="og:title"]', "content", meta.ogTitle || meta.title);
  upsert('meta[property="og:description"]', "content", meta.ogDescription || meta.description);
  upsert('meta[property="og:url"]', "content", meta.canonical);
  upsert('meta[property="og:image"]', "content", meta.ogImage);
  upsert('meta[name="twitter:card"]', "content", "summary_large_image");
  upsert('meta[name="twitter:title"]', "content", meta.ogTitle || meta.title);
  upsert('meta[name="twitter:description"]', "content", meta.ogDescription || meta.description);
  upsert('meta[name="twitter:image"]', "content", meta.ogImage);
}

async function prerender() {
  console.log("[prerender] starting...");

  if (!fs.existsSync(DIST)) {
    console.error(`[prerender] dist/ not found at ${DIST} — run vite build first`);
    process.exit(1);
  }

  const server = await startServer();
  const browser = await chromium.launch();

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      page.on("console", () => {});
      page.on("pageerror", () => {});

      // Abort all external requests — backend is not available during prerender
      await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());

      await page.goto(`http://127.0.0.1:${PORT}${route}`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });

      // Inject correct meta after React renders — handles protected files that
      // don't have usePageMeta() and ensures consistent output regardless of
      // hydration timing
      await page.evaluate(injectMeta, ROUTE_META[route]);

      const html = await page.content();
      const outDir = route === "/" ? DIST : path.join(DIST, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");

      const title = await page.title();
      console.log(`[prerender] ${route} → "${title}"`);

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("[prerender] done.");
}

prerender().catch((err) => {
  console.error("[prerender] failed:", err);
  process.exit(1);
});
