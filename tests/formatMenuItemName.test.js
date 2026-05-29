import test from "node:test";
import assert from "node:assert/strict";

import { formatMenuItemName } from "../src/utils/formatMenuItemName.js";

test("formatMenuItemName converts all-caps dish names to title case", () => {
  assert.equal(formatMenuItemName("CHICKEN PARMESAN"), "Chicken Parmesan");
  assert.equal(formatMenuItemName("BACON CHEESEBURGER"), "Bacon Cheeseburger");
  assert.equal(formatMenuItemName("GENERAL TSO'S CHICKEN"), "General Tso's Chicken");
  assert.equal(formatMenuItemName("PO' BOY SANDWICH"), "Po' Boy Sandwich");
  assert.equal(formatMenuItemName("MAC & CHEESE"), "Mac & Cheese");
});

test("formatMenuItemName preserves acronyms and mixed-case brand names", () => {
  assert.equal(formatMenuItemName("BBQ RIB PLATE"), "BBQ Rib Plate");
  assert.equal(formatMenuItemName("BLT SANDWICH"), "BLT Sandwich");
  assert.equal(formatMenuItemName("USDA PRIME RIBEYE"), "USDA Prime Ribeye");
  assert.equal(formatMenuItemName("McDouble"), "McDouble");
  assert.equal(formatMenuItemName("Big Mac"), "Big Mac");
  assert.equal(formatMenuItemName("5-PC CHICKEN TENDERS"), "5-PC Chicken Tenders");
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
