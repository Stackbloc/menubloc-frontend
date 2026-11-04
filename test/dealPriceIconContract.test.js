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
