import assert from "node:assert/strict";
import {
  itemPassesPersistedDietFilter,
  itemConflictsAllergenPreferences,
  itemHasObviousMenuTextDietConflict,
  buildDietPrefsFromProfile,
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

const VEGAN_PREFS = {
  vegan: true,
  vegetarian: false,
  gluten_free: false,
  dairy_free: false,
  keto: false,
  low_carb: false,
  low_fat: false,
  low_sodium: false,
  diabetic_friendly: false,
  high_protein: false,
  nut_free: false,
};

const VEGETARIAN_PREFS = {
  vegan: false,
  vegetarian: true,
  gluten_free: false,
  dairy_free: false,
  keto: false,
  low_carb: false,
  low_fat: false,
  low_sodium: false,
  diabetic_friendly: false,
  high_protein: false,
  nut_free: false,
};

function testProfileMapsAllSupportedDietKeys() {
  const prefs = buildDietPrefsFromProfile(
    [
      { preference_key: "vegetarian", is_enabled: true },
      { preference_key: "vegan", is_enabled: true },
      { preference_key: "gluten_free", is_enabled: true },
      { preference_key: "dairy_free", is_enabled: true },
      { preference_key: "low_carb", is_enabled: true },
      { preference_key: "high_protein", is_enabled: true },
      { preference_key: "low_sodium", is_enabled: true },
      { preference_key: "diabetic_friendly", is_enabled: true },
      { preference_key: "nut_free", is_enabled: true },
      { preference_key: "keto", is_enabled: true },
    ],
    true
  );
  assert.equal(prefs.vegetarian, true);
  assert.equal(prefs.vegan, true);
  assert.equal(prefs.gluten_free, true);
  assert.equal(prefs.dairy_free, true);
  assert.equal(prefs.low_carb, true);
  assert.equal(prefs.keto, true);
  assert.equal(prefs.high_protein, true);
  assert.equal(prefs.low_sodium, true);
  assert.equal(prefs.diabetic_friendly, true);
  assert.equal(prefs.nut_free, true);
}

function testDietStrictWithEvaluatorChips() {
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "Salad", chips: { dietary_filters: { vegan: { result: "pass" } } } },
      VEGAN_PREFS
    ),
    true
  );
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "Burger", chips: { dietary_filters: { vegan: { result: "fail" } } } },
      VEGAN_PREFS
    ),
    false
  );
  assert.equal(itemPassesPersistedDietFilter({ name: "Mystery" }, VEGAN_PREFS), false);
}

function testVegetarianHidesSausageBiscuitByName() {
  assert.equal(
    itemHasObviousMenuTextDietConflict({ name: "Sausage Biscuit" }, VEGETARIAN_PREFS),
    true
  );
  assert.equal(itemPassesPersistedDietFilter({ name: "Sausage Biscuit" }, VEGETARIAN_PREFS), false);
}

function testHighProteinAndNutFreeStrict() {
  const highProtein = { ...VEGETARIAN_PREFS, vegetarian: false, high_protein: true };
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "Grilled Chicken", chips: { dietary_filters: { high_protein: { result: "pass" } } } },
      highProtein
    ),
    true
  );
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "Side Salad", chips: { dietary_filters: { high_protein: { result: "unknown" } } } },
      highProtein
    ),
    false
  );

  const nutFree = { ...VEGETARIAN_PREFS, vegetarian: false, nut_free: true };
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "PB&J", chips: { dietary_filters: { nut_free: { result: "fail" } } } },
      nutFree
    ),
    false
  );
  assert.equal(
    itemPassesPersistedDietFilter(
      { name: "Fruit Cup", chips: { dietary_filters: { nut_free: { result: "pass" } } } },
      nutFree
    ),
    true
  );
}

function testAllergenUsesRuntimeInferenceChip() {
  const peanutAvoid = new Set(["peanuts"]);
  assert.equal(
    itemConflictsAllergenPreferences(
      {
        name: "Dessert",
        chips: {
          nutrition_chip: {
            source: "Menuply inference",
            allergens: ["peanuts"],
          },
        },
      },
      peanutAvoid
    ),
    true
  );
}

function testAllergenUsesMenuTextKeywords() {
  const peanutAvoid = new Set(["peanuts"]);
  assert.equal(
    itemConflictsAllergenPreferences({ name: "Peanut Butter Cup" }, peanutAvoid),
    true
  );
  assert.equal(itemConflictsAllergenPreferences({ name: "Garden Salad" }, peanutAvoid), false);
}

function testSectionTransform() {
  const sections = [
    {
      title: "Breakfast",
      items: [
        { name: "Fruit Cup", is_vegetarian: true },
        { name: "Sausage Biscuit" },
        { name: "Veggie Burger" },
      ],
    },
  ];
  const out = getClientPreferenceDisplaySections(sections, VEGETARIAN_PREFS, new Set());
  assert.equal(out[0].items.map((i) => i.name).join(","), "Fruit Cup,Veggie Burger");
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
  const peanutAvoid = new Set(["peanuts"]);
  const dietOffAllergenOn = getMenuDisplaySectionsWithPreferences(sections, {
    applyDietaryPreferences: false,
    dietPrefs: VEGAN_PREFS,
    enabledAllergenKeys: peanutAvoid,
  });
  assert.equal(dietOffAllergenOn[0].items[0].name, "Vegan Bowl");
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
    assert.equal(readCatalogApplyDietaryPreferences(), true);
    writeCatalogApplyDietaryPreferences(false);
    assert.equal(readCatalogApplyDietaryPreferences(), false);
  } finally {
    global.window = priorWindow;
  }
}

function testCombinedLabels() {
  const labels = buildCombinedPreferenceLabelList(VEGAN_PREFS, new Set(["peanuts"]));
  assert.ok(labels.includes("Vegan"));
  assert.ok(labels.includes("Peanuts"));
}

testProfileMapsAllSupportedDietKeys();
testDietStrictWithEvaluatorChips();
testVegetarianHidesSausageBiscuitByName();
testHighProteinAndNutFreeStrict();
testAllergenUsesRuntimeInferenceChip();
testAllergenUsesMenuTextKeywords();
testSectionTransform();
testMenusApplyAllergenFilterAlways();
testSessionDefaultsApplyDietaryPreferences();
testCombinedLabels();
assert.equal(countMenuDisplayItems([{ title: "A", items: [{ name: "One" }] }]), 1);

console.log("✅ menuClientPreferenceFilter tests passed");
