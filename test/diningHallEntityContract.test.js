/**
 * Contract: Dining Hall entity type on public profiles + campus dining.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("profile primitives recognize dining halls", () => {
  const src = read("src/components/restaurant/publicProfile/profilePrimitives.jsx");
  assert.match(src, /isDiningHallProfile/);
  assert.match(src, /dining_hall/);
  assert.match(src, /Dining Hall/);
});

test("public profile shell treats dining halls as non-claimable campus facilities", () => {
  const src = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(src, /isDiningHallProfile/);
  assert.match(src, /dining_hall/);
  assert.match(src, /allowClaimInvites/);
  assert.match(src, /cannot be[\s\S]*claimed by restaurant owners/);
  assert.match(src, /dining-hall-public-editorial/);
});

test("restaurant public page suppresses claim invites for dining halls", () => {
  const src = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(src, /dining_hall/);
  assert.match(src, /claimable !== false/);
});

test("primary actions hide order/claim for dining halls", () => {
  const src = read("src/components/restaurant/publicProfile/ProfilePrimaryActions.jsx");
  assert.match(src, /isDiningHall/);
  assert.match(src, /!isDiningHall/);
});
