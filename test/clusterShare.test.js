import test from "node:test";
import assert from "node:assert/strict";
import { buildClusterShareData } from "../src/components/share/shareUtils.js";

test("buildClusterShareData returns canonical cluster share payload with OG image", () => {
  const payload = buildClusterShareData({
    cluster: {
      name: "L.A. Live",
      slug: "la-live",
      type: "entertainment_complex",
      city: "Los Angeles",
      state: "CA",
      restaurant_count: 16,
      area_name: "L.A. Live",
      page_title: "L.A. Live Area Restaurants",
      share_title: "L.A. Live Area Restaurants | Menuply",
      share_description:
        "Browse menu information for restaurants around L.A. Live. Menuply is an independent menu discovery platform.",
      og_image_url: "https://menubloc-backend-production.up.railway.app/public/clusters/la-live/og-image",
    },
    origin: "https://menuply.com",
  });

  assert.equal(payload.title, "L.A. Live Area Restaurants | Menuply");
  assert.equal(payload.url, "https://menuply.com/clusters/ca/los-angeles/la-live");
  assert.equal(
    payload.image,
    "https://menubloc-backend-production.up.railway.app/public/clusters/la-live/og-image"
  );
  assert.match(payload.description, /independent menu discovery platform/);
  assert.match(payload.description, /L\.A\. Live/);
  assert.doesNotMatch(payload.description, /official|partner|sponsored|endorsed|affiliated/i);
});
