import test from "node:test";
import assert from "node:assert/strict";
import { resolvePublicMenuAddressDisplay } from "../src/lib/displayAddress.js";

test("food truck menu prefers current_pickup_address without a Current Location label field", () => {
  const display = resolvePublicMenuAddressDisplay(
    {
      address_line1: "900 Olympic Blvd",
      city: "Los Angeles",
      state: "CA",
      zip: "90015",
      current_pickup_location: {
        current_pickup_address: "123 Truck Row, Los Angeles, CA 90012",
        current_pickup_lat: 34.05,
        current_pickup_lng: -118.25,
      },
    },
    { isFoodTruck: true }
  );

  assert.match(display.addressLine1, /123 Truck Row/i);
  assert.doesNotMatch(display.addressLine1, /Current Location/i);
  assert.doesNotMatch(display.addressLine || "", /Current Location/i);
  assert.equal(display.usedCurrentPickup, true);
  assert.match(display.directionsHref, /34\.05/);
});

test("food truck menu falls back to home address when pickup missing", () => {
  const display = resolvePublicMenuAddressDisplay(
    {
      address_line1: "900 Olympic Blvd",
      city: "Los Angeles",
      state: "CA",
      zip: "90015",
      current_pickup_location: null,
    },
    { isFoodTruck: true }
  );

  assert.equal(display.addressLine1, "900 Olympic Blvd");
  assert.match(display.addressLine2, /Los Angeles/);
  assert.equal(display.usedCurrentPickup, false);
});

test("non-food-truck menu ignores pickup and uses home address", () => {
  const display = resolvePublicMenuAddressDisplay(
    {
      address_line1: "100 Main St",
      city: "Los Angeles",
      state: "CA",
      zip: "90012",
      current_pickup_location: {
        current_pickup_address: "Should Not Show",
      },
    },
    { isFoodTruck: false }
  );

  assert.equal(display.addressLine1, "100 Main St");
  assert.equal(display.usedCurrentPickup, false);
});
