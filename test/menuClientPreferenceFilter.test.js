import assert from "node:assert/strict";
import {
  itemPassesPersistedDietFilter,
  itemConflictsAllergenPreferences,
  getClientPreferenceDisplaySections,
  getMenuDisplaySectionsWithPreferences,
  hasSavedMenuPreferences,
} from "../src/lib/menuClientPreferenceFilter.js";

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

function testMenusDoNotApplyAllergenFilter() {
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

  const dietOff = getMenuDisplaySectionsWithPreferences(sections, {
    applyDietaryPreferences: false,
    dietPrefs: veganPrefs,
  });
  assert.equal(dietOff[0].items.length, 2, "allergens do not filter menus when diet toggle off");

  const dietOn = getMenuDisplaySectionsWithPreferences(sections, {
    applyDietaryPreferences: true,
    dietPrefs: veganPrefs,
  });
  assert.equal(dietOn[0].items.length, 1, "only dietary prefs filter menus when toggle on");
  assert.equal(dietOn[0].items[0].name, "Vegan Bowl");
}

testDietConservative();
testAllergenConservative();
testSectionTransform();
testHasSavedPreferences();
testMenusDoNotApplyAllergenFilter();

console.log("✅ menuClientPreferenceFilter tests passed");
