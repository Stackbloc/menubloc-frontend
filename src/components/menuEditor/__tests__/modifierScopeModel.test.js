/**
 * Owner modifier group scope (Andre, 2026-10-23): this item only / every item in a section /
 * selected items — save plan + on-screen wording.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  attachScopeFromIndex,
  describeScope,
  planItemModifierSave,
  scopeItems,
} from "../modifierScopeModel.js";
import { fromEditorGroups, toEditorGroups } from "../MenuItemModifiersEditor.jsx";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");

const MENU_ITEMS = [
  { id: 1, name: "Caesar Salad", section: "Salads" },
  { id: 2, name: "Greek Salad", section: "Salads" },
  { id: 3, name: "Cheeseburger", section: "Burgers" },
];
const DRESSING = {
  id: "grp-dressing",
  name: "Dressing",
  required: true,
  min: 1,
  max: 1,
  options: [{ id: "ranch", name: "Ranch", price_delta_cents: 0 }],
};
const INDEX = {
  groups: [
    {
      key: "shared:grp-dressing",
      group: DRESSING,
      applies_to: { type: "section", section: "Salads" },
      items: [MENU_ITEMS[0], MENU_ITEMS[1]],
      missing_items: [],
    },
  ],
};

describe("scope wording", () => {
  it("names the scope and the items it is on", () => {
    const ctx = { itemId: 1, menuItems: MENU_ITEMS };
    expect(describeScope({ applies_to: { type: "item" } }, ctx)).toBe("This item only");
    expect(describeScope({ applies_to: { type: "section", section: "Salads" } }, ctx)).toBe("Every item in Salads (2 items)");
    expect(describeScope({ applies_to: { type: "items" }, item_ids: [3] }, ctx)).toBe("Selected items (2 items)");
    expect(scopeItems({ applies_to: { type: "items" }, item_ids: [3] }, ctx).map((i) => i.name)).toEqual([
      "Caesar Salad",
      "Cheeseburger",
    ]);
  });
});

describe("editor round-trip keeps applies_to", () => {
  it("toEditorGroups → fromEditorGroups preserves section scope; item scope stays implicit", () => {
    const saved = fromEditorGroups(toEditorGroups([{ ...DRESSING, applies_to: { type: "section", section: "Salads" } }]));
    expect(saved[0].applies_to).toEqual({ type: "section", section: "Salads" });
    const plain = fromEditorGroups(toEditorGroups([DRESSING]));
    expect(plain[0].applies_to).toBeUndefined();
  });
});

describe("planItemModifierSave", () => {
  it("new section-wide group: on this item + one scope call for the section", () => {
    const groups = [{ ...DRESSING, applies_to: { type: "section", section: "Salads" }, origin: null }];
    const plan = planItemModifierSave(groups, { itemId: 1, itemSection: "Salads" });
    expect(plan.itemGroups[0].applies_to).toEqual({ type: "section", section: "Salads" });
    expect(plan.scopeCalls).toEqual([
      { groupId: "grp-dressing", body: { group: plan.itemGroups[0], applies_to: { type: "section", section: "Salads" } } },
    ]);
    expect(plan.deleteIds).toEqual([]);
  });

  it("shared → this item only syncs the others off; item-only groups make no scope call", () => {
    const [attached] = attachScopeFromIndex(toEditorGroups([DRESSING]), INDEX, 1);
    expect(attached.origin).toMatchObject({ type: "section", item_ids: [1, 2] });
    const plan = planItemModifierSave([{ ...attached, applies_to: { type: "item" } }], { itemId: 1, itemSection: "Salads" });
    expect(plan.scopeCalls[0].body.applies_to).toEqual({ type: "item" });
    expect(plan.scopeCalls[0].body.item_ids).toEqual([1]);
    const legacy = planItemModifierSave(toEditorGroups([{ ...DRESSING, id: "size" }]), { itemId: 1, itemSection: "Salads" });
    expect(legacy.scopeCalls).toEqual([]);
  });

  it("remove from this item keeps it on the rest; delete from all deletes", () => {
    const [attached] = attachScopeFromIndex(toEditorGroups([DRESSING]), INDEX, 1);
    const keepRest = planItemModifierSave([{ ...attached, remove: "item" }], { itemId: 1, itemSection: "Salads" });
    expect(keepRest.itemGroups).toEqual([]);
    expect(keepRest.scopeCalls[0].body).toMatchObject({ applies_to: { type: "items" }, item_ids: [2] });
    const all = planItemModifierSave([{ ...attached, remove: "all" }], { itemId: 1, itemSection: "Salads" });
    expect(all.deleteIds).toEqual(["grp-dressing"]);
  });

  it("section the item is not in: group leaves this item, scope call still goes out", () => {
    const groups = [{ ...DRESSING, applies_to: { type: "section", section: "Burgers" }, origin: null }];
    const plan = planItemModifierSave(groups, { itemId: 1, itemSection: "Salads" });
    expect(plan.itemGroups).toEqual([]);
    expect(plan.scopeCalls).toHaveLength(1);
  });
});

describe("owner Menu Editor contract", () => {
  const control = read("components/menuEditor/ModifierGroupScopeControl.jsx");
  const editor = read("components/menuEditor/MenuItemModifiersEditor.jsx");
  const shared = read("components/menuEditor/SharedMenuEditor.jsx");
  const overview = read("components/menuEditor/MenuModifierGroupsOverview.jsx");

  it("every group card says where it applies", () => {
    expect(control).toMatch(/Applies to/);
    expect(control).toMatch(/This item only/);
    expect(control).toMatch(/Every item in \{/);
    expect(control).toMatch(/Selected items/);
    expect(editor).toMatch(/<ModifierGroupScopeControl/);
    expect(editor).toMatch(/Remove from this item/);
    expect(editor).toMatch(/Delete from all \{/);
  });

  it("menu overview lists groups with scope + items; save goes through the scope API", () => {
    expect(overview).toMatch(/Modifier groups on this menu/);
    expect(overview).toMatch(/On \{entry\.items\.length\}/);
    expect(shared).toMatch(/planItemModifierSave/);
    expect(shared).toMatch(/api\.putModifierGroupScope\(/);
    expect(read("lib/ownerApi.js")).toMatch(/\/modifier-groups\/\$\{encodeURIComponent\(groupId\)\}/);
  });
});
