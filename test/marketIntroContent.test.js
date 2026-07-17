/**
 * Market intro content map contracts.
 */
import assert from "node:assert/strict";
import {
  getMarketIntroContent,
  resolveMarketIntro,
  MARKET_INTRO_CONTENT,
} from "../src/lib/marketIntroContent.js";

assert.ok(MARKET_INTRO_CONTENT["dothan-al"], "dothan-al entry required");

const dothan = resolveMarketIntro("dothan-al");
assert.ok(dothan, "resolveMarketIntro(dothan-al) returns content");
assert.equal(dothan.paragraphs.length, 3);

const flat = dothan.paragraphs
  .flat()
  .map((run) => run.text)
  .join("");
assert.match(flat, /240 restaurants/);
assert.match(flat, /Peanut Capital of the World/);
assert.match(flat, /Browse restaurants, explore menus/);

const boldRun = dothan.paragraphs[0].find((run) => run.bold);
assert.ok(boldRun, "first paragraph has a bold run");
assert.equal(boldRun.text, "240 restaurants");

assert.equal(resolveMarketIntro("los-angeles-ca"), null);
assert.equal(resolveMarketIntro(""), null);
assert.equal(resolveMarketIntro(null), null);

assert.equal(getMarketIntroContent("DOTHAN-AL")?.slug, "dothan-al");

console.log("marketIntroContent: ok");
