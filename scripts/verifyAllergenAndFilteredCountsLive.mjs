#!/usr/bin/env node
import assert from "node:assert/strict";
import { chromium } from "playwright";

const frontendBaseUrl = (process.env.VERIFY_FRONTEND_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const backendBaseUrl = (process.env.VERIFY_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "/Users/andrebarber/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const DIET_PREFS_STORAGE_KEY = "grubbid.diet.prefs";
const ALLERGEN_KEY = "grubbid.allergen.exclusions";
const FILTER_HEALTH_CHECKED_KEY = "grubbid.filterHealthChecked";
const FILTER_HEALTH_BROKEN_KEY = "grubbid.filterHealthBroken";

function assertCheck(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}: ${text.slice(0, 300)}`);
  }
  return json;
}

function browseRows(payload) {
  if (Array.isArray(payload?.menus)) return payload.menus;
  const row = Array.isArray(payload?.rows) ? payload.rows[0] : null;
  return Array.isArray(row?.menus) ? row.menus : [];
}

async function waitForDiscoveryStable(page) {
  await page.waitForLoadState("load", { timeout: 15000 });
  await page.waitForTimeout(1200);
}

async function openDiscoveryDrawer(page) {
  await page.getByLabel("Open menu").click();
  await page.locator('[data-testid^="discovery-filter-"]').first().waitFor({ state: "visible", timeout: 10000 });
}

async function closeDiscoveryDrawer(page) {
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.waitForTimeout(250);
}

function captureBrowseRequest(page, filterKey) {
  return page.waitForRequest((request) => {
    if (!request.url().includes("/menus/browse")) return false;
    const url = new URL(request.url());
    return url.searchParams.get(filterKey) === "1";
  }, { timeout: 20000 });
}

async function extractDiscoveryCards(page) {
  return page.$$eval('.disc-feed-grid a[href*="/public/restaurants/"]', (nodes) =>
    nodes.map((node) => {
      const href = node.getAttribute("href") || "";
      const idMatch = href.match(/\/public\/restaurants\/(\d+)\/menu/i);
      const text = (node.textContent || "").replace(/\s+/g, " ").trim();
      const countMatch = text.match(/(\d+)\s+[a-z-]+\s+items|(\d+)\s+items/i);
      return {
        id: Number(idMatch?.[1] || 0),
        href,
        text,
        count: Number((countMatch?.[1] || countMatch?.[2] || "").trim() || 0),
      };
    })
  );
}

function toBackendCardInfo(rows) {
  return rows.map((row) => ({
    id: Number(row?.restaurant_id || 0),
    count: Number(row?.matching_item_count ?? row?.menu_item_count ?? 0),
  }));
}

function compareUiCardsToBackend(uiCards, backendCards, label) {
  assertCheck(uiCards.length === backendCards.length, `${label}: visible card count mismatch`, {
    uiCount: uiCards.length,
    backendCount: backendCards.length,
    uiCards,
    backendCards,
  });

  for (let index = 0; index < backendCards.length; index += 1) {
    const ui = uiCards[index];
    const backend = backendCards[index];
    assertCheck(ui.id === backend.id, `${label}: restaurant id mismatch`, { index, ui, backend });
    assertCheck(ui.count === backend.count, `${label}: item count mismatch`, { index, ui, backend });
  }
}

async function ensureNoBroadAllergenWarning(page, label) {
  const body = compactText(await page.textContent("body"));
  assertCheck(!/Set Allergen Preferences/i.test(body), `${label}: broad allergen CTA is visible`, { body });
  assertCheck(
    !/Users with severe allergies should confirm directly with the restaurant/i.test(body),
    `${label}: broad allergen advisory is visible`,
    { body }
  );
}

async function verifyFilter({ browser, filterKey }) {
  const context = await browser.newContext({
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  await context.addInitScript(({ sessionKey, dietKey, allergenKey, checkedKey, brokenKey }) => {
    window.sessionStorage.setItem(sessionKey, "Los Angeles, CA");
    window.localStorage.setItem(dietKey, JSON.stringify({
      vegan: false,
      vegetarian: false,
      gluten_free: false,
      keto: false,
      low_fat: false,
      low_sodium: false,
      dairy_free: false,
      diabetic_friendly: false,
    }));
    window.localStorage.setItem(allergenKey, JSON.stringify([]));
    window.sessionStorage.removeItem(checkedKey);
    window.sessionStorage.removeItem(brokenKey);
  }, {
    sessionKey: SESSION_LOCATION_KEY,
    dietKey: DIET_PREFS_STORAGE_KEY,
    allergenKey: ALLERGEN_KEY,
    checkedKey: FILTER_HEALTH_CHECKED_KEY,
    brokenKey: FILTER_HEALTH_BROKEN_KEY,
  });

  const page = await context.newPage();
  await page.goto(`${frontendBaseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForDiscoveryStable(page);
  await ensureNoBroadAllergenWarning(page, `${filterKey} baseline`);

  await openDiscoveryDrawer(page);
  const requestPromise = captureBrowseRequest(page, filterKey);
  await page.getByTestId(`discovery-filter-${filterKey}`).click();
  const request = await requestPromise;
  await closeDiscoveryDrawer(page);
  await waitForDiscoveryStable(page);

  const requestUrl = request.url();
  const parsedUrl = new URL(requestUrl);
  assert.equal(parsedUrl.searchParams.get(filterKey), "1", `${filterKey}: outgoing browse URL is missing the intended filter param`);

  const backendPayload = await fetchJson(requestUrl.replace("http://localhost:3001", backendBaseUrl));
  const backendCards = toBackendCardInfo(browseRows(backendPayload));
  const uiCards = await extractDiscoveryCards(page);
  compareUiCardsToBackend(uiCards, backendCards, filterKey);
  await ensureNoBroadAllergenWarning(page, filterKey);

  await context.close();

  return {
    filterKey,
    requestUrl,
    backendRestaurantCount: backendCards.length,
    uiRestaurantCount: uiCards.length,
    backendItemCounts: backendCards.map((card) => card.count),
  };
}

async function main() {
  const health = await fetch(`${backendBaseUrl}/health`);
  assertCheck(health.ok, "Backend health check failed");

  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    const results = [];
    for (const filterKey of ["dairy_free", "gluten_free", "vegan"]) {
      results.push(await verifyFilter({ browser, filterKey }));
    }

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exit(1);
});
