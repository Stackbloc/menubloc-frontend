/**
 * Phase 5 stadium cart contract (one vendor, qty, remove).
 */

import assert from "node:assert/strict";

// Minimal sessionStorage for Node
const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const {
  addStadiumCartItem,
  clearStadiumCart,
  loadStadiumCart,
  removeStadiumCartItem,
  stadiumCartItemCount,
  updateStadiumCartQuantity,
} = await import("../src/lib/stadiumOrderCart.js");

function run() {
  store.clear();
  clearStadiumCart("sofi-stadium");

  const a = addStadiumCartItem("sofi-stadium", {
    item: {
      ck_menu_item_id: 1,
      item_name: "Cheese Pizza Square",
      price: null,
      price_available: false,
      locations: [],
      locations_available: true,
    },
    vendor: { id: 320, slug: "market-pizzas", name: "Market Pizzas" },
    quantity: 1,
  });
  assert.equal(a.ok, true);
  assert.equal(stadiumCartItemCount(a.cart), 1);

  const b = addStadiumCartItem("sofi-stadium", {
    item: {
      ck_menu_item_id: 1,
      item_name: "Cheese Pizza Square",
      price_available: false,
    },
    vendor: { id: 320, slug: "market-pizzas", name: "Market Pizzas" },
    quantity: 1,
  });
  assert.equal(b.cart.items[0].quantity, 2);

  const other = addStadiumCartItem("sofi-stadium", {
    item: { ck_menu_item_id: 9, item_name: "Other", price_available: false },
    vendor: { id: 124, slug: "tokyo-chicken-pilot", name: "Tokyo" },
    quantity: 1,
  });
  assert.equal(other.ok, false);

  updateStadiumCartQuantity("sofi-stadium", 1, 1);
  assert.equal(stadiumCartItemCount(loadStadiumCart("sofi-stadium")), 1);
  removeStadiumCartItem("sofi-stadium", 1);
  assert.equal(stadiumCartItemCount(loadStadiumCart("sofi-stadium")), 0);

  console.log("stadiumOrderCartContract PASS");
}

run();
