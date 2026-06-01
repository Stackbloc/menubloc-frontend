import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "test-artifacts");
const BASE_URL = process.env.WAITER_SCREENSHOT_URL || "http://127.0.0.1:5177";

await fs.mkdir(OUT_DIR, { recursive: true });

const rows = Array.from({ length: 12 }, (_, index) => {
  const fried = index % 2 === 0;
  return {
    menu_item_id: `waiter-demo-${index + 1}`,
    menu_item_name: fried
      ? `Crispy Fried Chicken Sandwich ${index + 1}`
      : `Grilled Chicken Sandwich ${index + 1}`,
    search_display_name: fried
      ? `Crispy Fried Chicken Sandwich ${index + 1}`
      : `Grilled Chicken Sandwich ${index + 1}`,
    restaurant_id: `demo-restaurant-${index + 1}`,
    restaurant_slug: `demo-restaurant-${index + 1}`,
    restaurant_name: `Demo Kitchen ${index + 1}`,
    city: "Dothan",
    state: "AL",
    category: "sandwich",
    strict_type: "sandwich",
    price_cents: 1199 + index * 50,
    score: 1 - index / 100,
  };
});

async function capture(viewport, fileName) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });

  await page.route("http://localhost:3001/search/track", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("http://localhost:3001/search?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        total: rows.length,
        rows,
        query: { normalized: "chicken sandwich" },
        search_meta: { restaurant_oriented: false },
      }),
    });
  });

  await page.goto(`${BASE_URL}/search?q=chicken%20sandwich&city=Dothan&state=AL`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByText("Results", { exact: true }).waitFor({ timeout: 5000 });
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    fullPage: true,
  });
  await browser.close();
}

await capture({ width: 390, height: 844 }, "waiter-refinement-mobile.png");
await capture({ width: 1280, height: 900 }, "waiter-refinement-desktop.png");
