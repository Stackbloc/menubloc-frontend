/**
 * Site-Wide Legibility + Logo Audit — Screenshot Capture
 * Captures screenshots of all audit pages on https://menuply.com
 * Run: node scripts/audit-screenshots.mjs [before|after]
 */

import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://menuply.com";
const API_URL = "https://menubloc-backend-production.up.railway.app";

const label = process.argv[2] || "before";
const OUT_DIR = path.join(__dirname, `../docs/ui-audits/screenshots/${label}`);

mkdirSync(OUT_DIR, { recursive: true });

async function getARestaurantAndItem() {
  try {
    const res = await fetch(`${API_URL}/search?q=burger&city=Los+Angeles&state=CA&limit=1`);
    const json = await res.json();
    const rows = json?.results || json?.items || [];
    if (rows.length > 0) {
      const row = rows[0];
      const restaurantId = row.restaurant_id || row.id;
      const menuItemId = row.menu_item_id || row.id;
      return { restaurantId, menuItemId };
    }
  } catch (e) {
    console.error("Could not fetch restaurant/item IDs:", e.message);
  }
  // fallback to known IDs from prior test sessions
  return { restaurantId: null, menuItemId: null };
}

async function main() {
  console.log(`Capturing ${label} screenshots → ${OUT_DIR}`);

  const { restaurantId, menuItemId } = await getARestaurantAndItem();
  console.log("Restaurant ID:", restaurantId, "Menu Item ID:", menuItemId);

  const PAGES = [
    { name: "01-homepage", path: "/" },
    { name: "02-search", path: "/search?q=burger&city=Los+Angeles&state=CA" },
    { name: "03-waiter", path: "/waiter" },
    { name: "04-following", path: "/account/following" },
    { name: "05-checkout", path: "/checkout" },
    { name: "06-signup-entry", path: "/restaurant/signup" },
    { name: "07-signup-account", path: "/restaurant/signup/account" },
    { name: "09-terms", path: "/terms" },
    { name: "10-privacy", path: "/privacy" },
    { name: "11-contact", path: "/contact" },
    { name: "12-about", path: "/about" },
    { name: "13-deals", path: "/deals" },
    { name: "14-food-trucks", path: "/food-trucks" },
    { name: "15-top-picks", path: "/top-picks" },
    ...(restaurantId
      ? [
          { name: "16-restaurant-profile", path: `/restaurants/${restaurantId}` },
          { name: "17-restaurant-profile-public", path: `/public/restaurants/${restaurantId}/menu` },
        ]
      : []),
    ...(menuItemId
      ? [{ name: "18-menu-item-detail", path: `/menu-items/${menuItemId}` }]
      : []),
  ];

  const browser = await chromium.launch({ headless: true });

  for (const { name, path: pagePath } of PAGES) {
    const outFile = path.join(OUT_DIR, `${name}.png`);
    console.log(`  → ${name} (${pagePath})`);

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: outFile, fullPage: true });
      console.log(`    ✓ saved ${name}.png`);
    } catch (err) {
      console.error(`    ✗ FAILED ${name}:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log(`\nDone. Screenshots in: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
