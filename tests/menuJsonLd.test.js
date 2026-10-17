import assert from "node:assert/strict";
import test from "node:test";
import middleware from "../middleware.js";
import {
  buildMenuJsonLd,
  menuItemPriceString,
  restaurantPageJsonLd,
} from "../src/lib/seo/jsonLdBuilders.js";

// Menu pages emit Restaurant → hasMenu → Menu → MenuSection → MenuItem (+ Offer)
// for crawlers; people get the light Restaurant node so page speed is unchanged.

const RESTAURANT = { id: 7, slug: "copper-rye", name: "Copper Rye", city: "Pasadena", state: "CA" };
const MENU_URL = "https://menuply.com/restaurants/california/pasadena/copper-rye/menu";
const SECTIONS = [
  {
    title: "Sides",
    items: [
      { name: "Pita Chips", description: "Crispy.", price_cents: 285, price: "$2.85" },
      { name: "Hummus", price: "$3.55" },
      { name: "Market Fish", price_cents: null, price: "Market price" },
      { name: "  " },
    ],
  },
  { title: "Empty", items: [] },
];

const SHELL = `<!doctype html><html><head>
<title>Menuply</title>
<link rel="canonical" href="https://menuply.com/" />
<meta name="description" content="Browse restaurant menus near you.">
</head><body><div id="root"></div></body></html>`;

const GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";

function jsonLdFrom(html) {
  const m = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html);
  assert.ok(m, "JSON-LD script tag present");
  return JSON.parse(m[1]);
}

