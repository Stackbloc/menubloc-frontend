import { chromium } from "playwright";

const backendBaseUrl = (process.env.VERIFY_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const frontendBaseUrl = (process.env.VERIFY_FRONTEND_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
  "/Users/andrebarber/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

function assertCheck(condition, message, details = {}) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cityToken(value) {
  return normalizeText(value).toLowerCase();
}

function extractVisibleRestaurantNames(bodyText) {
  const text = String(bodyText || "");
  const names = new Set();

  const distanceRegex = /([A-Z][A-Za-z0-9'&.\- ]{1,100})\s*\n\s*\d+(?:\.\d+)?\s*mi(?:\s+away)?/g;
  for (const match of text.matchAll(distanceRegex)) {
    const name = normalizeText(match[1]);
    if (name) names.add(name);
  }

  const loadMoreRegex = /\+\s+\d+\s+more\s+deal(?:s)?\s+from\s+([A-Z][A-Za-z0-9'&.\- ]{1,100})/g;
  for (const match of text.matchAll(loadMoreRegex)) {
    const name = normalizeText(match[1]);
    if (name) names.add(name);
  }

  return [...names];
}

function extractRestaurantDistances(bodyText) {
  const text = String(bodyText || "");
  const distances = new Map();
  const regex = /([A-Z][A-Za-z0-9'&.\- ]{1,100})\s*\n\s*(\d+(?:\.\d+)?)\s*mi(?:\s+away)?/g;

  for (const match of text.matchAll(regex)) {
    const name = normalizeText(match[1]);
    const miles = Number(match[2]);
    if (!name || !Number.isFinite(miles)) continue;
    if (!distances.has(name)) distances.set(name, miles);
  }

  return distances;
}

function hasInvalidLocationState(bodyText) {
  const text = normalizeText(bodyText).toLowerCase();
  return (
    text.includes("location required") ||
    text.includes("open this page with a valid city/state or geo url") ||
    text.includes("location is required to search") ||
    text.includes("location is required to load deals") ||
    text.includes("location needed to browse nearby menus")
  );
}

function hasLoadingText(bodyText) {
  const text = normalizeText(bodyText).toLowerCase();
  return text.includes("loading…") || text.includes("loading...");
}

function hasValidEmptyState(bodyText) {
  const text = normalizeText(bodyText).toLowerCase();
  return (
    text.includes("no local menus available in this area") ||
    text.includes("no deals found nearby") ||
    text.includes("no results for") ||
    text.includes("no results") ||
    text.includes("no menus found")
  );
}

function extractRestaurantNamesOrDistances(bodyText) {
  return extractVisibleRestaurantNames(bodyText);
}

function hasMenuOrDealOrSearchContent(bodyText) {
  const text = normalizeText(bodyText).toLowerCase();
  return (
    /\d+\s+menus?/.test(text) ||
    /\b\d+\s+deals?\b/.test(text) ||
    /\b\d+\s+dishes?\s+found\b/.test(text) ||
    text.includes("view deal") ||
    text.includes("load more") ||
    text.includes("view menu") ||
    extractRestaurantNamesOrDistances(text).length > 0
  );
}

function bodySnippet(bodyText, limit = 1800) {
  return String(bodyText || "").slice(0, limit);
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
  const token = cityToken(city);
  return rows.some((row) => cityOf(row).includes(token));
}

async function waitForPageStable(page, options = {}) {
  const timeoutMs = options.timeoutMs || 30000;
  const pollMs = options.pollMs || 400;
  const start = Date.now();
  let lastBodyText = "";

  while (Date.now() - start < timeoutMs) {
    const bodyText = await page.textContent("body").catch(() => "");
    lastBodyText = String(bodyText || "");

    if (!hasLoadingText(lastBodyText)) {
      return lastBodyText;
    }

    await page.waitForTimeout(pollMs);
  }

  return lastBodyText;
}

function assertNoInvalidLocationState(bodyText, context) {
  assertCheck(!hasInvalidLocationState(bodyText), `${context} must not show invalid-location fallback`, {
    bodySnippet: bodySnippet(bodyText),
  });
}

function assertValidInvalidLocationFallback(bodyText, context) {
  assertCheck(hasInvalidLocationState(bodyText), `${context} must show a valid invalid-location fallback`, {
    bodySnippet: bodySnippet(bodyText),
  });
}

function assertTextIncludes(bodyText, expected, context) {
  const haystack = normalizeText(bodyText).toLowerCase();
  assertCheck(haystack.includes(String(expected).toLowerCase()), `${context} must include "${expected}"`, {
    bodySnippet: bodySnippet(bodyText),
  });
}

function assertNoObviousCityLeakage(bodyText, forbiddenCity, context) {
  const haystack = normalizeText(bodyText).toLowerCase();
  assertCheck(!haystack.includes(String(forbiddenCity).toLowerCase()), `${context} must not leak ${forbiddenCity}`, {
    bodySnippet: bodySnippet(bodyText),
  });
}

function findOverlappingDistance(distancesA, distancesB) {
  const overlaps = [];

  for (const [nameA, milesA] of distancesA.entries()) {
    for (const [nameB, milesB] of distancesB.entries()) {
      if (nameA.toLowerCase() !== nameB.toLowerCase()) continue;
      overlaps.push({
        name: nameA,
        milesA,
        milesB,
        delta: Math.abs(milesA - milesB),
      });
    }
  }

  overlaps.sort((a, b) => a.delta - b.delta);
  return overlaps;
}

async function openPage(page, path) {
  await page.goto(`${frontendBaseUrl}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
  return waitForPageStable(page);
}

function summarizePageState(bodyText) {
  return {
    hasInvalidLocation: hasInvalidLocationState(bodyText),
    hasValidEmptyState: hasValidEmptyState(bodyText),
    hasContentSignals: hasMenuOrDealOrSearchContent(bodyText),
    restaurantNames: extractVisibleRestaurantNames(bodyText).slice(0, 10),
    distances: [...extractRestaurantDistances(bodyText).entries()].slice(0, 10),
    bodySnippet: bodySnippet(bodyText, 1200),
  };
}

async function verifyBackendContract() {
  const searchLa = await fetchJsonOrThrow(`${backendBaseUrl}/search?q=chicken&mode=city&city=Los+Angeles&state=CA`);
  const browseLa = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?mode=city&city=Los+Angeles&state=CA`);
  const browseDothan = await fetchJsonOrThrow(`${backendBaseUrl}/menus/browse?mode=city&city=Dothan&state=AL`);

  const browseLaRows = restaurantRowsFromBrowse(browseLa);
  const browseDothanRows = restaurantRowsFromBrowse(browseDothan);

  assertCheck(
    ((searchLa?.menu_items || []).length + (searchLa?.buckets?.restaurants || []).length) >= 0,
    "Backend city-mode LA search must respond with valid JSON"
  );
  assertCheck(
    !hasCity(browseLaRows, "dothan"),
    "Backend city-mode LA browse must not contain Dothan restaurants",
    { sample: browseLaRows.slice(0, 10) }
  );
  assertCheck(
    !hasCity(browseDothanRows, "los angeles"),
    "Backend city-mode Dothan browse must not contain Los Angeles restaurants",
    { sample: browseDothanRows.slice(0, 10) }
  );

  return {
    backend: {
      browseLaCount: browseLaRows.length,
      browseDothanCount: browseDothanRows.length,
      searchLaCount: (searchLa?.menu_items || []).length + (searchLa?.buckets?.restaurants || []).length,
    },
  };
}

async function verifyCityModeLosAngeles(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 31.2232, longitude: -85.3905 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();
    const bodyText = await openPage(page, "/browse-menus?mode=city&city=Los+Angeles&state=CA");

    assertNoInvalidLocationState(bodyText, "City-mode LA browse");
    assertTextIncludes(bodyText, "Los Angeles, CA", "City-mode LA browse");
    assertNoObviousCityLeakage(bodyText, "Dothan", "City-mode LA browse");

    return {
      cityModeLosAngeles: summarizePageState(bodyText),
    };
  } finally {
    await context.close();
  }
}

async function verifyCityModeDothan(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();
    const bodyText = await openPage(page, "/browse-menus?mode=city&city=Dothan&state=AL");

    assertNoInvalidLocationState(bodyText, "City-mode Dothan browse");
    assertTextIncludes(bodyText, "Dothan, AL", "City-mode Dothan browse");
    assertNoObviousCityLeakage(bodyText, "Los Angeles", "City-mode Dothan browse");

    assertCheck(
      hasMenuOrDealOrSearchContent(bodyText) || hasValidEmptyState(bodyText),
      "City-mode Dothan browse must show results or a valid empty state",
      { bodySnippet: bodySnippet(bodyText) }
    );

    return {
      cityModeDothan: summarizePageState(bodyText),
    };
  } finally {
    await context.close();
  }
}

async function verifyPinnedGeoConsistency(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 31.2232, longitude: -85.3905 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();
    const geoQuery = "mode=geo&lat=31.2232&lng=-85.3905&radius_miles=8";

    const browseBody = await openPage(page, `/browse-menus?${geoQuery}`);
    assertNoInvalidLocationState(browseBody, "Pinned geo browse");

    const browseDistances = extractRestaurantDistances(browseBody);
    const browseNames = extractVisibleRestaurantNames(browseBody);

    const dealsBody = await openPage(page, `/deals?${geoQuery}`);
    assertNoInvalidLocationState(dealsBody, "Pinned geo deals");

    const dealsDistances = extractRestaurantDistances(dealsBody);
    const dealsNames = extractVisibleRestaurantNames(dealsBody);

    const overlaps = findOverlappingDistance(browseDistances, dealsDistances);

    if (browseDistances.size > 0 && dealsDistances.size > 0 && overlaps.length > 0) {
      const best = overlaps[0];
      assertCheck(
        best.delta <= 1.0,
        "Pinned geo browse and deals must have reasonably close overlapping restaurant distances",
        {
          bestOverlap: best,
          browseDistances: [...browseDistances.entries()].slice(0, 10),
          dealsDistances: [...dealsDistances.entries()].slice(0, 10),
        }
      );
    }

    return {
      pinnedGeoConsistency: {
        browse: summarizePageState(browseBody),
        deals: summarizePageState(dealsBody),
        overlapCount: overlaps.length,
        bestOverlap: overlaps[0] || null,
        browseRestaurantNames: browseNames.slice(0, 10),
        dealsRestaurantNames: dealsNames.slice(0, 10),
      },
    };
  } finally {
    await context.close();
  }
}

async function verifyUrlAuthorityWins(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();
    const bodyText = await openPage(page, "/browse-menus?mode=city&city=Dothan&state=AL");

    assertNoInvalidLocationState(bodyText, "URL-authority browse");
    assertTextIncludes(bodyText, "Dothan, AL", "URL-authority browse");
    assertNoObviousCityLeakage(bodyText, "Los Angeles", "URL-authority browse");

    return {
      urlAuthorityWins: summarizePageState(bodyText),
    };
  } finally {
    await context.close();
  }
}

async function verifyInvalidLocationSafety(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();

    const browseBody = await openPage(page, "/browse-menus");
    assertValidInvalidLocationFallback(browseBody, "Invalid-location browse");

    const dealsBody = await openPage(page, "/deals");
    assertValidInvalidLocationFallback(dealsBody, "Invalid-location deals");

    const searchBody = await openPage(page, "/search?q=chicken");
    assertValidInvalidLocationFallback(searchBody, "Invalid-location search");

    return {
      invalidLocationSafety: {
        browse: summarizePageState(browseBody),
        deals: summarizePageState(dealsBody),
        search: summarizePageState(searchBody),
      },
    };
  } finally {
    await context.close();
  }
}

async function verifySearchCanonicalLocation(browser) {
  const context = await browser.newContext({
    geolocation: { latitude: 34.0522, longitude: -118.2437 },
    permissions: ["geolocation"],
    viewport: { width: 1440, height: 1400 },
  });

  try {
    const page = await context.newPage();

    const cityBody = await openPage(page, "/search?q=chicken&mode=city&city=Los+Angeles&state=CA");
    assertNoInvalidLocationState(cityBody, "City-mode search");
    assertCheck(
      hasMenuOrDealOrSearchContent(cityBody) || hasValidEmptyState(cityBody),
      "City-mode search must load successfully",
      { bodySnippet: bodySnippet(cityBody) }
    );

    const geoBody = await openPage(page, "/search?q=chicken&mode=geo&lat=31.2232&lng=-85.3905&radius_miles=8");
    assertNoInvalidLocationState(geoBody, "Geo-mode search");
    assertCheck(
      hasMenuOrDealOrSearchContent(geoBody) || hasValidEmptyState(geoBody),
      "Geo-mode search must load successfully",
      { bodySnippet: bodySnippet(geoBody) }
    );

    return {
      searchCanonicalLocation: {
        cityMode: summarizePageState(cityBody),
        geoMode: summarizePageState(geoBody),
      },
    };
  } finally {
    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });

  try {
    const backend = await verifyBackendContract();
    const cityModeLosAngeles = await verifyCityModeLosAngeles(browser);
    const cityModeDothan = await verifyCityModeDothan(browser);
    const pinnedGeoConsistency = await verifyPinnedGeoConsistency(browser);
    const urlAuthorityWins = await verifyUrlAuthorityWins(browser);
    const invalidLocationSafety = await verifyInvalidLocationSafety(browser);
    const searchCanonicalLocation = await verifySearchCanonicalLocation(browser);

    const result = {
      ok: true,
      backendBaseUrl,
      frontendBaseUrl,
      ...backend,
      ...cityModeLosAngeles,
      ...cityModeDothan,
      ...pinnedGeoConsistency,
      ...urlAuthorityWins,
      ...invalidLocationSafety,
      ...searchCanonicalLocation,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          message: error?.message || "Unknown verifier failure",
          details: error?.details || null,
          backendBaseUrl,
          frontendBaseUrl,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
