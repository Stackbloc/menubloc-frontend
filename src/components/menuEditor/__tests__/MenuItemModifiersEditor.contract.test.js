/**
 * Contract: Menu Lab ItemForm + shared modifiers editor for Size / Add-ons.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  fromEditorGroups,
  toEditorGroups,
} from "../MenuItemModifiersEditor.jsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("MenuItemModifiersEditor helpers", () => {
  it("round-trips pizza size + extra cheese", () => {
    const edited = toEditorGroups([
      {
        id: "size",
        name: "Size",
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: "sm", name: "Small", price_delta_cents: 0 },
          { id: "lg", name: "Large", price_delta_cents: 600 },
        ],
      },
      {
        id: "addons",
        name: "Add-ons",
        options: [{ id: "cheese", name: "Extra cheese", price_delta_cents: 150 }],
      },
    ]);
    const saved = fromEditorGroups(edited);
    expect(saved).toHaveLength(2);
    expect(saved[0].required).toBe(true);
    expect(saved[0].options[1].price_delta_cents).toBe(600);
    expect(saved[1].options[0].name).toBe("Extra cheese");
  });
});

describe("Menu Lab modifiers authoring contract", () => {
  const editor = read("pages/operator/OperatorMenuEditor.jsx");
  const shared = read("components/menuEditor/SharedMenuEditor.jsx");
  const mod = read("components/menuEditor/MenuItemModifiersEditor.jsx");

  it("Menu Lab ItemForm mounts MenuItemModifiersEditor and menu tab controls", () => {
    expect(editor).toMatch(/MenuItemModifiersEditor/);
    expect(editor).toMatch(/putMenuItemModifierGroups|modifier_groups/);
    expect(editor).toMatch(/Set default/);
    expect(editor).toMatch(/handleReorderMenu/);
    expect(editor).toMatch(/handleToggleMenuActive/);
  });

  it("SharedMenuEditor mounts modifiers editor", () => {
    expect(shared).toMatch(/MenuItemModifiersEditor/);
    expect(shared).toMatch(/putModifierGroups/);
  });

  it("shared editor exposes add-group control", () => {
    expect(mod).toMatch(/data-testid="menu-item-modifiers-editor"/);
    expect(mod).toMatch(/data-testid="add-modifier-group"/);
  });
});
