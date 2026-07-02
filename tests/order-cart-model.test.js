import test from "node:test";
import assert from "node:assert/strict";
import { itemHasRequiredModifiers } from "../src/components/basket/modifierModel.js";
import {
  addItemToCart,
  buildCheckoutItems,
  getCartSummary,
} from "../src/context/orderCartModel.js";

test("buildCheckoutItems preserves line-level modifiers for checkout pricing", () => {
  const items = buildCheckoutItems([
    {
      lineId: "line-1",
      restaurantId: 12,
      menuItemId: 44,
      name: "Burger",
      quantity: 2,
      basePriceCents: 1200,
      modifiers: [
        {
          groupId: "protein",
          optionId: "double",
          name: "Double Patty",
          priceDeltaCents: 300,
        },
      ],
    },
  ]);

  assert.deepEqual(items, [
    {
      lineId: "line-1",
      menuItemId: 44,
      quantity: 2,
      modifiers: [
        {
          groupId: "protein",
          optionId: "double",
          name: "Double Patty",
          priceDeltaCents: 300,
        },
      ],
    },
  ]);
});

test("addItemToCart keeps a single-restaurant basket and merges identical lines", () => {
  const first = addItemToCart(
    { restaurant: null, items: [] },
    {
      restaurant: { restaurantId: 9, restaurantName: "Test Kitchen" },
      item: {
        menuItemId: 101,
        name: "Fries",
        quantity: 1,
        basePriceCents: 450,
      },
    }
  );

  assert.equal(first.ok, true);

  const second = addItemToCart(first.cart, {
    restaurant: { restaurantId: 9, restaurantName: "Test Kitchen" },
    item: {
      menuItemId: 101,
      name: "Fries",
      quantity: 1,
      basePriceCents: 450,
    },
  });

  assert.equal(second.ok, true);
  assert.equal(second.cart.items.length, 1);
  assert.equal(second.cart.items[0].quantity, 2);
  const summary = getCartSummary(second.cart);
  assert.equal(summary.restaurant.restaurantId, 9);
  assert.equal(summary.restaurant.restaurantName, "Test Kitchen");
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.subtotalCents, 900);
});

test("addItemToCart rejects cross-restaurant adds without replacing implicitly", () => {
  const seed = addItemToCart(
    { restaurant: null, items: [] },
    {
      restaurant: { restaurantId: 9, restaurantName: "Test Kitchen" },
      item: {
        menuItemId: 101,
        name: "Fries",
        quantity: 1,
        basePriceCents: 450,
      },
    }
  );

  const blocked = addItemToCart(seed.cart, {
    restaurant: { restaurantId: 14, restaurantName: "Other Place" },
    item: {
      menuItemId: 201,
      name: "Taco",
      quantity: 1,
      basePriceCents: 650,
    },
  });

  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /already has items from Test Kitchen/i);
  assert.equal(blocked.cart.restaurant.restaurantId, 9);
  assert.equal(blocked.cart.items.length, 1);
});

test("itemHasRequiredModifiers detects required modifier groups", () => {
  assert.equal(
    itemHasRequiredModifiers({
      modifier_groups: [
        {
          id: "size",
          required: true,
          options: [{ id: "small", name: "Small" }],
        },
      ],
    }),
    true
  );

  assert.equal(
    itemHasRequiredModifiers({
      modifier_groups: [
        {
          id: "extras",
          required: false,
          options: [{ id: "cheese", name: "Cheese" }],
        },
      ],
    }),
    false
  );
});
