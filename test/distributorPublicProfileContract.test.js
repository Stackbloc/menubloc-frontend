/**
 * Public distributor profile route + API client contracts.
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

describe("distributor public profile contracts", () => {
  it("routes /distributors/:slug and does not collide with /distributor portal", () => {
    const app = read("src/App.jsx");
    assert.match(app, /\/distributors\/:slug/);
    assert.match(app, /DistributorPublicPage/);
    assert.match(app, /\/distributor\/login/);
  });

  it("api helper uses shared apiGet / Railway fallback path", () => {
    const api = read("src/lib/api.js");
    assert.match(api, /fetchPublicDistributor/);
    assert.match(api, /\/public\/distributors\//);
    assert.match(api, /DEFAULT_PROD_API_BASE/);
  });

  it("page omits empty sections and reserves offer slot without fake offers", () => {
    const page = read("src/pages/DistributorPublicPage.jsx");
    assert.match(page, /has_website/);
    assert.match(page, /has_description/);
    assert.match(page, /data-distributor-offer-slot/);
    assert.doesNotMatch(page, /\$50 off/);
    assert.doesNotMatch(page, /Restaurants reporting/);
    assert.match(page, /Visit Website/);
    assert.match(page, /Connect with/);
    assert.match(page, /operator\/distributor-relationships/);
  });
});
