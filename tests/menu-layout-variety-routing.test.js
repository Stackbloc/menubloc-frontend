import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveTemplateMenuStyle } from "../src/components/menu-templates/menuPresentationUtils.js";
import { enrichMenuPayloadWithStyleStockPhotos } from "../src/components/menu-templates/menuStylePreviewEnrichment.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mainContent = readFileSync(
  join(root, "src/components/menu-templates/PublicMenuMainContent.jsx"),
  "utf8",
);
const bistro = readFileSync(
  join(root, "src/components/menu-templates/PremiumBistroMenuTemplate.jsx"),
  "utf8",
);

test("gallery styles resolve to distinct layout IDs", () => {
  assert.equal(resolveTemplateMenuStyle("v1"), "v1");
  assert.equal(resolveTemplateMenuStyle("v12"), "v12");
  assert.equal(resolveTemplateMenuStyle("v13"), "v13");
  assert.equal(resolveTemplateMenuStyle("v14"), "v14");
  assert.equal(resolveTemplateMenuStyle("v15"), "v15");
  assert.equal(resolveTemplateMenuStyle("v16"), "v1");
});

test("PublicMenuMainContent routes gallery styles to photo-forward boutiques", () => {
  assert.match(mainContent, /DarkPremiumMenuTemplate/);
  assert.match(mainContent, /PremiumBistroMenuTemplate/);
  assert.match(mainContent, /ModernAsianMenuTemplate/);
  assert.match(mainContent, /RusticItalianMenuTemplate/);
  assert.match(mainContent, /ClassicMenuTemplate/);
  assert.match(mainContent, /menuStyle === "v12".*DarkPremiumMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v13".*PremiumBistroMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v14".*ModernAsianMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v15".*RusticItalianMenuTemplate/s);
});

test("Premium Bistro does not render fixed green ORDER CTA", () => {
  assert.doesNotMatch(bistro, /background: "#064e49"/);
  assert.doesNotMatch(bistro, /bottom: "calc\(var\(--bottom-nav-h, 70px\) \+ 10px\)"/);
  assert.doesNotMatch(bistro, /textTransform: "uppercase",\s*cursor: "pointer",\s*\}\}\s*>\s*Order/);
});

test("style preview enrichment fills missing item and hero images", () => {
  const live = {
    restaurant_name: "Test2",
    sections: [
      {
        title: "Salads",
        items: [{ name: "Garden Salad", menu_item_id: 1, price_cents: 299 }],
      },
    ],
  };
  const enriched = enrichMenuPayloadWithStyleStockPhotos(live, "v14");
  assert.ok(enriched.hero_image_url || enriched.sections[0].image_url || enriched.sections[0].items[0].image_url);
  assert.equal(enriched.restaurant_name, "Test2");
  assert.equal(enriched.sections[0].items[0].name, "Garden Salad");
  assert.equal(enrichMenuPayloadWithStyleStockPhotos(live, "v1"), live);
});
