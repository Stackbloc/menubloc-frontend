/**
 * Consumer share URLs must always be absolute https://menuply.com/... links.
 * Guards the recurring share.google / window.location.origin regressions.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  buildClusterShareData,
  buildConsumerPathShareData,
  buildDishShareData,
  buildMenuShareMetadata,
  buildRestaurantShareData,
  buildShareLinks,
  normalizeConsumerShareUrl,
} from "../src/components/share/shareUtils.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("buildMenuShareMetadata emits https://menuply.com canonical menu URL", () => {
  const payload = buildMenuShareMetadata({
    restaurantName: "Savoca",
    restaurantSlug: "savoca-los-angeles",
    restaurantId: 1,
    city: "Los Angeles",
    state: "CA",
  });
  assert.equal(
    payload.url,
    "https://menuply.com/restaurants/california/los-angeles/savoca-los-angeles/menu"
  );
});

test("buildRestaurantShareData and buildDishShareData use menuply.com host", () => {
  const profile = buildRestaurantShareData({
    restaurantName: "Savoca",
    restaurantSlug: "savoca-los-angeles",
    restaurantId: 1,
    city: "Los Angeles",
    state: "CA",
  });
  assert.match(profile.url, /^https:\/\/menuply\.com\//);

  const dish = buildDishShareData({
    restaurant: {
      name: "Savoca",
      slug: "savoca-los-angeles",
      city: "Los Angeles",
      state: "CA",
    },
    menuItem: { id: "abc", name: "Pizza" },
  });
  assert.match(dish.url, /^https:\/\/menuply\.com\//);
});

test("buildClusterShareData uses menuply.com host", () => {
  const cluster = buildClusterShareData({
    cluster: {
      area_name: "L.A. Live",
      name: "L.A. Live",
      city: "Los Angeles",
      state: "California",
      slug: "la-live",
    },
  });
  assert.match(cluster.url, /^https:\/\/menuply\.com\//);
});

test("normalizeConsumerShareUrl rejects share.google and other non-Menuply hosts", () => {
  assert.equal(normalizeConsumerShareUrl("https://share.google/abc123"), "");
  assert.equal(normalizeConsumerShareUrl("https://maps.app.goo.gl/xyz"), "");
  assert.equal(
    normalizeConsumerShareUrl("https://www.menuply.com/restaurants/california/los-angeles/savoca-los-angeles/menu"),
    "https://menuply.com/restaurants/california/los-angeles/savoca-los-angeles/menu"
  );
});

test("buildConsumerPathShareData locks Month in Food paths to menuply.com", () => {
  const payload = buildConsumerPathShareData("/my-menuply/month-in-food?ym=2026-08", {
    title: "My Month in Food on Menuply",
    text: "Great food. Good people. Better together.",
  });
  assert.ok(payload);
  assert.equal(payload.url, "https://menuply.com/my-menuply/month-in-food?ym=2026-08");
  assert.equal(payload.title, "My Month in Food on Menuply");
  assert.equal(buildConsumerPathShareData(""), null);
});

test("buildShareLinks tolerates null/undefined shareData (Diner QR blank-page guard)", () => {
  assert.doesNotThrow(() => buildShareLinks(null));
  assert.doesNotThrow(() => buildShareLinks(undefined));
  const empty = buildShareLinks(null);
  assert.equal(typeof empty.sms, "string");
  assert.equal(typeof empty.email, "string");
  assert.equal(typeof empty.facebook, "string");
});

test("shareUtils must not use window.location.origin for consumer share origin", () => {
  const src = read("src/components/share/shareUtils.js");
  assert.match(src, /CANONICAL_ORIGIN/);
  assert.match(src, /normalizeConsumerShareUrl/);
  assert.match(src, /absoluteCanonicalUrl/);
  // Localhost-only helper is allowed; bare window.location.origin as share origin is not.
  assert.doesNotMatch(
    src,
    /VITE_PUBLIC_APP_URL\s*\|\|\s*getWindowOrigin|origin\s*=\s*envOrigin\s*\|\|\s*getWindowOrigin/
  );
});

test("ShareButton must not auto-invoke navigator.share; FoodTruckPage must not share window.location.href", () => {
  const shareButton = read("src/components/share/ShareButton.jsx");
  assert.match(shareButton, /setIsModalOpen\(true\)/);
  assert.doesNotMatch(shareButton, /await navigator\.share\(/);

  const foodTruck = read("src/pages/FoodTruckPage.jsx");
  assert.doesNotMatch(
    foodTruck,
    /const shareUrl = window\.location\.href/,
    "Food truck share must not use window.location.href"
  );
  assert.match(foodTruck, /normalizeConsumerShareUrl|buildRestaurantShareData/);
});
