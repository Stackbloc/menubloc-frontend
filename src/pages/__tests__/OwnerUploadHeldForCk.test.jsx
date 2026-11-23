// 2026-11-22 (Andre: everything has to be approved by CK; "hold those too"): owner uploads are held,
// so a held upload with dishes found counts as received, not as "no imported menu items were saved".
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uploadHasDishes } from "../../lib/ownerUploadHeld.js";

describe("owner uploads held for CK", () => {
  it("a held upload with dishes found is received", () => {
    expect(uploadHasDishes({ held_for_ck: true, items_found: 12, inserted_items: 0 })).toBe(true);
    expect(uploadHasDishes({ held_for_ck: true, items_found: 0 })).toBe(false);
    expect(uploadHasDishes({ inserted_items: 3, updated_items: 0 })).toBe(true);
    expect(uploadHasDishes({ inserted_items: 0, updated_items: 0 })).toBe(false);
    expect(uploadHasDishes(null)).toBe(false);
  });

  it("owner screens say received and checked, not published", () => {
    const read = (rel) => fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), rel), "utf8");
    const camera = read("../operator/OperatorMenuCameraUpload.jsx");
    expect(camera).toContain("Menu received");
    expect(camera).toContain("result.held_for_ck");
    const workspace = read("../owner/OwnerMenuCreateWorkspace.jsx");
    expect(workspace).toContain('parseStatus: "held_for_ck"');
    expect(workspace).toContain("Menuply checks every menu before it goes live");
  });
});
