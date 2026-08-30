/**
 * Starter menus for an empty My Menu Stack — real published restaurants so new
 * diners can swipe immediately. Not written to the personal library until saved.
 */

export const FEED_MENU_SAMPLE_STACK = [
  {
    restaurant_id: "4199",
    restaurant_name: "Tabl M",
    slug: "tabl-m",
    city: "Los Angeles",
    state: "CA",
    tier: "sample",
  },
  {
    restaurant_id: "1995",
    restaurant_name: "In-N-Out Burger",
    slug: "in-n-out-burger",
    city: "Los Angeles",
    state: "CA",
    tier: "sample",
  },
  {
    restaurant_id: "1024",
    restaurant_name: "Northern Cafe",
    slug: "northern-cafe",
    city: "Los Angeles",
    state: "CA",
    tier: "sample",
  },
];

export function buildFeedMenuSampleDeck() {
  return FEED_MENU_SAMPLE_STACK.map((row) => ({ ...row }));
}
