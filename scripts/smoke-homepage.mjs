#!/usr/bin/env node
/**
 * Runtime smoke: load / and report first pageerror + root content length.
 * Usage: node scripts/smoke-homepage.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://localhost:5173/";

let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "chrome" });
} catch {
  browser = await chromium.launch({ headless: true });
}
const page = await browser.newPage();
const errors = [];

page.on("pageerror", (err) => errors.push({ type: "pageerror", message: err.message, stack: err.stack }));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ type: "console", message: msg.text() });
});

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
} catch (err) {
  console.error("NAVIGATION_FAILED", err.message);
  process.exit(1);
}

const rootText = await page.locator("#root").innerText().catch(() => "");
const rootHtml = await page.locator("#root").innerHTML().catch(() => "");

console.log("URL", baseUrl);
console.log("ROOT_TEXT_LEN", rootText.length);
console.log("ROOT_PREVIEW", rootText.slice(0, 300).replace(/\n/g, " "));
console.log("FIRST_FATAL", errors[0] ? JSON.stringify(errors[0], null, 2) : "none");
console.log("ERROR_COUNT", errors.length);
if (errors.length) {
  console.log("ALL_ERRORS", JSON.stringify(errors.slice(0, 5), null, 2));
}

await browser.close();
process.exit(rootText.length < 10 && errors.length > 0 ? 1 : rootText.length < 10 ? 2 : 0);
