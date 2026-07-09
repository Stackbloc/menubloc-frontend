import assert from "node:assert/strict";
import {
  itemPassesPersistedDietFilter,
  itemConflictsAllergenPreferences,
  countMenuDisplayItems,
  getClientPreferenceDisplaySections,
  getMenuDisplaySectionsWithPreferences,
  hasSavedMenuPreferences,
  buildCombinedPreferenceLabelList,
} from "../src/lib/menuClientPreferenceFilter.js";
import {
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
  __resetDietaryPreferencesOptOutForTests,
} from "../src/lib/menuCatalogBrowsePreferences.js";

function testDietConservative() {
  const veganPrefs = { vegan: true, vegetarian: false, gluten_free: false, dairy_free: false, keto: false, low_fat: false, low_sodium: false, diabetic_friendly: false };

  assert.equal(itemPassesPersistedDietFilter({ name: "Salad", is_vegan: true }, veganPrefs), true);
  assert.equal(itemPassesPersistedDietFilter({ name: "Burger", is_vegan: false }, veganPrefs), false);
  assert.equal(itemPassesPersistedDietFilter({ name: "Mystery" }, veganPrefs), true, "missing metadata stays visible");
}

function testAllergenConservative() {
  const peanutAvoid = new Set(["peanuts"]);

  assert.equal(
    itemConflictsAllergenPreferences({ name: "PB", allergens: ["peanuts"] }, peanutAvoid),
    true
  );
  assert.equal(
    itemConflictsAllergenPreferences({ name: "Salad" }, peanutAvoid),
    false,
    "missing allergen metadata stays visible"
  );
  assert.equal(
    itemConflictsAllergenPreferences(
      {
        name: "Inferred only",
        chips: { nutrition_chip: { source: "runtime_inference", allergens: ["peanuts"] } },
      },
      peanutAvoid
    ),
    false,
    "non-authoritative chip source ignored"
  );
}

function testSectionTransform() {
  const sections = [
    {
      title: "Mains",
      items: [
        { name: "Vegan Bowl", is_vegan: true },
        { name: "Steak", is_vegan: false },
        { name: "Unknown" },
      ],
    },
  ];
  const veganPrefs = { vegan: true, vegetarian: false, gluten_free: false, dairy_free: false, keto: false, low_fat: false, low_sodium: false, diabetic_friendly: false };
  const out = getClientPreferenceDisplaySections(sections, veganPrefs, new Set());
  assert.equal(out.length, 1);
  assert.equal(out[0].items.length, 2);
  assert.equal(out[0].items.map((i) => i.name).join(","), "Vegan Bowl,Unknown");
}

function testHasSavedPreferences() {
  assert.equal(hasSavedMenuPreferences({ vegan: false }, new Set()), false);
  assert.equal(hasSavedMenuPreferences({ vegan: true }, new Set()), true);
  assert.equal(hasSavedMenuPreferences({}, new Set(["dairy"])), true);
}

function testMenusApplyAllergenFilterAlways() {
  const sections = [
    {
      title: "Mains",
      items: [
        { name: "Peanut Curry", allergens: ["peanuts"], is_vegan: false },
        { name: "Vegan Bowl", is_vegan: true },
      ],
    },
  ];
  const veganPrefs = {
    vegan: true,
    vegetarian: false,
    gluten_free: false,
    dairy_free: false,
    keto: false,
    low_fat: false,
    low_sodium: false,
    diabetic_friendly: false,
  };
  const peanutAvoid = new Set(["peanuts"]);

  const dietOffAllergenOn = getMenuDisplaySectionsWithPreferences(sections, {
    applyDietaryPreferences: false,
    dietPrefs: veganPrefs,
    enabledAllergenKeys: peanutAvoid,
  });
  assert.equal(dietOffAllergenOn[0].items.length, 1, "allergens filter menus even when diet session off");
  assert.equal(dietOffAllergenOn[0].items[0].name, "Vegan Bowl");

  const dietOn = getMenuDisplaySectionsWithPreferences(sections, {
    applyDietaryPreferences: true,
    dietPrefs: veganPrefs,
    enabledAllergenKeys: peanutAvoid,
  });
  assert.equal(dietOn[0].items.length, 1, "diet + allergen filters combine");
  assert.equal(dietOn[0].items[0].name, "Vegan Bowl");
}

function testSessionDefaultsApplyDietaryPreferences() {
  const priorWindow = global.window;
  global.window = {
    sessionStorage: {
      _data: {},
      getItem(k) {
        return this._data[k] ?? null;
      },
      setItem(k, v) {
        this._data[k] = String(v);
      },
      removeItem(k) {
        delete this._data[k];
      },
    },
  };
  try {
    __resetDietaryPreferencesOptOutForTests();
    assert.equal(readCatalogApplyDietaryPreferences(), true, "default apply on");
    writeCatalogApplyDietaryPreferences(false);
    assert.equal(readCatalogApplyDietaryPreferences(), false, "explicit opt-out");
    writeCatalogApplyDietaryPreferences(true);
    assert.equal(readCatalogApplyDietaryPreferences(), true, "re-enable");
  } finally {
    global.window = priorWindow;
  }
}

function testCombinedLabels() {
  const labels = buildCombinedPreferenceLabelList(
    { vegan: true, vegetarian: false, gluten_free: false, dairy_free: false, keto: false, low_fat: false, low_sodium: false, diabetic_friendly: false },
    new Set(["peanuts"])
  );
  assert.ok(labels.includes("Vegan"));
  assert.ok(labels.includes("Peanuts"));
}

function testCountMenuDisplayItems() {
  const sections = [
    { title: "A", items: [{ name: "One" }, { name: "Two" }, { name: "" }] },
    { title: "B", items: [{ name: "Three" }] },
  ];
  assert.equal(countMenuDisplayItems(sections), 3);
}

testDietConservative();
testAllergenConservative();
testSectionTransform();
testHasSavedPreferences();
testMenusApplyAllergenFilterAlways();
testSessionDefaultsApplyDietaryPreferences();
testCombinedLabels();
testCountMenuDisplayItems();

console.log("✅ menuClientPreferenceFilter tests passed");
