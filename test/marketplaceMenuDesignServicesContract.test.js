/**
 * Menu Design services UI contracts — Marketplace, Menu Lab, provider area, CRM.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const page = read("src/pages/operator/OperatorQrKitOrder.jsx");
const menuLab = read("src/pages/operator/OperatorMenuEditor.jsx");
const app = read("src/App.jsx");
const providerApp = read("src/pages/provider/ProviderApp.jsx");
const providerApi = read("src/lib/providerApi.js");
const operatorApi = read("src/lib/operatorApi.js");
const crmPage = read("src/pages/crm/CrmMarketplacePage.jsx");
const crmApi = read("src/lib/crmApi.js");

assert.match(page, /Custom Menu Design/);
assert.match(page, /service_category/);
assert.match(page, /menuply_menu_design/);
assert.match(page, /marketplace-menu-design-panel/);
assert.match(page, /checkoutMarketplaceService/);
assert.match(page, /payment_type=marketplace_service/);
assert.match(page, /Pro Photography/);
assert.match(page, /Graphic Arts/);
assert.match(page, /Coming Soon/);
assert.equal(/VistaPrint/i.test(page) && /submit.*VistaPrint/i.test(page), false);

assert.match(menuLab, /menu-lab-redesign-my-menu/);
assert.match(menuLab, /Redesign My Menu/);
assert.match(menuLab, /service_category=menuply_menu_design/);
assert.match(menuLab, /\/operator\/marketplace\?service_category=menuply_menu_design/);
assert.match(menuLab, /menu_id=/);

assert.match(app, /path="\/provider\/\*"/);
assert.match(providerApp, /Apply as Menu Designer/);
assert.match(providerApp, /account\/login/);
assert.match(providerApi, /\/api\/provider\/me/);
assert.match(providerApi, /\/api\/provider\/listings/);

assert.match(operatorApi, /marketplace-services\/checkout/);
assert.match(operatorApi, /marketplace-services\/listings/);

assert.match(crmPage, /crm-marketplace-providers/);
assert.match(crmPage, /Mark payout paid \(manual\)/);
assert.match(crmApi, /\/api\/crm\/marketplace\/providers/);
assert.match(crmApi, /\/api\/crm\/marketplace\/service-projects/);

console.log("marketplaceMenuDesignServicesContract.test.js: ok");
