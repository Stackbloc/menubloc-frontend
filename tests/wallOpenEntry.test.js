import test from "node:test";
import assert from "node:assert/strict";
import { wallOpenEntry } from "../src/lib/wallOpenEntry.js";

test("a printed Wall QR counts as qr", () => {
  assert.equal(wallOpenEntry({ search: "?ref=qr" }), "qr");
});

test("other visits stay direct", () => {
  assert.equal(wallOpenEntry({}), "direct");
  assert.equal(wallOpenEntry({ search: "?ref=wall_share" }), "direct");
});

test("a Menuply screen wins over the link tag", () => {
  assert.equal(wallOpenEntry({ fromMenuply: true, search: "?ref=qr" }), "menuply");
  assert.equal(wallOpenEntry({ wallEntry: "shared_post", search: "?ref=qr" }), "shared_post");
});
