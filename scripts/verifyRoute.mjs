import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const [, , route = "/", language = "en", slug = "route"] = process.argv;

const baseUrl = process.env.VERIFY_BASE_URL || "http://127.0.0.1:5173";
const outDir = path.resolve(process.cwd(), "verification-output");
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "/Users/andrebarber/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
  });
  const page = await context.newPage();

  await page.addInitScript((lang) => {
    window.localStorage.setItem("grubbid_language", lang);
  }, language);

  const url = new URL(route, baseUrl).toString();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(outDir, `${slug}-${language}.png`),
    fullPage: true,
  });

  const bodyText = await page.locator("body").innerText();
  await fs.writeFile(
    path.join(outDir, `${slug}-${language}.txt`),
    bodyText,
    "utf8",
  );

  console.log(JSON.stringify({
    route,
    language,
    screenshot: path.join(outDir, `${slug}-${language}.png`),
    text: path.join(outDir, `${slug}-${language}.txt`),
    title: await page.title(),
  }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
