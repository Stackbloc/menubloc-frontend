const CANONICAL_NAME_DROP_TOKENS = new Set([
  "the",
  "and",
  "with",
  "for",
  "from",
  "style",
  "house",
  "classic",
  "signature",
  "special",
  "fresh",
  "served",
  "our",
  "your",
  "original",
  "homemade",
  "hand",
  "crafted",
  "world",
  "famous",
  "traditional",
  "premium",
  "deluxe",
  "ultimate",
  "favorite",
  "favourite",
  "new",
  "old",
  "side",
  "order",
  "of",
]);

const CANONICAL_NAME_ALIASES = Object.freeze([
  [/^(side\s+of\s+)?(french\s+)?fries$/i, "fries"],
  [/^(side\s+)?(house\s+)?salad$/i, "side salad"],
  [/^(side\s+)?(garden\s+)?salad$/i, "garden salad"],
]);

export function normalizeSimilarCanonicalName(name) {
  let text = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/^(kids|kid|childs|childrens|small|medium|large|regular|mini|single|double|triple)\s+/i, "")
    .replace(/\b\d+\s*(pc|pcs|piece|pieces|count|ct|inch|in)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = text.split(" ").filter((token) => token && !CANONICAL_NAME_DROP_TOKENS.has(token));
  text = tokens.join(" ").trim() || text;

  for (const [pattern, alias] of CANONICAL_NAME_ALIASES) {
    if (pattern.test(text)) return alias;
  }

  return text;
}

export function canonicalSimilarItemKey(row) {
  const chainId = row?.chain_menu_item_id;
  if (chainId != null && chainId !== "") {
    const numeric = Number(chainId);
    return `chain:${Number.isFinite(numeric) ? numeric : chainId}`;
  }

  const productKey = row?.mks_product_key ?? row?.product_key ?? null;
  if (productKey) return `mks:${productKey}`;

  const normalized = normalizeSimilarCanonicalName(row?.name);
  if (normalized) return `name:${normalized}`;

  return null;
}
