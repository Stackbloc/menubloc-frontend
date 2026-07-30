import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("CRM leads live restaurant search contract", () => {
  it("crmApi exposes live restaurant search and geo cities helpers", () => {
    const src = read("src/lib/crmApi.js");
    assert.match(src, /export const searchCrmRestaurants/);
    assert.match(src, /\/api\/crm\/restaurants\/search/);
    assert.match(src, /export const getCrmGeoCities/);
    assert.match(src, /\/api\/crm\/geo\/cities/);
  });

  it("lead list uses state/city selects and live restaurant search mode", () => {
    const src = read("src/pages/crm/CrmLeadList.jsx");
    assert.match(src, /US_STATE_OPTIONS/);
    assert.match(src, /getCrmGeoCities/);
    assert.match(src, /searchCrmRestaurants/);
    assert.match(src, /addCrmSeedRestaurantLead/);
    assert.match(src, /aria-label="State"/);
    assert.match(src, /aria-label="City"/);
    assert.match(src, /Search live restaurants/);
    assert.match(src, /LIVE_SEARCH_MIN/);
    assert.match(src, /SEARCH_DEBOUNCE_MS/);
    assert.match(src, /Live restaurant profiles/);
    assert.match(src, /Add lead/);
    assert.match(src, /Open lead/);
  });
});
