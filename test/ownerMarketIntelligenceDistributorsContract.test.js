/**
 * Market Intelligence — New distributors reporting contract.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("owner Market Intelligence new distributors", () => {
  it("IntelligenceMarket renders New distributors from new_distributors payload", () => {
    const page = read("src/pages/owner/intelligence/IntelligenceMarket.jsx");
    assert.match(page, /New distributors/);
    assert.match(page, /new_distributors/);
    assert.match(page, /geographic_markets_label/);
    assert.match(page, /No distributors added in this range/);
    assert.match(page, /self-serve join/);
  });
});
