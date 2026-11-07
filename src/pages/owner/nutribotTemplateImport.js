/**
 * Owner → Bots → Nutribot → "Import from AI".
 * 1. buildTemplateAiPrompt — instructions to give an AI together with the exported
 *    unprocessed-items spreadsheet; asks for a JSON list in exactly the shape below.
 * 2. parseTemplateSuggestions — reads the AI's answer (tolerates ```json fences, a wrapper
 *    object, flat portion/level fields, comma-separated keywords, "medium" for moderate).
 * 3. pickIngredientMatch — chooses an ingredient from the ingredient search for a name.
 * 4. templateBodyFromDraft — the body POST /api/owner/bots/nutribot/templates expects.
 * Pure helpers — no network or DOM here. The server still validates everything.
 */

export const MACRO_LEVEL_KEYS = [
  "calorie_density_level",
  "protein_level",
  "carb_level",
  "fat_level",
  "fiber_level",
  "sodium_level",
  "sugar_level",
];

/** Same keys as templatePriors.js on the server. */
export const LEVEL_VALUES = [
  "low",
  "moderate",
  "high",
  "very_high",
  "zero",
  "light_beverage",
  "milk_beverage",
  "protein_beverage",
  "alcohol_wine",
  "alcohol_cocktail",
];

const LEVEL_ALIASES = {
  medium: "moderate",
  med: "moderate",
  mid: "moderate",
  average: "moderate",
  veryhigh: "very_high",
  very_high: "very_high",
  none: "zero",
  "0": "zero",
};

const MAX_TEMPLATES = 50;

export function buildTemplateAiPrompt({ existingTemplates = [] } = {}) {
  const existing = existingTemplates
    .map((t) => `${t.slug}${t.category ? ` (${t.category})` : ""}`)
    .join(", ");
  return `You are helping Menuply's Nutribot estimate nutrition for restaurant menu items.
The attached spreadsheet lists menu items Nutribot could not match to any dish template.

Suggest NEW dish templates that would cover as many of these items as possible.
A dish template is a generic dish (e.g. "Birria Taco", "Acai Bowl", "Pad See Ew") with a typical portion, macro levels, keywords, and ingredients with gram amounts for one typical portion.

Rules:
- Group similar items; one template per real dish type. Skip items that are not food or drink (fees, add-ons, condiments, merchandise).
- Do NOT suggest templates that already exist. Existing template slugs: ${existing || "(none listed)"}.
- keywords: lowercase words or short phrases (3+ characters) that appear in item names or descriptions and point clearly to this dish. Avoid broad words that would also match other dishes (e.g. "bowl", "special", "combo", "chicken").
- portion_oz: smallest, typical, largest serving in ounces (largest ≤ 64; min ≤ typical ≤ max).
- macro_levels: each must be exactly one of: ${LEVEL_VALUES.join(", ")}. Use the *_beverage, zero and alcohol_* values only for drinks.
- ingredients: 1–20 plain, common ingredient names (e.g. "flour tortilla", "beef chuck", "white rice", "cheddar cheese") with grams for one typical portion (each 1–2000 g).

Reply with ONLY a JSON array, no other text, in exactly this shape:
[
  {
    "name": "Birria Taco",
    "category": "taco",
    "cuisine": "mexican",
    "portion_oz": { "min": 4, "typical": 6, "max": 9 },
    "macro_levels": {
      "calorie_density_level": "high",
      "protein_level": "high",
      "carb_level": "moderate",
      "fat_level": "high",
      "fiber_level": "low",
      "sodium_level": "high",
      "sugar_level": "low"
    },
    "keywords": ["birria", "quesabirria"],
    "ingredients": [
      { "name": "corn tortilla", "grams": 52 },
      { "name": "beef chuck", "grams": 90 },
      { "name": "mozzarella cheese", "grams": 28 }
    ],
    "covers_items": ["Quesabirria Tacos", "Birria Plate"]
  }
]
`;
}

