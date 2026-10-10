/**
 * Meal time SORTS deal videos, never hides them (Andre, 2026-10-09).
 * E.g. at breakfast or late night a diner can pick Lunch and see lunch deals first.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { orderDealVideosForMeal } from "../src/lib/feedDealVideos.js";
import { wrapEndlessFeedNext } from "../src/lib/shuffleProfileVideos.js";

const deals = [
  { id: "lunchOnly", meal_periods: ["lunch"] },
  { id: "allDay1", meal_periods: [] },
  { id: "allDay2", meal_periods: [] },
  { id: "dinnerOnly", meal_periods: ["dinner"] },
  { id: "brunch", meal_periods: ["breakfast", "lunch"] },
];
const ids = (list) => list.map((d) => d.id);

test("every deal is present for every meal choice (nothing hidden)", () => {
  for (const meal of ["all", "breakfast", "lunch", "dinner", "late_night", null]) {
    const out = orderDealVideosForMeal(deals, meal);
    assert.deepEqual([...ids(out)].sort(), [...ids(deals)].sort(), `meal=${meal}`);
  }
});

test("chosen meal first, then all-day, then other meals", () => {
  for (let run = 0; run < 25; run += 1) {
    const lunch = ids(orderDealVideosForMeal(deals, "lunch"));
    assert.deepEqual(new Set(lunch.slice(0, 2)), new Set(["lunchOnly", "brunch"]));
    assert.deepEqual(new Set(lunch.slice(2, 4)), new Set(["allDay1", "allDay2"]));
    assert.equal(lunch[4], "dinnerOnly");

    const lateNight = ids(orderDealVideosForMeal(deals, "late_night"));
    assert.deepEqual(new Set(lateNight.slice(0, 2)), new Set(["allDay1", "allDay2"]));
    assert.ok(lateNight.includes("lunchOnly"), "lunch deal still shown late at night");
  }
});

test("looping keeps the meal order and plays each video once per pass", () => {
  const reshuffle = (list) => orderDealVideosForMeal(list, "lunch");
  let list = reshuffle(deals);
  let index = 0;
  for (let pass = 0; pass < 6; pass += 1) {
    const seen = [list[index].id];
    for (let step = 1; step < deals.length; step += 1) {
      ({ items: list, index } = wrapEndlessFeedNext(list, index, reshuffle));
      seen.push(list[index].id);
    }
    assert.equal(new Set(seen).size, deals.length, `pass ${pass}: each video once`);
    const last = list[index].id;
    ({ items: list, index } = wrapEndlessFeedNext(list, index, reshuffle));
    assert.notEqual(list[0].id, last, "new pass does not repeat the clip just watched");
    assert.ok(["lunchOnly", "brunch"].includes(list[0].id) || ["lunchOnly", "brunch"].includes(list[1].id));
  }
});
