/**
 * Deal icon + deal price (Andre 2026-11-04): wherever a dish price shows, a dish with a live deal
 * shows the deal icon, the deal price (whole dollars drop the cents) and a highlighted row; an
 * expired deal shows the regular price again. Deal clips show the icon instead of the word/🏷️.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dealPriceText, dealWasText, formatDealCents, liveItemDeal } from "../src/lib/itemDeal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const active = { deal_id: "49", label: "$9", regular_price_cents: 1795, deal_price_cents: 900, expires_at: "2099-11-08T23:59:59.999Z" };

test("live deal rules", () => {
  const deal = liveItemDeal({ active_deal: active });
  assert.equal(dealPriceText(deal), "$9");
  assert.equal(dealWasText(deal, "$17.95"), "$17.95");
  assert.equal(liveItemDeal({ active_deal: { ...active, expires_at: "2020-01-01T00:00:00Z" } }), null);
  assert.equal(liveItemDeal({}), null);
  assert.equal(formatDealCents(950), "$9.50");
  assert.equal(dealPriceText({ ...deal, dealCents: null, label: "20% off" }), "20% off");
  assert.equal(dealWasText({ ...deal, regularCents: 800 }, "$8.00"), null);
});

test("menu card, cluster lists and Food by type use the deal price + highlight", () => {
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  assert.match(card, /const itemDeal = liveItemDeal\(it\)/);
  assert.match(card, /<DealPriceTag deal=\{itemDeal\}/);
  assert.match(card, /\.\.\.\(itemDeal \? DEAL_ROW_HIGHLIGHT : null\)/);
  const explorer = read("src/components/cluster/ClusterMenuExplorer.jsx");
  assert.match(explorer, /<DealPriceTag deal=\{itemDeal\}/);
  assert.match(explorer, /liveItemDeal\(item\) \? DEAL_ROW_HIGHLIGHT/);
  const fbt = read("src/pages/ClusterFoodByTypePage.jsx");
  assert.match(fbt, /<DealPriceTag deal=\{itemDeal\}/);
  assert.match(fbt, /itemDeal \? DEAL_ROW_HIGHLIGHT/);
});

test("deal clips: the icon replaces 🏷️ and the word Deal", () => {
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.doesNotMatch(swipe, /🏷️/);
  assert.match(swipe, /<DealIcon size=\{22\} ring \/>/);
  assert.doesNotMatch(read("src/components/cluster/video/ClusterVideoHero.jsx"), /"From the clip" : "Deal"/);
  assert.doesNotMatch(read("src/components/cluster/video/ClusterFloatingVideoPlayer.jsx"), /dealTitle \? "Deal"/);
});

test("regular price sits under the deal price, readable (Andre 2026-11-04)", () => {
  const tag = read("src/components/menu/DealPriceTag.jsx");
  assert.match(tag, /flexDirection: "column"/);
  assert.match(tag, /regular price \$\{was\}/);
  assert.doesNotMatch(tag, /opacity: 0\.6/);
});

test("search cards show the deal; the basket and order sheet use the deal price", async () => {
  const card = read("src/components/SearchResultCard.jsx");
  assert.match(card, /data-testid="search-result-deal-price"/);
  assert.match(card, /<DealPriceTag/);
  const sheet = read("src/components/basket/MenuItemOrderSheet.jsx");
  assert.match(sheet, /deal\.dealCents < listedPriceCents/);
  for (const f of ["src/pages/PublicMenuPage.jsx", "src/components/menuCatalog/CatalogMenuRenderer.jsx"]) {
    assert.match(read(f), /active_deal: item\?\.active_deal \?\? null/);
  }
  const { createCartLine } = await import("../src/context/orderCartModel.js");
  const line = createCartLine({
    restaurant: { restaurantId: 78566 },
    item: { menu_item_id: 552051, restaurant_id: 78566, name: "Pasta Carbonara", basePriceCents: 1795, originalBasePriceCents: 1795, active_deal: active },
  });
  assert.equal(line.basePriceCents, 900);
  assert.equal(line.originalBasePriceCents, 1795);
  const expired = createCartLine({
    restaurant: { restaurantId: 78566 },
    item: { menu_item_id: 552051, restaurant_id: 78566, name: "Pasta Carbonara", basePriceCents: 1795, active_deal: { ...active, expires_at: "2020-01-01T00:00:00Z" } },
  });
  assert.equal(expired.basePriceCents, 1795);
});

test("cluster price sort uses the deal price", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /getPriceCents: clusterSortPriceCents/);
  assert.match(page, /deal\?\.dealCents != null \? deal\.dealCents : getConsumerDisplayPrice\(item\)/);
});
