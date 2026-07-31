/**
 * Contract: CrmLeadList labeled filters must define filterLabelStyle
 * (ReferenceError blanked /crm/leads on production).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/pages/crm/CrmLeadList.jsx"), "utf8");

describe("CrmLeadList filterLabelStyle contract", () => {
  it("defines filterLabelStyle for labeled filters", () => {
    assert.ok(src.includes("const filterLabelStyle"), "const filterLabelStyle must be defined");
    assert.ok(src.includes("style={filterLabelStyle}"), "labels must use filterLabelStyle");
    assert.ok(src.includes("State"), "State filter label must remain");
    assert.ok(src.includes("Campus"), "Campus filter label must remain");
  });
});
