/**
 * Menu Manager: post-selection screens show restaurant name · street · city/state
 * via shared OwnerRestaurantContextBar; finder ResultRow shows address_line1.
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

// Shared bar formats name + street (when supplied) + city/state + #id
assert.match(barSrc, /data-testid="owner-restaurant-context-bar"/);
assert.match(barSrc, /#\$\{idNum\}/);
assert.match(barSrc, /metaParts\.join\(" · "\)/);
assert.match(barSrc, /Unknown/);
assert.match(barSrc, /addressLine1/);
assert.match(barSrc, /No address on file/);
assert.match(barSrc, /streetProvided/);

// Review queue stores upload restaurant fields and renders the bar
assert.match(reviewSrc, /import OwnerRestaurantContextBar/);
assert.match(reviewSrc, /setUploadContext\(\{/);
assert.match(reviewSrc, /restaurant_name/);
assert.match(reviewSrc, /<OwnerRestaurantContextBar/);

// Upload detail shows bar + restaurant ID row
assert.match(detailSrc, /import OwnerRestaurantContextBar/);
assert.match(detailSrc, /<OwnerRestaurantContextBar/);
assert.match(detailSrc, /label="Restaurant ID"/);

// Menu editor shows bar from loaded restaurant including address
assert.match(editorSrc, /import OwnerRestaurantContextBar/);
assert.match(editorSrc, /<OwnerRestaurantContextBar/);
assert.match(editorSrc, /restaurant\.city/);
assert.match(editorSrc, /restaurant\.state/);
assert.match(editorSrc, /addressLine1=\{restaurant\.address_line1/);

// Workspace finder: ResultRow address + shared bar for selected restaurant
assert.match(finderSrc, /import OwnerRestaurantContextBar/);
assert.match(finderSrc, /<OwnerRestaurantContextBar/);
assert.match(finderSrc, /Change restaurant/);
assert.match(finderSrc, /address_line1/);
assert.match(finderSrc, /No address on file/);
assert.match(finderSrc, /addressLine1=\{selectedAddress\}/);
assert.match(finderSrc, /postal_code/);
assert.match(finderSrc, /onRequestAddRestaurant/);
assert.match(finderSrc, /No restaurants matched/);
assert.match(finderSrc, /Add restaurant/);

console.log("ownerMenuManagerRestaurantContextContract: ok");
