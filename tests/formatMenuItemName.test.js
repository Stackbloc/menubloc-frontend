import test from "node:test";
import assert from "node:assert/strict";

import { formatMenuItemName } from "../src/utils/formatMenuItemName.js";

test("formatMenuItemName preserves source capitalization for intentional menu titles", () => {
  assert.equal(formatMenuItemName("CHICKEN PARMESAN"), "CHICKEN PARMESAN");
  assert.equal(formatMenuItemName("BACON CHEESEBURGER"), "BACON CHEESEBURGER");
  assert.equal(formatMenuItemName("GENERAL TSO'S CHICKEN"), "GENERAL TSO'S CHICKEN");
  assert.equal(formatMenuItemName("PO' BOY SANDWICH"), "PO' BOY SANDWICH");
  assert.equal(formatMenuItemName("MAC & CHEESE"), "MAC & CHEESE");
});

test("formatMenuItemName preserves acronyms and mixed-case brand names", () => {
  assert.equal(formatMenuItemName("BBQ RIB PLATE"), "BBQ RIB PLATE");
  assert.equal(formatMenuItemName("BLT SANDWICH"), "BLT SANDWICH");
  assert.equal(formatMenuItemName("USDA PRIME RIBEYE"), "USDA PRIME RIBEYE");
  assert.equal(formatMenuItemName("McDouble"), "McDouble");
  assert.equal(formatMenuItemName("Big Mac"), "Big Mac");
  assert.equal(formatMenuItemName("5-PC CHICKEN TENDERS"), "5-PC CHICKEN TENDERS");
});

test("formatMenuItemName strips leading punctuation and connector artifacts", () => {
  assert.equal(formatMenuItemName(". CHICKEN PARMESAN"), "Chicken Parmesan");
  assert.equal(formatMenuItemName(", BACON CHEESEBURGER"), "Bacon Cheeseburger");
  assert.equal(formatMenuItemName("add CHICKEN"), "Chicken");
  assert.equal(formatMenuItemName("plus BACON"), "Bacon");
  assert.equal(formatMenuItemName("with FRIES"), "Fries");
  assert.equal(formatMenuItemName("and RICE"), "Rice");
  assert.equal(formatMenuItemName("sub Turkey Club"), "Turkey Club");
});

test("formatMenuItemName strips extended modifier prefixes for display", () => {
  assert.equal(formatMenuItemName("extra FRIES"), "Fries");
  assert.equal(formatMenuItemName("w/ MASHED POTATOES"), "Mashed Potatoes");
  assert.equal(formatMenuItemName("w RICE"), "Rice");
  assert.equal(formatMenuItemName("choice of SOUP"), "Soup");
  assert.equal(formatMenuItemName("served with GRAVY"), "Gravy");
  assert.equal(formatMenuItemName("includes SALAD"), "Salad");
  assert.equal(formatMenuItemName("comes with COLE SLAW"), "Cole Slaw");
  assert.equal(formatMenuItemName("your choice of DRESSING"), "Dressing");
  assert.equal(formatMenuItemName("upgrade to LARGE"), "Large");
});

test("formatMenuItemName keeps legitimate names that start with similar words", () => {
  assert.equal(formatMenuItemName("Add-On Shrimp"), "Add-On Shrimp");
  assert.equal(formatMenuItemName("Plus Ultra Burger"), "Plus Ultra Burger");
  assert.equal(formatMenuItemName("With Love Salad"), "With Love Salad");
  assert.equal(formatMenuItemName("Andouille Sausage"), "Andouille Sausage");
  assert.equal(formatMenuItemName("Submarine Sandwich"), "Submarine Sandwich");
  assert.equal(formatMenuItemName("Extra Crispy Chicken"), "Extra Crispy Chicken");
});

test("formatMenuItemName title-cases lowercase source names but keeps intentional mixed case", () => {
  assert.equal(formatMenuItemName("sour cabbage beef noodle soup"), "Sour Cabbage Beef Noodle Soup");
  assert.equal(formatMenuItemName("vegetable Fried noodle"), "Vegetable Fried Noodle");
  assert.equal(formatMenuItemName("jalapeno Shredded Pork"), "Jalapeno Shredded Pork");
  assert.equal(formatMenuItemName("Mongolian Beef sweet soy sauce w/ onions"), "Mongolian Beef sweet soy sauce w/ onions");
});
