import assert from "node:assert/strict";
import test from "node:test";
import { formatDinerPeerLabel, formatDinerPublicName } from "../src/lib/dinerPublicIdentity.js";

test("formatDinerPeerLabel never falls back to member numbers", () => {
  const label = formatDinerPeerLabel({ id: 124, display_name: null });
  assert.equal(label, "Diner");
  assert.equal(label.includes("#"), false);
  assert.equal(label.includes("124"), false);
});

test("formatDinerPeerLabel formats first name and last initial from profile fields", () => {
  assert.equal(
    formatDinerPeerLabel({
      id: 124,
      first_name: "Andre",
      last_name: "Barber",
      display_name: "",
    }),
    "Andre B."
  );
});

test("formatDinerPeerLabel parses legacy display_name when columns empty", () => {
  assert.equal(
    formatDinerPeerLabel({
      id: 124,
      display_name: "Andre Barber",
    }),
    "Andre B."
  );
});

test("formatDinerPublicName keeps chosen screen names", () => {
  assert.equal(
    formatDinerPublicName({
      first_name: "Andre",
      last_name: "Barber",
      display_name: "Chef Andre",
    }),
    "Chef Andre"
  );
});
