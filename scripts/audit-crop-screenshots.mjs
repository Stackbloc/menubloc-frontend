/**
 * Captures cropped/sectioned screenshots for defect verification.
 * Each entry captures a specific scroll offset + viewport height.
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://menuply.com";
const OUT_DIR = path.join(__dirname, "../docs/ui-audits/screenshots/crop");
mkdirSync(OUT_DIR, { recursive: true });

const CROPS = [
  // Terms page — heading + body text
  { name: "terms-hero",     path: "/terms",           scrollY: 0,    height: 700 },
  { name: "terms-body",     path: "/terms",           scrollY: 400,  height: 600 },
  // Privacy page — same layout
  { name: "privacy-hero",   path: "/privacy",         scrollY: 0,    height: 700 },
  // About page
  { name: "about-hero",     path: "/about",           scrollY: 0,    height: 700 },
  { name: "about-body",     path: "/about",           scrollY: 400,  height: 600 },
  // Contact page
  { name: "contact-hero",   path: "/contact",         scrollY: 0,    height: 700 },
  // Restaurant signup entry — plan selection
  { name: "signup-entry-top", path: "/restaurant/signup", scrollY: 0, height: 700 },
  // Restaurant signup account — form header
  { name: "signup-account-top", path: "/restaurant/signup/account", scrollY: 0, height: 700 },
  // Checkout — header area
  { name: "checkout-top",   path: "/checkout",        scrollY: 0,    height: 500 },
  // Homepage — footer area
  { name: "homepage-footer", path: "/",               scrollY: 99999, height: 200 },
  // Deals page
  { name: "deals-top",      path: "/deals",           scrollY: 0,    height: 600 },
  // Food trucks
  { name: "foodtrucks-top", path: "/food-trucks",     scrollY: 0,    height: 600 },
  // Top picks
  { name: "toppicks-top",   path: "/top-picks",       scrollY: 0,    height: 600 },
  // Restaurant profile page
  { name: "restaurant-profile-top", path: "/restaurants/609", scrollY: 0, height: 700 },
  // Menu item detail
  { name: "menuitem-top",   path: "/menu-items/13849", scrollY: 0,   height: 700 },
  // Waiter
  { name: "waiter-top",     path: "/waiter",          scrollY: 0,    height: 700 },
  // Waiter footer
  { name: "waiter-footer",  path: "/waiter",          scrollY: 99999, height: 200 },
];

async function main() {
  console.log(`Capturing ${CROPS.length} cropped screenshots → ${OUT_DIR}`);
  const browser = await chromium.launch({ headless: true });

  for (const { name, path: pagePath, scrollY, height } of CROPS) {
    const outFile = path.join(OUT_DIR, `${name}.png`);
    console.log(`  → ${name}`);

    const context = await browser.newContext({
      viewport: { width: 390, height: height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2500);
      if (scrollY > 0) {
        await page.evaluate((y) => window.scrollTo(0, y), scrollY);
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: outFile, fullPage: false });
      console.log(`    ✓ ${name}.png`);
    } catch (err) {
      console.error(`    ✗ FAILED ${name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log(`\nDone. Crops in: ${OUT_DIR}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