function stripFences(text) {
  const s = String(text || "").trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = s.search(/[[{]/);
  const lastArr = s.lastIndexOf("]");
  const lastObj = s.lastIndexOf("}");
  const last = Math.max(lastArr, lastObj);
  return first >= 0 && last > first ? s.slice(first, last + 1) : s;
}

export function normalizeLevel(value) {
  const raw = String(value == null ? "" : value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!raw) return "";
  if (LEVEL_VALUES.includes(raw)) return raw;
  return LEVEL_ALIASES[raw] || LEVEL_ALIASES[raw.replace(/_/g, "")] || raw;
}

function num(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toKeywords(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[\n,;]/);
  const seen = new Set();
  const out = [];
  for (const k of list) {
    const s = String(k || "").trim().toLowerCase();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function toIngredients(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((r) => {
      if (typeof r === "string") {
        // "beef chuck 90g" / "beef chuck: 90"
        const m = r.match(/^(.*?)[\s:,-]*(\d+(?:\.\d+)?)\s*g?\s*$/i);
        return m ? { name: m[1].trim(), grams: num(m[2]), ingredient_id: null } : { name: r.trim(), grams: null, ingredient_id: null };
      }
      return {
        name: String(r?.name || r?.ingredient || r?.ingredient_name || "").trim(),
        grams: num(r?.grams ?? r?.default_grams ?? r?.g),
        ingredient_id: Number.isInteger(Number(r?.ingredient_id)) && Number(r?.ingredient_id) > 0 ? Number(r.ingredient_id) : null,
      };
    })
    .filter((r) => r.name || r.ingredient_id);
}

function draftFromSuggestion(s, index) {
  const levelsIn = s?.macro_levels || s?.levels || s || {};
  const macro_levels = {};
  for (const key of MACRO_LEVEL_KEYS) {
    const short = key.replace(/_level$/, "");
    macro_levels[key] = normalizeLevel(levelsIn[key] ?? levelsIn[short] ?? s?.[key] ?? s?.[short]);
  }
  const p = s?.portion_oz || s?.portion || {};
  return {
    key: `t${index}`,
    name: String(s?.name || "").trim(),
    slug: String(s?.slug || "").trim(),
    category: String(s?.category || "").trim().toLowerCase(),
    cuisine: String(s?.cuisine || "").trim().toLowerCase(),
    portion_oz: {
      min: num(p.min ?? s?.portion_min_oz ?? s?.portion_min),
      typical: num(p.typical ?? s?.portion_typical_oz ?? s?.portion_typical),
      max: num(p.max ?? s?.portion_max_oz ?? s?.portion_max),
    },
    macro_levels,
    keywords: toKeywords(s?.keywords),
    ingredients: toIngredients(s?.ingredients || s?.ingredient_rules),
    covers_items: Array.isArray(s?.covers_items) ? s.covers_items.map(String).slice(0, 50) : [],
  };
}

/** Local problems worth showing before asking the server (the server re-checks everything). */
export function draftProblems(draft) {
  const problems = [];
  if (!draft.name) problems.push("Missing name");
  if (!draft.category) problems.push("Missing category");
  const { min, typical, max } = draft.portion_oz;
  if (min == null || typical == null || max == null) problems.push("Portion needs min, typical and max ounces");
  else if (!(min > 0 && min <= typical && typical <= max && max <= 64)) problems.push("Portion must be 0 < min ≤ typical ≤ max ≤ 64 oz");
  for (const key of MACRO_LEVEL_KEYS) {
    const v = draft.macro_levels[key];
    if (!v) problems.push(`Missing ${key.replace(/_level$/, "").replace(/_/g, " ")} level`);
    else if (!LEVEL_VALUES.includes(v)) problems.push(`"${v}" isn't a level Nutribot knows (${key.replace(/_level$/, "")})`);
  }
  if (!draft.keywords.length) problems.push("No keywords");
  if (draft.keywords.some((k) => k.length < 3)) problems.push("Keywords need 3+ characters");
  if (!draft.ingredients.length) problems.push("No ingredients");
  draft.ingredients.forEach((r) => {
    if (!(r.grams > 0 && r.grams <= 2000)) problems.push(`${r.name || "Ingredient"}: grams must be 1–2000`);
  });
  return problems;
}

/**
 * @returns {{ drafts: object[], error: string }}
 */
export function parseTemplateSuggestions(text) {
  const body = stripFences(text);
  if (!body) return { drafts: [], error: "Paste the AI's answer first." };
  let data;
  try {
    data = JSON.parse(body);
  } catch (_) {
    return { drafts: [], error: "That isn't valid JSON. Ask the AI to reply with only the JSON array." };
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.templates) ? data.templates : data && typeof data === "object" ? [data] : [];
  if (!list.length) return { drafts: [], error: "No templates found in the answer." };
  const drafts = list.slice(0, MAX_TEMPLATES).map(draftFromSuggestion);
  return {
    drafts,
    error: list.length > MAX_TEMPLATES ? `Only the first ${MAX_TEMPLATES} templates were read. Import the rest in another paste.` : "",
  };
}

/**
 * Best ingredient for a name from searchNutribotIngredients results.
 * exact = case-insensitive same name (no need to double-check).
 */
export function pickIngredientMatch(name, results = []) {
  const n = String(name || "").trim().toLowerCase();
  if (!results.length) return { match: null, exact: false };
  const exact = results.find((r) => String(r.name || "").trim().toLowerCase() === n);
  return exact ? { match: exact, exact: true } : { match: results[0], exact: false };
}

export function templateBodyFromDraft(draft) {
  return {
    name: draft.name,
    slug: draft.slug || undefined,
    category: draft.category,
    cuisine: draft.cuisine || undefined,
    portion_oz: draft.portion_oz,
    macro_levels: draft.macro_levels,
    keywords: draft.keywords,
    ingredient_rules: draft.ingredients
      .filter((r) => r.ingredient_id)
      .map((r) => ({ ingredient_id: r.ingredient_id, default_grams: r.grams, component_name: r.name || undefined })),
  };
}
