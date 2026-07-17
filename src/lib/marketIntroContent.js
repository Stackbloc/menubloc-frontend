/**
 * Slug-keyed market aggregator intro copy for /restaurants/{city}-{state}.
 *
 * Only markets with an entry render intro paragraphs. Other cities are unchanged.
 * Does not alter restaurant data, SEO meta, or layout — content overlay only.
 */

/**
 * @typedef {object} MarketIntroTextRun
 * @property {string} text
 * @property {boolean} [bold]
 */

/**
 * @typedef {object} MarketIntroEntry
 * @property {string} slug City-state slug (e.g. dothan-al)
 * @property {string} city
 * @property {string} state
 * @property {MarketIntroTextRun[][]} paragraphs Each paragraph is an ordered list of text runs
 */

/** @type {Readonly<Record<string, MarketIntroEntry>>} */
export const MARKET_INTRO_CONTENT = Object.freeze({
  "dothan-al": Object.freeze({
    slug: "dothan-al",
    city: "Dothan",
    state: "AL",
    paragraphs: Object.freeze([
      Object.freeze([
        Object.freeze({ text: "Dothan is home to approximately " }),
        Object.freeze({ text: "240 restaurants", bold: true }),
        Object.freeze({
          text: ", offering a wide variety of dining experiences throughout the city. Whether you're looking for Southern comfort food, barbecue, fresh seafood, burgers, pizza, Mexican, Italian, Asian cuisine, coffee shops, bakeries, or locally owned favorites, you'll find plenty of options to explore.",
        }),
      ]),
      Object.freeze([
        Object.freeze({
          text: 'Known as the "Peanut Capital of the World," Dothan serves as the commercial hub of Alabama\'s Wiregrass region and attracts both residents and visitors looking for great places to eat. From quick lunches and casual family restaurants to date-night destinations and late-night dining, the city\'s restaurant scene continues to grow.',
        }),
      ]),
      Object.freeze([
        Object.freeze({
          text: "Browse restaurants, explore menus, and discover new places to eat throughout Dothan.",
        }),
      ]),
    ]),
  }),
});

/**
 * @param {string|null|undefined} slug
 * @returns {MarketIntroEntry|null}
 */
export function getMarketIntroContent(slug) {
  const key = String(slug || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  return MARKET_INTRO_CONTENT[key] || null;
}

/**
 * Visible intro for a market page. Returns null when no city-specific copy exists.
 *
 * @param {string|null|undefined} slug
 * @returns {{ paragraphs: MarketIntroTextRun[][] }|null}
 */
export function resolveMarketIntro(slug) {
  const entry = getMarketIntroContent(slug);
  if (!entry?.paragraphs?.length) return null;
  return { paragraphs: entry.paragraphs };
}
