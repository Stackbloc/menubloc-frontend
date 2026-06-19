import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "http://localhost:5174";
const OUT_DIR = path.join(__dirname, "../docs/ui-audits/screenshots/after");
mkdirSync(OUT_DIR, { recursive: true });

const SHOTS = [
  { name: "terms-hero",        path: "/terms",                        h: 700 },
  { name: "terms-body",        path: "/terms",                        h: 600, scrollY: 400 },
  { name: "privacy-hero",      path: "/privacy",                      h: 700 },
  { name: "about-hero",        path: "/about",                        h: 700 },
  { name: "about-body",        path: "/about",                        h: 600, scrollY: 400 },
  { name: "contact-hero",      path: "/contact",                      h: 700 },
  { name: "signup-entry-top",  path: "/restaurant/signup",            h: 700 },
  { name: "signup-account-top",path: "/restaurant/signup/account",    h: 700 },
  { name: "homepage-footer",   path: "/",                             h: 200, scrollY: 99999 },
  { name: "toppicks-top",      path: "/top-picks",                    h: 600 },
  { name: "browse-top",        path: "/browse-menus?city=Los+Angeles&state=CA", h: 400 },
  { name: "checkout-top",      path: "/checkout",                     h: 500 },
  { name: "homepage",          path: "/",                             h: 800, full: true },
  { name: "search",            path: "/search?q=burger&city=Los+Angeles&state=CA", h: 800, full: true },
  { name: "waiter",            path: "/waiter",                       h: 800 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const { name, path: p, h, scrollY, full } of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE_URL + p, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(2000);
      if (scrollY) await page.evaluate(y => window.scrollTo(0, y), scrollY);
      await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: !!full });
      console.log("✓", name);
    } catch (e) {
      console.error("✗", name, e.message);
    } finally {
      await ctx.close();
    }
  }
  await browser.close();
  console.log("\nDone →", OUT_DIR);
}
main().catch(e => { console.error(e); process.exit(1); });
