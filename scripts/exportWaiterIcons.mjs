import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ICON_DIR = path.join(ROOT, "src/assets/waiter-icons");
const ICONS = [
  "waiter-insight",
  "waiter-question",
  "waiter-presenting",
  "waiter-recommendation",
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 32, height: 32 },
  deviceScaleFactor: 1,
});

for (const name of ICONS) {
  const svgPath = path.join(ICON_DIR, `${name}.svg`);
  const pngPath = path.join(ICON_DIR, `${name}.png`);
  const svg = await fs.readFile(svgPath, "utf8");

  await page.setContent(`
    <!doctype html>
    <html>
      <body style="margin:0;width:32px;height:32px;display:grid;place-items:center;background:transparent;color:#111111;">
        <div style="width:32px;height:32px;display:grid;place-items:center;">
          ${svg.replace("<svg ", '<svg style="width:32px;height:32px;display:block;" ')}
        </div>
      </body>
    </html>
  `);

  await page.screenshot({
    path: pngPath,
    omitBackground: true,
    clip: { x: 0, y: 0, width: 32, height: 32 },
  });
}

await browser.close();
