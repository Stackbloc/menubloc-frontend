import test from "node:test";
import assert from "node:assert/strict";
import {
  applyClusterZoneAndPriceSort,
  collectClusterZones,
  filterItemsByZone,
  getClusterDiningByZoneHeading,
  getClusterZoneNoun,
} from "../src/lib/clusterZoneBrowse.js";

test("zone nouns are type-aware for airport and stadium", () => {
  assert.equal(getClusterZoneNoun({ type: "airport" }), "Terminal");
  assert.equal(getClusterZoneNoun({ type: "stadium" }), "Section");
  assert.equal(getClusterZoneNoun({ type: "entertainment_complex" }), "Area");
  assert.equal(getClusterDiningByZoneHeading({ type: "airport" }), "Dining by terminal");
  assert.equal(getClusterDiningByZoneHeading({ type: "stadium" }), "Dining by section");
  assert.equal(getClusterDiningByZoneHeading({ type: "university" }), "Dining by area");
});

test("collectClusterZones returns distinct sorted areas", () => {
  const zones = collectClusterZones([
    { name: "a", area: "Terminal 4" },
    { name: "b", area: "Terminal 1" },
    { name: "c", area: "Terminal 4" },
    { name: "d", area: "  " },
    { name: "e" },
  ]);
  assert.deepEqual(zones, ["Terminal 1", "Terminal 4"]);
});

test("filter then price sort scopes Low-High within a terminal/section", () => {
  const items = [
    { name: "A", area: "Terminal 1", price: 12 },
    { name: "B", area: "Terminal 4", price: 5 },
    { name: "C", area: "Terminal 4", price: 9 },
    { name: "D", area: "Terminal 4", price: null },
  ];
  const getPriceCents = (item) => (item.price == null ? null : Math.round(item.price * 100));

  const filtered = filterItemsByZone(items, "Terminal 4");
  assert.deepEqual(
    filtered.map((row) => row.name),
    ["B", "C", "D"],
  );

  const sorted = applyClusterZoneAndPriceSort(items, {
    zone: "Terminal 4",
    priceSort: "asc",
    getPriceCents,
  });
  assert.deepEqual(
    sorted.map((row) => row.name),
    ["B", "C", "D"],
  );

  const stadiumSorted = applyClusterZoneAndPriceSort(
    [
      { name: "Hot dog", area: "Plaza Concourse", price: 8 },
      { name: "Burger", area: "Plaza Concourse", price: 14 },
      { name: "Nachos", area: "Terrace Concourse", price: 6 },
    ],
    {
      zone: "Plaza Concourse",
      priceSort: "desc",
      getPriceCents,
    },
  );
  assert.deepEqual(
    stadiumSorted.map((row) => row.name),
    ["Burger", "Hot dog"],
  );
});

test("no zone filter leaves full list for price sort", () => {
  const items = [
    { name: "A", area: "Terminal 1", price: 12 },
    { name: "B", area: "Terminal 4", price: 5 },
  ];
  const sorted = applyClusterZoneAndPriceSort(items, {
    zone: null,
    priceSort: "asc",
    getPriceCents: (item) => Math.round(item.price * 100),
  });
  assert.deepEqual(
    sorted.map((row) => row.name),
    ["B", "A"],
  );
});
