/**
 * Menu Manager: post-selection screens show restaurant name · #id · city, state
 * via shared OwnerRestaurantContextBar.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ownerDir = path.join(ROOT, "src/pages/owner");

const barSrc = fs.readFileSync(path.join(ownerDir, "OwnerRestaurantContextBar.jsx"), "utf8");
const reviewSrc = fs.readFileSync(path.join(ownerDir, "OwnerMenuUploadReviewItems.jsx"), "utf8");
const detailSrc = fs.readFileSync(path.join(ownerDir, "OwnerMenuUploadDetail.jsx"), "utf8");
const editorSrc = fs.readFileSync(path.join(ownerDir, "OwnerMenuEditorPage.jsx"), "utf8");
const finderSrc = fs.readFileSync(path.join(ownerDir, "OwnerMenuRestaurantFinder.jsx"), "utf8");

// Shared bar formats name + #id + city/state
assert.match(barSrc, /data-testid="owner-restaurant-context-bar"/);
assert.match(barSrc, /#\$\{idNum\}/);
assert.match(barSrc, /metaParts\.join\(" · "\)/);
assert.match(barSrc, /Unknown/);

// Review queue stores upload restaurant fields and renders the bar
assert.match(reviewSrc, /import OwnerRestaurantContextBar/);
assert.match(reviewSrc, /setUploadContext\(\{/);
assert.match(reviewSrc, /restaurant_name/);
assert.match(reviewSrc, /<OwnerRestaurantContextBar/);

// Upload detail shows bar + restaurant ID row
assert.match(detailSrc, /import OwnerRestaurantContextBar/);
assert.match(detailSrc, /<OwnerRestaurantContextBar/);
assert.match(detailSrc, /label="Restaurant ID"/);

// Menu editor shows bar from loaded restaurant
assert.match(editorSrc, /import OwnerRestaurantContextBar/);
assert.match(editorSrc, /<OwnerRestaurantContextBar/);
assert.match(editorSrc, /restaurant\.city/);
assert.match(editorSrc, /restaurant\.state/);

// Workspace finder reuses shared bar for selected restaurant
assert.match(finderSrc, /import OwnerRestaurantContextBar/);
assert.match(finderSrc, /<OwnerRestaurantContextBar/);
assert.match(finderSrc, /Change restaurant/);

console.log("ownerMenuManagerRestaurantContextContract: ok");
