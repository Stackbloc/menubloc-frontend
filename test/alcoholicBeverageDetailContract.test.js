/**
 * Alcoholic beverage detail — data substitution contract (no new detail screen).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  hasAlcoholicBeverageContent,
  isAlcoholicBeverageItem,
  resolveAlcoholicBeverageContent,
  RESPONSIBLE_DRINKING_BULLETS,
  RESPONSIBLE_DRINKING_TITLE,
} from "../src/lib/alcoholicBeverageDetail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const detailSource = fs.readFileSync(path.join(ROOT, "src/pages/MenuItemDetailPage.jsx"), "utf8");

describe("alcoholic beverage detail detection", () => {
  it("classifies Fixins cocktails and tap beer without requiring is_alcoholic on detail payload", () => {
    assert.equal(
      isAlcoholicBeverageItem(
        {
          name: "Cherry Bomb",
          description: "Vodka, lime juice and cherry Kool-Aid",
          category: "SIGNATURE COCKTAILS",
          restaurant: { name: "Fixins Soul Kitchen" },
        },
        { item_category: "beverage", presentation_model: { kind: "drink_detail", item_category: "beverage" } },
      ),
      true,
    );
    assert.equal(
      isAlcoholicBeverageItem(
        {
          name: "Bud Light",
          category: "BEERS ON TAP",
          restaurant: { name: "Fixins Soul Kitchen" },
        },
        { item_category: "entree" },
      ),
      true,
    );
  });

  it("honors explicit is_alcoholic and never marks Dunkin items alcoholic", () => {
    assert.equal(isAlcoholicBeverageItem({ name: "House Pour", is_alcoholic: true }), true);
    assert.equal(isAlcoholicBeverageItem({ name: "Cola", is_alcoholic: false, category: "beverage" }), false);
    assert.equal(
      isAlcoholicBeverageItem({
        name: "Coolatta Cocktail",
        category: "Drinks",
        is_alcoholic: true,
        restaurant: { name: "Dunkin'" },
      }),
      false,
    );
    assert.equal(
      isAlcoholicBeverageItem({
        name: "Old Fashioned Donut",
        description: "Glazed cake donut",
        restaurant: { name: "Dunkin'" },
      }),
      false,
    );
  });

  it("does not treat mocktails, root beer, or generic soda as alcoholic", () => {
    assert.equal(
      isAlcoholicBeverageItem({
        name: "Virgin Mojito",
        category: "Mocktails",
        beverage_type: "mocktail",
      }),
      false,
    );
    assert.equal(
      isAlcoholicBeverageItem({
        name: "Root Beer",
        category: "Beverages",
      }, { item_category: "beverage" }),
      false,
    );
    assert.equal(
      isAlcoholicBeverageItem({
        name: "Coca-Cola",
        category: "Soft Drinks",
      }, { item_category: "beverage" }),
      false,
    );
  });
});

describe("alcoholic beverage content substitution", () => {
  it("returns description and omits empty recipe/ingredients", () => {
    const content = resolveAlcoholicBeverageContent({
      description: "Vodka, lime juice and cherry Kool-Aid",
      ingredients: [],
    });
    assert.equal(content.description, "Vodka, lime juice and cherry Kool-Aid");
    assert.equal(content.recipe, null);
    assert.deepEqual(content.ingredients, []);
    assert.equal(hasAlcoholicBeverageContent(content), true);
    assert.equal(hasAlcoholicBeverageContent({ description: null, recipe: null, ingredients: [] }), false);
  });

  it("keeps a distinct recipe and ingredient names when present", () => {
    const content = resolveAlcoholicBeverageContent({
      description: "A bright gin highball",
      recipe: "Shake gin and lemon, top with soda.",
      ingredients: [{ name: "Gin" }, { name: "Lemon juice" }, "Soda water"],
    });
    assert.equal(content.recipe, "Shake gin and lemon, top with soda.");
    assert.deepEqual(content.ingredients, ["Gin", "Lemon juice", "Soda water"]);
  });
});

describe("MenuItemDetailPage alcoholic substitution contract", () => {
  it("stays on MenuItemDetailPage and does not add an alternate alcohol screen", () => {
    assert.match(detailSource, /isAlcoholicBeverageItem/);
    assert.match(detailSource, /ResponsibleDrinkingNotice/);
    assert.match(detailSource, /RESPONSIBLE_DRINKING_TITLE/);
    assert.doesNotMatch(detailSource, /AlcoholicBeverageDetailPage/);
    assert.match(detailSource, /function NutritionInsightsCluster/);
    assert.match(detailSource, /<NutritionInsightsCluster/);
    assert.match(detailSource, /<VerdictBlock[\s\S]*compact/);
    assert.match(detailSource, /showStickyVerdict && !isAlcoholicBeverage/);
  });

  it("omits Similar and Compare for alcoholic beverages only", () => {
    assert.match(detailSource, /function ExploreSimilarDishes/);
    assert.match(detailSource, /CompareItemsModal/);
    assert.match(detailSource, /\{!isAlcoholicBeverage \? \([\s\S]*<ExploreSimilarDishes/);
    assert.match(detailSource, /isAlcoholicBeverage \? <ResponsibleDrinkingNotice/);
  });

  it("keeps the authorized responsible-drinking copy", () => {
    assert.equal(RESPONSIBLE_DRINKING_TITLE, "Drink Responsibly");
    assert.equal(RESPONSIBLE_DRINKING_BULLETS.length, 5);
    assert.match(RESPONSIBLE_DRINKING_BULLETS[0], /21 years of age/);
    assert.match(RESPONSIBLE_DRINKING_BULLETS[3], /Surgeon General/);
  });
});
