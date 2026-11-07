/**
 * Post-build: publishes dist/seo-pages.json for the SEO Bot. Any route in
 * src/App.jsx that public/seo-pages.json doesn't list yet is added as kind "new",
 * so a new page type is checked from the first deploy and shows on Owner → Bots →
 * SEO Bot as "New — not decided yet" until someone classifies it.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { appRoutes, withNewRoutes } from "../src/lib/seo/seoPagesCatalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(root, "public/seo-pages.json"), "utf8"));
const routes = appRoutes(readFileSync(join(root, "src/App.jsx"), "utf8"));
const published = withNewRoutes(catalog, routes);
const added = published.pages.length - catalog.pages.length;

if (!existsSync(join(root, "dist"))) {
  console.error("[buildSeoPages] dist/ missing — run after vite build");
  process.exit(1);
}
writeFileSync(join(root, "dist/seo-pages.json"), `${JSON.stringify(published, null, 1)}\n`);
console.log(`[buildSeoPages] ${published.pages.length} page types${added ? ` (${added} new, not decided yet: ${published.pages.slice(-added).map((p) => p.route).join(", ")})` : ""}`);
