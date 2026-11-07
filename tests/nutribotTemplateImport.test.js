import test from "node:test";
import assert from "node:assert/strict";

import { buildUnprocessedCsv, unprocessedCsvFilename } from "../src/pages/owner/nutribotUnprocessedCsv.js";
import * as m from "../src/pages/owner/nutribotTemplateImport.js";

test("unprocessed CSV quotes, guards formulas, has BOM", () => {
  const csv = buildUnprocessedCsv([{ menu_item_id: 5, name: 'Jalapeño "Hot" Wrap, large', description: "=cmd", restaurant: { name: "Cafe" }, reason: "low_confidence", template_tried: { id: 3, slug: "burrito" } }], { low_confidence: "Too weak" });
  assert.ok(csv.startsWith("﻿Menu item ID,"));
  assert.ok(csv.includes('5,"Jalapeño ""Hot"" Wrap, large",,\'=cmd,Cafe,,,Too weak,burrito'));
  assert.equal(unprocessedCsvFilename({ restaurantId: 12, query: "Hot Wrap!", date: new Date("2026-11-07T10:00:00Z") }), "nutribot-unprocessed_restaurant-12_hot-wrap_2026-11-07.csv");
});

test("template import parses a fenced AI answer", () => {
const ai = "Sure! Here you go:\n```json\n" + JSON.stringify([
 {name:"Birria Taco",category:"Taco",cuisine:"Mexican",portion_oz:{min:4,typical:6,max:9},
  macro_levels:{calorie_density_level:"high",protein_level:"High",carb_level:"medium",fat_level:"very high",fiber_level:"low",sodium_level:"high",sugar_level:"low"},
  keywords:"birria, Quesabirria, birria",ingredients:[{name:"corn tortilla",grams:52},"beef chuck 90g"],covers_items:["Quesabirria"]},
 {name:"Bad",category:"x",portion_min_oz:5,portion_typical_oz:3,portion_max_oz:9,protein:"huge",keywords:["ab"],ingredients:[]}
]) + "\n```\nHope this helps";
const {drafts,error} = m.parseTemplateSuggestions(ai);
assert.equal(error,""); assert.equal(drafts.length,2);
const d=drafts[0];
assert.equal(d.category,"taco"); assert.deepEqual(d.keywords,["birria","quesabirria"]);
assert.equal(d.macro_levels.carb_level,"moderate"); assert.equal(d.macro_levels.fat_level,"very_high");
assert.deepEqual(d.ingredients[1],{name:"beef chuck",grams:90,ingredient_id:null});
assert.deepEqual(m.draftProblems(d),[]);
const p=m.draftProblems(drafts[1]);
assert.ok(p.some(x=>x.includes("Portion"))); assert.ok(p.some(x=>x.includes("huge"))); assert.ok(p.includes("No ingredients"));
assert.equal(m.parseTemplateSuggestions("not json").drafts.length,0);
assert.equal(m.parseTemplateSuggestions('{"templates":[{"name":"A"}]}').drafts.length,1);
const pick=m.pickIngredientMatch("Beef Chuck",[{id:1,name:"beef chuck roast"},{id:2,name:"beef chuck"}]);
assert.equal(pick.match.id,2); assert.equal(pick.exact,true);
assert.equal(m.pickIngredientMatch("x",[{id:9,name:"y"}]).exact,false);
d.ingredients[0].ingredient_id=11; // second unresolved → dropped
const body=m.templateBodyFromDraft(d);
assert.deepEqual(body.ingredient_rules,[{ingredient_id:11,default_grams:52,component_name:"corn tortilla"}]);
assert.ok(m.buildTemplateAiPrompt({existingTemplates:[{slug:"burrito",category:"burrito"}]}).includes("burrito (burrito)"));
});
