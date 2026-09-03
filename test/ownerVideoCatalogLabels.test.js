import assert from "node:assert/strict";
import test from "node:test";
import { formatOwnerVideoCreatorLabel } from "../src/lib/ownerVideoCatalogLabels.js";

test("formatOwnerVideoCreatorLabel — owner managed upload is Platform video", () => {
  assert.equal(
    formatOwnerVideoCreatorLabel({
      video_kind: "managed",
      creator_type: "platform",
      is_guest: false,
    }),
    "Platform video"
  );
});

test("formatOwnerVideoCreatorLabel — guest ate upload is Guest video", () => {
  assert.equal(
    formatOwnerVideoCreatorLabel({
      video_kind: "ate",
      creator_type: "guest",
      is_guest: true,
    }),
    "Guest video"
  );
});

test("formatOwnerVideoCreatorLabel — signed-in diner is not Guest video", () => {
  assert.equal(
    formatOwnerVideoCreatorLabel({
      video_kind: "ate",
      creator_type: "diner",
      is_guest: false,
    }),
    "Diner"
  );
});

test("formatOwnerVideoCreatorLabel — deal and venue kinds", () => {
  assert.equal(
    formatOwnerVideoCreatorLabel({ video_kind: "deal", creator_type: "deal", is_guest: false }),
    "Deal"
  );
  assert.equal(
    formatOwnerVideoCreatorLabel({ video_kind: "event", creator_type: "venue", is_guest: false }),
    "Venue"
  );
});
