/**
 * Client Split fields helper for OCR Review Queue glued name cells.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  looksGluedForSplitFields,
  splitGluedMenuItemFields,
  extractPricedFragmentsFromLine,
} from "../src/lib/splitGluedMenuItemLine.js";

describe("splitGluedMenuItemLine", () => {
  it("splits bare-decimal California / Popcorn Lobster glued OCR", () => {
    const line =
      "California Roll 1 11.00 crabmeat, cucumber, avocado Popcorn Lobster Roll 1 7.50";
    const split = splitGluedMenuItemFields(line);
    assert.ok(split);
    assert.match(split.name, /California Roll/i);
    assert.equal(Number(split.price), 11);
    assert.match(String(split.description || ""), /crabmeat|cucumber/i);
    assert.ok(split.fragment_count >= 2);
  });

  it("splits price-before-name 11.00 California Roll…", () => {
    const frags = extractPricedFragmentsFromLine(
      "11.00 California Roll 1 11.00 crabmeat, cucumber, avocado Popcorn Lobster Roll 1 7.50"
    );
    assert.ok(frags.some((f) => /California/i.test(f.name) && Number(f.price) === 11));
    assert.ok(frags.some((f) => /Popcorn/i.test(f.name) && Number(f.price) === 7.5));
  });

  it("does not treat UA 624 as a price", () => {
    const frags = extractPricedFragmentsFromLine("Go UA 624 Catfish Bowl $15.99 fried");
    assert.ok(frags.every((f) => Number(f.price) !== 624));
    assert.ok(frags.some((f) => /Catfish/i.test(f.name)));
  });

  it("looksGluedForSplitFields detects long name with embedded decimal", () => {
    assert.equal(
      looksGluedForSplitFields(
        "California Roll 1 11.00 crabmeat, cucumber, avocado Popcorn Lobster",
        "0"
      ),
      true
    );
    assert.equal(looksGluedForSplitFields("Avocado Roll", "11"), false);
  });
});
