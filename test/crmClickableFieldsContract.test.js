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

describe("CRM clickable fields contract", () => {
  it("dashboard stat tiles and chips deep-link to filtered lists", () => {
    const src = read("src/pages/crm/CrmDashboard.jsx");
    assert.match(src, /to="\/crm\/leads\?open_only=true"/);
    assert.match(src, /to="\/crm\/leads\?status=new"/);
    assert.match(src, /pipeline_stages=engaged,demo,trial,negotiation/);
    assert.match(src, /to="\/crm\/leads\?won_this_month=true"/);
    assert.match(src, /to="\/crm\/leads\?lost_this_month=true"/);
    assert.match(src, /to="\/crm\/tasks\?overdue_only=true"/);
    assert.match(src, /to="\/crm\/tasks\?due_today=true"/);
    assert.match(src, /linkForKey=\{\(key\) => `\/crm\/leads\?source=/);
    assert.match(src, /linkForKey=\{\(key\) => `\/crm\/leads\?pipeline_stage=/);
    assert.match(src, /menuply\.com\/restaurants\//);
  });

  it("StatTile supports optional to prop", () => {
    const src = read("src/pages/crm/CrmShared.jsx");
    assert.match(src, /function StatTile\(\{ label, value, sub = null, to = null \}/);
    assert.match(src, /function FilterLink/);
  });

  it("lead list hydrates URL params and makes cells clickable", () => {
    const src = read("src/pages/crm/CrmLeadList.jsx");
    assert.match(src, /useSearchParams/);
    assert.match(src, /open_only/);
    assert.match(src, /pipeline_stages/);
    assert.match(src, /mailto:/);
    assert.match(src, /\/crm\/subscriptions/);
    assert.match(src, /status=\$\{encodeURIComponent\(row\.status\)\}/);
    assert.match(src, /source=\$\{encodeURIComponent\(row\.source\)\}/);
    assert.match(src, /placeholder="Source"/);
  });

  it("tasks page hydrates overdue_only and due_today from URL", () => {
    const src = read("src/pages/crm/CrmTasks.jsx");
    assert.match(src, /useSearchParams/);
    assert.match(src, /due_today/);
    assert.match(src, /overdue_only/);
  });
});
