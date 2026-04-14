import { chromium } from "playwright";

const backendBaseUrl = (process.env.VERIFY_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const frontendBaseUrl = (process.env.VERIFY_FRONTEND_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "/Users/andrebarber/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

async function fetchJsonOrThrow(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return json;
}

function restaurantRowsFromBrowse(payload) {
  if (Array.isArray(payload?.menus)) return payload.menus;
  const firstRow = Array.isArray(payload?.rows) ? payload.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function cityOf(row) {
  return String(row?.city || row?.restaurant_city || "").trim().toLowerCase();
}

function hasCity(rows, city) {
  const token = String(city || "").trim().toLowerCase();
  return rows.some((row) => cityOf(row).includes(token));
}

function assertCheck(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

async function verifyBackend() {
  const searchLa = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&city=Los+Angeles&state=CA`);
  const browseLa = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?city=Los+Angeles&state=CA`);
  const browseDothan = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?city=Dothan&state=AL`);
  const searchDothan = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&city=Dothan&state=AL`);

  const browseLaRows = restaurantRowsFromBrowse(browseLa);
  const browseDothanRows = restaurantRowsFromBrowse(browseDothan);

  assertCheck(
    ((searchLa?.menu_items || []).length + (searchLa?.buckets?.restaurants || []).length) > 0,
    "LA search must return results"
  );
  assertCheck(
    ((searchDothan?.menu_items || []).length + (searchDothan?.buckets?.restaurants || []).length) > 0,
    "Dothan search must return results"
  );
  assertCheck(
    !hasCity(browseLaRows, "dothan"),
    "LA browse must not contain Dothan restaurants",
    { sample: browseLaRows.slice(0, 10) }
  );
  assertCheck(
    !hasCity(browseDothanRows, "los angeles"),
    "Dothan browse must not contain Los Angeles restaurants",
    { sample: browseDothanRows.slice(0, 10) }
  );

  return {
    searchLaResults: (searchLa?.menu_items || []).length + (searchLa?.buckets?.restaurants || []).length,
    searchDothanResults: (searchDothan?.menu_items || []).length + (searchDothan?.buckets?.restaurants || []).length,
    browseLaCount: browseLaRows.length,
    browseDothanCount: browseDothanRows.length,
  };
}

async function verifyFrontend() {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });

  try {
    const context = await browser.newContext({
      geolocation: { latitude: 34.0522, longitude: -118.2437 },
      permissions: ["geolocation"],
      viewport: { width: 1440, height: 1400 },
    });
    const page = await context.newPage();

    await page.goto(`${frontendBaseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("load", { timeout: 15000 });
    const discoveryBody = await page.textContent("body");
    assertCheck(/Search/i.test(discoveryBody || ""), "Discovery page must load");
    assertCheck(
      /Los Angeles, CA|Pasadena, CA/.test(discoveryBody || ""),
      "Discovery page must show an auto-detected location label",
      { bodySnippet: String(discoveryBody || "").slice(0, 500) }
    );

    await page.goto(`${frontendBaseUrl}/browse-menus?city=Los+Angeles&state=CA`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("load", { timeout: 15000 });
    const browseBody = await page.textContent("body");
    assertCheck(
      page.url().includes("city=Los+Angeles") && page.url().includes("state=CA"),
      "Browse must preserve city/state in the URL",
      { url: page.url() }
    );
    assertCheck(
      !/Dothan/i.test(browseBody || ""),
      "LA browse page must not render Dothan content",
      { bodySnippet: String(browseBody || "").slice(0, 1000) }
    );

    await page.goto(`${frontendBaseUrl}/search?q=chicken&city=Los+Angeles&state=CA`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("load", { timeout: 15000 });
    const searchBody = await page.textContent("body");
    assertCheck(
      /Results|View Menu|Chipotle Mexican Grill/i.test(searchBody || ""),
      "LA search page must render results",
      { bodySnippet: String(searchBody || "").slice(0, 1000) }
    );

    return {
      discoveryAutoLabelDetected: true,
      browseUrlPreserved: true,
      browseCrossCityLeakage: false,
      searchHasResults: true,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const backend = await verifyBackend();
  const frontend = await verifyFrontend();

  console.log(JSON.stringify({
    ok: true,
    backendBaseUrl,
    frontendBaseUrl,
    backend,
    frontend,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    message: error?.message || String(error),
    details: error?.details || null,
    backendBaseUrl,
    frontendBaseUrl,
  }, null, 2));
  process.exit(1);
});
