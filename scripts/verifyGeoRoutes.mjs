import { chromium } from "playwright";

const backendBaseUrl = (process.env.VERIFY_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const frontendBaseUrl = (process.env.VERIFY_FRONTEND_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "/Users/andrebarber/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

async function checkEndpoint(url, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`${label} responded with status ${res.status}`);
    }

    return true;
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error(`${label} not reachable (timeout)`);
    }

    throw new Error(`${label} not reachable (${err.message})`);
  }
}

async function preflightCheck() {
  try {
    await checkEndpoint("http://127.0.0.1:3001/health", "Backend");
  } catch (err) {
    console.error("❌ Backend not running on :3001");
    console.error(err.message);
    process.exit(1);
  }

  try {
    await checkEndpoint("http://127.0.0.1:4173/", "Frontend");
  } catch (err) {
    console.error("❌ Frontend not running on :4173");
    console.error(err.message);
    process.exit(1);
  }

  console.log("✅ Preflight check passed (backend + frontend reachable)");
}

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

async function verifyDiscoveryTyping(page) {
  await page.goto(`${frontendBaseUrl}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("load", { timeout: 15000 });
  await page.waitForTimeout(3000);

  const discoveryBody = await page.textContent("body");
  assertCheck(/Search/i.test(discoveryBody || ""), "Discovery page must load");
  assertCheck(
    /Los Angeles, CA|Pasadena, CA/.test(discoveryBody || ""),
    "Discovery page must show an auto-detected location label",
    { bodySnippet: String(discoveryBody || "").slice(0, 500) }
  );

  const input = page.locator(".disc-search-input");
  await input.waitFor({ state: "visible", timeout: 15000 });

  const cardSelector = 'a[href*="/public/restaurants/"]';
  const countCards = async () => page.locator(cardSelector).count();
  const initialCardCount = await countCards();

  assertCheck(
    initialCardCount > 0,
    "Discovery page must show default cards before typing",
    { initialCardCount }
  );

  const typingSnapshots = [];
  for (const term of ["c", "ch", "chi", "chick", "chicken"]) {
    await input.fill(term);
    await page.waitForTimeout(350);
    const cardCount = await countCards();
    typingSnapshots.push({ term, cardCount });
    assertCheck(
      cardCount > 0,
      `Discovery cards vanished while typing "${term}"`,
      { term, cardCount }
    );
  }

  await input.press("Enter");
  await page.waitForURL((url) => url.pathname === "/search", { timeout: 15000 });
  await page.waitForLoadState("load", { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || "";
      return /Results|View Menu|Chipotle Mexican Grill/i.test(text) && !/Loading…|Loading\.\.\./i.test(text);
    },
    { timeout: 15000 }
  );

  return {
    discoveryAutoLabelDetected: true,
    discoveryTypingPreservedCards: true,
    discoveryInitialCardCount: initialCardCount,
    discoveryTypingSnapshots: typingSnapshots,
    searchHasResults: true,
  };
}

async function verifyBackend() {
  const searchLa = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&city=Los+Angeles&state=CA`);
  const searchLaLowFat = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&city=Los+Angeles&state=CA&low_fat=true`);
  const browseLa = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?city=Los+Angeles&state=CA`);
  const browseLaLowFat = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?city=Los+Angeles&state=CA&low_fat=true`);
  const browseDothan = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?city=Dothan&state=AL`);
  const searchDothan = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&city=Dothan&state=AL`);

  const browseLaRows = restaurantRowsFromBrowse(browseLa);
  const browseLaLowFatRows = restaurantRowsFromBrowse(browseLaLowFat);
  const browseDothanRows = restaurantRowsFromBrowse(browseDothan);
  const searchLaCount = (searchLa?.menu_items || []).length + (searchLa?.buckets?.restaurants || []).length;
  const searchLaLowFatCount = (searchLaLowFat?.menu_items || []).length + (searchLaLowFat?.buckets?.restaurants || []).length;

  assertCheck(
    searchLaCount > 0,
    "LA search must return results"
  );
  assertCheck(
    searchLaLowFatCount < searchLaCount,
    "LA low-fat search must reduce result count",
    { base: searchLaCount, lowFat: searchLaLowFatCount }
  );
  assertCheck(
    ((searchDothan?.menu_items || []).length + (searchDothan?.buckets?.restaurants || []).length) > 0,
    "Dothan search must return results"
  );
  assertCheck(
    browseLaLowFatRows.length < browseLaRows.length,
    "LA low-fat browse must reduce restaurant count",
    { base: browseLaRows.length, lowFat: browseLaLowFatRows.length }
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
    searchLaResults: searchLaCount,
    searchLaLowFatResults: searchLaLowFatCount,
    searchDothanResults: (searchDothan?.menu_items || []).length + (searchDothan?.buckets?.restaurants || []).length,
    browseLaCount: browseLaRows.length,
    browseLaLowFatCount: browseLaLowFatRows.length,
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
    const discoveryChecks = await verifyDiscoveryTyping(page);

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
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return /Results|View Menu|Chipotle Mexican Grill/i.test(text) && !/Loading…|Loading\.\.\./i.test(text);
      },
      { timeout: 15000 }
    );
    const searchBody = await page.textContent("body");
    assertCheck(
      /Results|View Menu|Chipotle Mexican Grill/i.test(searchBody || ""),
      "LA search page must render results",
      { bodySnippet: String(searchBody || "").slice(0, 1000) }
    );

    return {
      ...discoveryChecks,
      browseUrlPreserved: true,
      browseCrossCityLeakage: false,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  await preflightCheck();
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
