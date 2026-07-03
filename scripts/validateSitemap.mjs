import { load } from "cheerio";

const base = String(process.env.SITEMAP_BASE_URL || "https://menuply.com").replace(/\/$/, "");
const concurrency = Math.max(1, Number(process.env.SITEMAP_VALIDATION_CONCURRENCY || 8));

async function fetchText(url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options });
  return { response, text: await response.text() };
}

function xmlLocations(xml, element) {
  const $ = load(xml, { xmlMode: true });
  return $(element).map((_, node) => $(node).text().trim()).get().filter(Boolean);
}

async function loadSitemapUrls() {
  const root = await fetchText(`${base}/sitemap.xml`);
  if (root.response.status !== 200) throw new Error(`sitemap.xml returned ${root.response.status}`);
  const childSitemaps = xmlLocations(root.text, "sitemap > loc");
  if (!childSitemaps.length) return xmlLocations(root.text, "url > loc");

  const urls = [];
  for (const child of childSitemaps) {
    const result = await fetchText(child);
    if (result.response.status !== 200) throw new Error(`${child} returned ${result.response.status}`);
    urls.push(...xmlLocations(result.text, "url > loc"));
  }
  return urls;
}

function robotsBlocks(robots, url) {
  const pathname = new URL(url).pathname;
  let applies = false;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") applies = value === "*";
    if (applies && key === "disallow" && value && pathname.startsWith(value)) return true;
  }
  return false;
}

async function validateUrl(url, robots) {
  const failures = [];
  if (!url.startsWith(`${base}/`) && url !== `${base}/`) failures.push("external URL");
  if (robotsBlocks(robots, url)) failures.push("blocked by robots.txt");

  const { response, text } = await fetchText(url);
  if (response.status !== 200) failures.push(`HTTP ${response.status}`);
  if (response.status >= 300 && response.status < 400) failures.push(`redirects to ${response.headers.get("location") || "unknown"}`);
  if (/\bnoindex\b/i.test(response.headers.get("x-robots-tag") || "")) failures.push("X-Robots-Tag noindex");

  const $ = load(text);
  const canonical = $('link[rel="canonical"]').first().attr("href") || "";
  if (canonical !== url) failures.push(`canonical mismatch (${canonical || "missing"})`);
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  if (/\bnoindex\b/i.test(robotsMeta)) failures.push("meta robots noindex");
  const title = $("title").text().trim();
  const visibleText = $("body").text().replace(/\s+/g, " ").trim();
  if (/\b(404|page not found|not found)\b/i.test(`${title} ${visibleText.slice(0, 1000)}`)) failures.push("soft-404 signature");

  const outgoing = $("a[href]").map((_, node) => {
    try { return new URL($(node).attr("href"), url).toString(); } catch { return null; }
  }).get().filter(Boolean);

  return { url, failures, outgoing };
}

async function main() {
  const [{ text: robots }, urls] = await Promise.all([
    fetchText(`${base}/robots.txt`),
    loadSitemapUrls(),
  ]);
  const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
  if (duplicates.length) throw new Error(`Duplicate sitemap URLs: ${[...new Set(duplicates)].join(", ")}`);

  const results = new Array(urls.length);
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++;
      results[index] = await validateUrl(urls[index], robots);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length || 1) }, worker));

  const sitemapSet = new Set(urls);
  const inbound = new Map(urls.map((url) => [url, new Set()]));
  for (const result of results) {
    for (const target of result.outgoing) {
      if (sitemapSet.has(target) && target !== result.url) inbound.get(target).add(result.url);
    }
  }
  for (const result of results) {
    if (!inbound.get(result.url)?.size) result.failures.push("no internal link from another sitemap page");
  }
  const failedAfterLinkCheck = results.filter((result) => result.failures.length);
  if (failedAfterLinkCheck.length) {
    for (const result of failedAfterLinkCheck) console.error(`FAIL ${result.url}: ${result.failures.join("; ")}`);
    throw new Error(`${failedAfterLinkCheck.length}/${urls.length} sitemap URLs failed crawlability validation`);
  }
  console.log(`PASS ${urls.length} sitemap URLs: HTTP 200, no redirect, self-canonical, internally linked, indexable, robots-allowed, no soft-404 signature`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