function mockFetch(t, { menuStatus = 200, menuState = "published" } = {}) {
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url) => {
    const href = String(url);
    calls.push(href);
    if (href === "https://menuply.com/") return new Response(SHELL, { status: 200 });
    if (href.includes("/public/meta/restaurants/copper-rye")) {
      return new Response(JSON.stringify({ ok: true, data: RESTAURANT }), { status: 200 });
    }
    if (href.endsWith("/public/restaurants/7/menu")) {
      if (menuStatus !== 200) return new Response("boom", { status: menuStatus });
      return new Response(JSON.stringify({
        ok: true,
        menu_status: menuState,
        address: "12 Colorado Blvd",
        zip: "91101",
        phone: "(626) 555-0100",
        cuisine: "American",
        sections: SECTIONS,
      }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  };
  return calls;
}

function menuRequest(userAgent) {
  return new Request(MENU_URL, { headers: { "user-agent": userAgent } });
}

test("menuItemPriceString prefers cents, parses $ strings, drops unknown prices", () => {
  assert.equal(menuItemPriceString({ price_cents: 285 }), "2.85");
  assert.equal(menuItemPriceString({ price: "$3.5" }), "3.50");
  assert.equal(menuItemPriceString({ price: "Market price" }), null);
  assert.equal(menuItemPriceString({ price_cents: 0, price: "$0" }), null);
});

test("buildMenuJsonLd nests sections and items with USD offers, skipping empty ones", () => {
  const menu = buildMenuJsonLd(SECTIONS, RESTAURANT);
  assert.equal(menu["@type"], "Menu");
  assert.equal(menu["@id"], `${MENU_URL}#menu`);
  assert.equal(menu.url, MENU_URL);
  assert.equal(menu.hasMenuSection.length, 1);
  const [section] = menu.hasMenuSection;
  assert.equal(section["@type"], "MenuSection");
  assert.equal(section.name, "Sides");
  assert.deepEqual(section.hasMenuItem.map((i) => i.name), ["Pita Chips", "Hummus", "Market Fish"]);
  assert.deepEqual(section.hasMenuItem[0].offers, { "@type": "Offer", price: "2.85", priceCurrency: "USD" });
  assert.equal(section.hasMenuItem[0].description, "Crispy.");
  assert.equal(section.hasMenuItem[2].offers, undefined);
});

test("buildMenuJsonLd caps items and returns null when nothing is listable", () => {
  const big = [{ title: "All", items: Array.from({ length: 500 }, (_, i) => ({ name: `Item ${i}`, price_cents: 100 })) }];
  const menu = buildMenuJsonLd(big, RESTAURANT);
  assert.equal(menu.hasMenuSection[0].hasMenuItem.length, 300);
  assert.equal(buildMenuJsonLd([{ title: "Empty", items: [] }], RESTAURANT), null);
  assert.equal(buildMenuJsonLd(null, RESTAURANT), null);
});

test("restaurantPageJsonLd links hasMenu by URL without sections and by @id with them", () => {
  const light = restaurantPageJsonLd(RESTAURANT);
  assert.equal(light["@type"], "Restaurant");
  assert.equal(light.hasMenu, MENU_URL);

  const full = restaurantPageJsonLd({ ...RESTAURANT, postal_code: "91101", phone: "626", cuisine: "American" }, [], {
    menuSections: SECTIONS,
  });
  const restaurantNode = full["@graph"].find((n) => n["@type"] === "Restaurant");
  const menuNode = full["@graph"].find((n) => n["@type"] === "Menu");
  assert.deepEqual(restaurantNode.hasMenu, { "@id": menuNode["@id"] });
  assert.equal(restaurantNode.address.postalCode, "91101");
  assert.equal(restaurantNode.telephone, "626");
  assert.equal(restaurantNode.servesCuisine, "American");
});

test("Googlebot gets the full Menu graph with street address on the menu page", async (t) => {
  const calls = mockFetch(t);
  const response = await middleware(menuRequest(GOOGLEBOT_UA));
  assert.equal(response.headers.get("X-SEO-Middleware"), "injected");
  assert.equal(response.headers.get("Vary"), "User-Agent");
  const graph = jsonLdFrom(await response.text());
  const restaurantNode = graph["@graph"].find((n) => n["@type"] === "Restaurant");
  const menuNode = graph["@graph"].find((n) => n["@type"] === "Menu");
  assert.equal(restaurantNode.address.streetAddress, "12 Colorado Blvd");
  assert.equal(restaurantNode.address.postalCode, "91101");
  assert.equal(restaurantNode.telephone, "(626) 555-0100");
  assert.equal(restaurantNode.servesCuisine, "American");
  assert.equal(restaurantNode.hasMenu["@id"], `${MENU_URL}#menu`);
  assert.equal(menuNode.hasMenuSection[0].hasMenuItem[0].offers.price, "2.85");
  assert.ok(calls.some((href) => href.endsWith("/public/restaurants/7/menu")));
});

test("people skip the menu fetch and get the light Restaurant node", async (t) => {
  const calls = mockFetch(t);
  const response = await middleware(menuRequest(CHROME_UA));
  const graph = jsonLdFrom(await response.text());
  assert.equal(graph["@type"], "Restaurant");
  assert.equal(graph.hasMenu, MENU_URL);
  assert.ok(!calls.some((href) => href.endsWith("/public/restaurants/7/menu")), calls.join("\n"));
});

test("a failed menu fetch still serves the injected page with the light node", async (t) => {
  mockFetch(t, { menuStatus: 500 });
  const response = await middleware(menuRequest(GOOGLEBOT_UA));
  assert.equal(response.headers.get("X-SEO-Middleware"), "injected");
  const graph = jsonLdFrom(await response.text());
  assert.equal(graph["@type"], "Restaurant");
  assert.equal(graph.hasMenu, MENU_URL);
});

test("a draft/archived/removed menu payload is never marked up", async (t) => {
  for (const menuState of ["draft", "archived", "removed"]) {
    mockFetch(t, { menuState });
    const response = await middleware(menuRequest(GOOGLEBOT_UA));
    const graph = jsonLdFrom(await response.text());
    assert.equal(graph["@type"], "Restaurant", menuState);
    assert.equal(graph.hasMenu, MENU_URL);
  }
});

test("the profile page links the menu by URL only", async (t) => {
  const calls = mockFetch(t);
  const response = await middleware(
    new Request(MENU_URL.replace(/\/menu$/, ""), { headers: { "user-agent": GOOGLEBOT_UA } })
  );
  const graph = jsonLdFrom(await response.text());
  assert.equal(graph["@type"], "Restaurant");
  assert.equal(graph.hasMenu, MENU_URL);
  assert.ok(!calls.some((href) => href.endsWith("/public/restaurants/7/menu")), calls.join("\n"));
});
