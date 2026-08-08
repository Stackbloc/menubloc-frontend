/**
 * Distributor Network MVP portal mount + operator relationships contracts.
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

describe("distributor network portal contracts", () => {
  it("App mounts distributor routes and provider", () => {
    const app = read("src/App.jsx");
    assert.match(app, /DistributorProvider/);
    assert.match(app, /\/distributor\/login/);
    assert.match(app, /\/distributor\/search/);
    assert.match(app, /\/distributor\/messages/);
    assert.match(app, /\/operator\/distributor-relationships/);
    assert.match(app, /DistributorRoute/);
  });

  it("DistributorLogin uses AuthPageFrame (not OperatorLogin)", () => {
    const login = read("src/pages/distributor/DistributorLogin.jsx");
    assert.match(login, /AuthPageFrame/);
    assert.match(login, /Distributor sign in/);
    assert.doesNotMatch(login, /OperatorLogin/);
  });

  it("distributorApi uses Railway fallback and distributor search path", () => {
    const api = read("src/lib/distributorApi.js");
    assert.match(api, /DEFAULT_PROD_API_BASE/);
    assert.match(api, /menubloc-backend-production\.up\.railway\.app/);
    assert.match(api, /\/distributor\/auth\/login/);
    assert.match(api, /\/distributor\/restaurants\/search/);
    assert.doesNotMatch(api, /fetch\("\/search/);
  });

  it("operator relationships API + nav + page wiring", () => {
    const opApi = read("src/lib/operatorApi.js");
    assert.match(opApi, /distributor-relationships/);
    assert.match(opApi, /acceptDistributorRelationship/);

    const layout = read("src/pages/operator/OperatorLayout.jsx");
    assert.match(layout, /distributor-relationships/);
    assert.match(layout, /Distributor Relationships/);

    const opPage = read("src/pages/operator/OperatorDistributorRelationships.jsx");
    assert.match(opPage, /wants to connect/);
    assert.match(opPage, /acceptDistributorRelationship/);
  });

  it("OperatorLogin AuthPageFrame unchanged by this feature", () => {
    const operatorLogin = read("src/pages/operator/OperatorLogin.jsx");
    assert.match(operatorLogin, /AuthPageFrame/);
  });
});
