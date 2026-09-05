/**
 * Owner Menu Manager — Add Restaurant restore contract.
 * Single left-nav entry; form-first create; required-field validation.
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

describe("owner Add Restaurant restore", () => {
  it("Restaurant Manager nav lists Add Restaurant first above Profile Manager as a button action", () => {
    const layout = read("src/pages/owner/OwnerLayout.jsx");
    const section = layout.match(/id:\s*"restaurant-manager"[\s\S]*?NAV_SECTIONS_STATIC\[1\]/)?.[0]
      || layout.match(/id:\s*"restaurant-manager"[\s\S]*?id:\s*"growth"/)?.[0]
      || "";
    assert.match(section, /label:\s*"Add Restaurant"/);
    assert.match(section, /button:\s*true/);
    assert.match(section, /create=1&fresh=/);
    const addIdx = section.indexOf('label: "Add Restaurant"');
    const profileIdx = section.indexOf('label: "Profile Manager"');
    assert.ok(addIdx >= 0 && profileIdx > addIdx);
  });

  it("Menu Manager shell does not duplicate Add Restaurant CTA", () => {
    const shell = read("src/pages/owner/OwnerMenuUploads.jsx");
    assert.doesNotMatch(shell, /data-testid="owner-add-restaurant"/);
    assert.match(shell, /left nav/);
    assert.match(shell, /workspaceKey/);
  });

  it("finder exposes Add restaurant CTA when search finds nothing (and optional link)", () => {
    const finder = read("src/pages/owner/OwnerMenuRestaurantFinder.jsx");
    assert.match(finder, /onRequestAddRestaurant/);
    assert.match(finder, /data-testid="owner-finder-add-restaurant"/);
    assert.match(finder, /data-testid="owner-finder-empty-results"/);
    assert.match(finder, /data-testid="owner-finder-add-restaurant-link"/);
    assert.match(finder, /No restaurants matched/);
  });

  it("add form is labeled Add Restaurant with client required-field validation", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /function missingCreateFields/);
    assert.match(workspace, /Complete required fields before adding/);
    assert.match(workspace, /data-testid="owner-add-restaurant-form"/);
    assert.match(workspace, /data-testid="owner-add-restaurant-submit"/);
    assert.match(workspace, /title=\{existingRestaurant \? "Restaurant Profile" : "Add Restaurant"\}/);
    assert.match(workspace, /\{creatingProfile \? "Adding restaurant…" : !schema \? "Loading…" : "Add Restaurant"\}/);
    for (const field of [
      "Restaurant name",
      "Restaurant type",
      "Street address",
      "City",
      "State",
      "ZIP code",
      "Country",
      "Primary cuisine",
      "Price tier",
      "Subscription plan",
      "Status",
      "Service model",
    ]) {
      assert.match(workspace, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("search-first: Add form only with create=1; Search above form; select-existing on duplicate", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /title="Search restaurants"/);
    assert.match(workspace, /onRequestAddRestaurant=\{restaurant \? undefined : openAddRestaurantForm\}/);
    assert.match(workspace, /wantsCreateForm/);
    assert.match(workspace, /showProfileFormCard/);
    assert.match(workspace, /\(isAddingRestaurant && wantsCreateForm\)/);
    assert.match(workspace, /function openAddRestaurantForm/);
    assert.match(workspace, /data-testid="owner-duplicate-restaurant-warning"/);
    assert.match(workspace, /data-testid="owner-select-existing-profile"/);
    assert.match(workspace, /Select existing profile/);
    assert.match(workspace, /onSelectExisting/);
    // Change restaurant returns to search-only (not create=1).
    assert.match(workspace, /Return to search-only panel/);
    const addBranch = workspace.match(/isAddingRestaurant \? \([\s\S]*?\) : \(/)?.[0] || "";
    const finderIdx = addBranch.indexOf("{finderCard}");
    const formIdx = addBranch.indexOf("{profileFormCard}");
    assert.ok(finderIdx >= 0 && formIdx > finderIdx, "Search restaurants must render above Add Restaurant form");
  });

  it("create success shows persistent Restaurant ID and Menu ID", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /data-testid="owner-restaurant-created-success"/);
    assert.match(workspace, /Restaurant added successfully|Restaurant created successfully/);
    assert.match(workspace, /Restaurant ID:/);
    assert.match(workspace, /Menu ID:/);
    assert.match(workspace, /\/owner\/profile-manager\?restaurant=\$\{restaurant\.id\}/);
  });

  it("upload success panel shows Restaurant ID, Menu ID, and parse status", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /data-testid="owner-upload-menu-panel"/);
    assert.match(workspace, /data-testid="owner-menu-attached-success"/);
    assert.match(workspace, /Menu attached successfully/);
    assert.match(workspace, /Upload ID:/);
    assert.match(workspace, /parseStatus/);
    assert.match(workspace, /\+ Add Another Menu/);
  });

  it("upload-first workspace accepts multiple PDF/photo files", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /title=\{selectedMenuNeedsContent \? "Upload menu" : "Update OCR"\}/);
    assert.match(workspace, /data-testid="owner-menu-upload-photos-input"/);
    assert.match(workspace, /data-testid="owner-menu-upload-pdf-input"/);
    assert.match(workspace, /accept="image\/\*"/);
    assert.match(workspace, /accept="\.pdf,application\/pdf"/);
    assert.doesNotMatch(workspace, /data-testid="owner-menu-upload-input"/);
    assert.doesNotMatch(workspace, /PDF \(usually one\) and\/or photos \(select many\)/);
    assert.match(workspace, /data-testid="owner-menu-upload-size-hint"/);
    assert.match(workspace, /max 20 MB each/);
    assert.match(workspace, /MAX_MENU_UPLOAD_BYTES = 20 \* 1024 \* 1024/);
    assert.match(workspace, /ownerUploadTooLargeMessage/);
    assert.match(workspace, /is too large/);
    assert.match(workspace, /const \[files, setFiles\] = useState\(\[\]\)/);
    assert.match(workspace, /for \(let i = 0; i < files\.length; i \+= 1\)/);
    assert.match(workspace, /submitOwnerMenuFilePdf\(rid, nextFile, \{ menuId: activeMenuId \}\)/);
    assert.match(workspace, /Update OCR: add PDF or photos/);
    assert.match(workspace, /same-named dishes replace prior versions/);
    assert.match(workspace, /totalSuperseded/);
    assert.match(workspace, /superseded_count/);
    assert.match(workspace, /Replaced \$\{totalSuperseded\} prior same-named/);
    assert.match(workspace, /"Update OCR"/);
    // Initial load still prefers a menu that already has items; tabs show every shell.
    assert.match(workspace, /menusWithItems/);
    assert.match(workspace, /Prefer a menu that already has items/);
    assert.match(workspace, /data-testid="owner-menu-tabs-panel"/);
    assert.match(workspace, /data-testid="owner-menu-tab"/);
    assert.match(workspace, /sortMenusByDisplayPriority/);
    assert.match(workspace, /handleSetPrimaryMenu/);
    assert.match(workspace, /handleReorderMenu/);
    assert.match(workspace, /handleAddMenu/);
    assert.doesNotMatch(workspace, /showImportPanel/);
    const uploadIdx = workspace.indexOf("{uploadCard}");
    const menusIdx = workspace.indexOf("{menusCard}");
    assert.ok(uploadIdx >= 0 && menusIdx > uploadIdx, "Upload card must render before menus list");
  });

  it("create API client still posts to menu-console restaurants", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /post\("\/api\/owner\/menu-console\/restaurants"/);
  });

  it("owner PDF/photo upload passes menu_id and switches to public_menu_id", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /submitOwnerMenuFilePdf = \(restaurantId, file, opts = \{\}\)/);
    assert.match(api, /form\.append\("menu_id"/);
    assert.match(api, /postFormData\("\/menu-upload\/pdf"/);

    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /submitOwnerMenuFilePdf\(rid, nextFile, \{ menuId: activeMenuId \}\)/);
    assert.match(workspace, /json\.public_menu_id/);
    assert.match(workspace, /reloadMenus\(publicMenuId\)/);
    assert.match(workspace, /importParsedToMenuDraft\(lastUploadId, \{ publicMenuId: activeMenuId \}\)/);
    assert.match(
      workspace,
      /uploadMenuId !== Number\(mid\)[\s\S]*unpublishMenuConsoleMenu/
    );
  });
});
