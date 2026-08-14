/**
 * Narrow-phone menu rows: stack title+price above icons; no fixed-rail truncation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveMenuRowSpacing,
} from "../src/components/menu-templates/menuPresentationUtils.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const wide = resolveMenuRowSpacing(false);
assert.equal(wide.stackTitleAndActions, false);
assert.equal(wide.iconGap, 10);
assert.equal(wide.priceMinWidth, 56);

const narrow = resolveMenuRowSpacing(true);
assert.equal(narrow.stackTitleAndActions, true);
assert.ok(narrow.iconGap < wide.iconGap);
assert.ok(narrow.priceMinWidth < wide.priceMinWidth);

const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
assert.match(card, /TitlePriceActionsBlock/);
assert.match(card, /useIsNarrowMenuViewport/);
assert.match(card, /stackTitleAndActions/);
assert.match(card, /overflowWrap:\s*rowSpacing\.stackTitleAndActions \? ["']anywhere["']/);

const classic = read("src/components/menu-templates/ClassicMenuTemplate.jsx");
assert.match(classic, /whiteSpace:\s*isMobile \? ["']normal["'] : ["']nowrap["']/);

console.log("menuRowNarrowSpacingContract: PASS");
