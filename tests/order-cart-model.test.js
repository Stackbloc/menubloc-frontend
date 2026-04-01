import test from "node:test";
import assert from "node:assert/strict";
import { itemHasRequiredModifiers } from "../src/components/basket/modifierModel.js";
import {
  addItemToCart,
  buildCheckoutItems,
  getCartSummary,
} from "../src/context/orderCartModel.js";

const restaurant = {
  restaurantId: 42,
  restaurantName: "River Cafe",
};

test("addItemToCart keeps same-item adds in the same basket line", () => {
  const first = addItemToCart(
    { restaurant: null, items: [] },
    {
      restaurant,
      item: {
        menuItemId: 101,
        name: "Chicken Sandwich",
        basePriceCents: 1299,
      },
    }
  );

  const second = addItemToCart(first.cart, {
    restaurant,
    item: {
      menuItemId: 101,
      name: "Chicken Sandwich",
      basePriceCents: 1299,
    },
  });

  assert.equal(second.ok, true);
  assert.equal(second.cart.items.length, 1);
  assert.equal(second.cart.items[0].quantity, 2);

  const summary = getCartSummary(second.cart);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.subtotalCents, 2598);
});

test("addItemToCart keeps modifier variants as separate lines", () => {
  const first = addItemToCart(
    { restaurant: null, items: [] },
    {
      restaurant,
      item: {
        menuItemId: 101,
        name: "Chicken Sandwich",
        basePriceCents: 1299,
        modifiers: [{ groupId: "size", optionId: "regular", name: "Regular", priceDeltaCents: 0 }],
      },
    }
  );

  const second = addItemToCart(first.cart, {
    restaurant,
    item: {
      menuItemId: 101,
      name: "Chicken Sandwich",
      basePriceCents: 1299,
      modifiers: [{ groupId: "size", optionId: "large", name: "Large", priceDeltaCents: 200 }],
    },
  });

  assert.equal(second.ok, true);
  assert.equal(second.cart.items.length, 2);
  assert.equal(second.cart.items[0].lineTotalCents, 1299);
  assert.equal(second.cart.items[1].lineTotalCents, 1499);
});

test("addItemToCart blocks mixed-restaurant baskets", () => {
  const first = addItemToCart(
    { restaurant: null, items: [] },
    {
      restaurant,
      item: {
        menuItemId: 101,
        name: "Chicken Sandwich",
        basePriceCents: 1299,
      },
    }
  );

  const blocked = addItemToCart(first.cart, {
    restaurant: {
      restaurantId: 99,
      restaurantName: "Other Place",
    },
    item: {
      menuItemId: 202,
      name: "Fries",
      basePriceCents: 399,
    },
  });

  assert.equal(blocked.ok, false);
  assert.match(blocked.message, /already has items from River Cafe/i);
  assert.equal(blocked.cart.items.length, 1);
});

test("buildCheckoutItems aggregates basket lines by menu item id", () => {
  const checkoutItems = buildCheckoutItems([
    {
      lineId: "line-1",
      menuItemId: 101,
      quantity: 1,
    },
    {
      lineId: "line-2",
      menuItemId: 101,
      quantity: 2,
    },
    {
      lineId: "line-3",
      menuItemId: 202,
      quantity: 1,
    },
  ]);

  assert.deepEqual(checkoutItems, [
    { menuItemId: 101, quantity: 3 },
    { menuItemId: 202, quantity: 1 },
  ]);
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
