import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildDestinationVenueJsonLd,
  buildRestaurantJsonLd,
  buildVideoObjectJsonLd,
  destinationVenuePageJsonLd,
  menuItemPageJsonLd,
  restaurantPageJsonLd,
  toJsonLdScriptTag,
  venueSchemaType,
  videoWatchPageJsonLd,
  videoWatchPath,
} from "../src/lib/seo/jsonLdBuilders.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("venueSchemaType maps stadium/arena to StadiumOrArena", () => {
  assert.equal(venueSchemaType("stadium"), "StadiumOrArena");
  assert.equal(venueSchemaType("arena"), "StadiumOrArena");
  assert.equal(venueSchemaType("airport"), "Airport");
  assert.equal(venueSchemaType("other"), "Place");
});

test("videoWatchPath encodes kind and id", () => {
  assert.equal(videoWatchPath("ate", 42), "/videos/ate/42");
  assert.equal(videoWatchPath("bad", 1), null);
});

test("restaurant and menu item builders share @id references", () => {
  const restaurant = {
    id: 1,
    name: "Alpha",
    slug: "alpha",
    city: "Dothan",
    state: "AL",
  };
  const item = { id: 88, name: "Burger", description: "Classic" };
  const graph = menuItemPageJsonLd(item, restaurant);
  assert.equal(graph["@context"], "https://schema.org");
  assert.ok(Array.isArray(graph["@graph"]));
  const restaurantNode = graph["@graph"].find((n) => n["@type"] === "Restaurant");
  const itemNode = graph["@graph"].find((n) => n["@type"] === "MenuItem");
  assert.match(restaurantNode["@id"], /#restaurant$/);
  assert.equal(itemNode.isRelatedTo["@id"], restaurantNode["@id"]);
  assert.ok(toJsonLdScriptTag(graph).includes("application/ld+json"));
});

test("destination venue builder uses StadiumOrArena for stadiums", () => {
  const ld = buildDestinationVenueJsonLd({
    slug: "sofi-stadium",
    name: "SoFi Stadium",
    official_name: "SoFi Stadium",
    venue_type: "stadium",
    city: "Inglewood",
    state: "CA",
  });
  assert.equal(ld["@type"], "StadiumOrArena");
  assert.match(ld["@id"], /destination-venues\/sofi-stadium#venue$/);
  assert.ok(destinationVenuePageJsonLd({
    slug: "sofi-stadium",
    name: "SoFi Stadium",
    official_name: "SoFi Stadium",
    venue_type: "stadium",
    city: "Inglewood",
    state: "CA",
  }));
});

test("VideoObject includes restaurant and menu item about refs together", () => {
  const built = buildVideoObjectJsonLd({
    kind: "ate",
    id: 9,
    path: "/videos/ate/9",
    title: "Lunch",
    description: "Yum",
    video_url: "https://cdn.example/v.mp4",
    photo_url: "https://cdn.example/t.jpg",
    created_at: "2026-09-01T12:00:00Z",
    duration_ms: 15000,
    restaurant: {
      id: 1,
      name: "Alpha",
      slug: "alpha",
      city: "Dothan",
      state: "AL",
    },
    menu_item: { id: 88, name: "Burger" },
  });
  assert.equal(built.video["@type"], "VideoObject");
  assert.equal(built.video.duration, "PT15S");
  assert.ok(Array.isArray(built.video.about));
  assert.equal(built.video.about.length, 2);
  assert.equal(built.entities.length, 2);
  const page = videoWatchPageJsonLd({
    kind: "ate",
    id: 9,
    path: "/videos/ate/9",
    title: "Lunch",
    video_url: "https://cdn.example/v.mp4",
    created_at: "2026-09-01T12:00:00Z",
    restaurant: {
      id: 1,
      name: "Alpha",
      slug: "alpha",
      city: "Dothan",
      state: "AL",
    },
  });
  assert.ok(page["@graph"] || page["@type"]);
});

test("restaurantPageJsonLd builds Restaurant type", () => {
  const page = restaurantPageJsonLd({
    name: "Alpha",
    slug: "alpha",
    city: "Dothan",
    state: "AL",
  });
  assert.equal(page["@type"], "Restaurant");
  assert.ok(buildRestaurantJsonLd({ name: "Alpha", slug: "alpha" }));
});

test("middleware matches videos and destination venues and injects JSON-LD helpers", () => {
  const mw = readFileSync(join(root, "middleware.js"), "utf8");
  assert.match(mw, /VIDEO_WATCH_RE/);
  assert.match(mw, /DESTINATION_VENUE_RE/);
  assert.match(mw, /\/videos\/:path\*/);
  assert.match(mw, /\/destination-venues\/:slug/);
  assert.match(mw, /injectJsonLd/);
  assert.match(mw, /videoWatchPageJsonLd/);
  assert.match(mw, /destinationVenuePageJsonLd/);
  assert.match(mw, /destination_venues/);
  assert.match(mw, /inventory\.videos/);
  assert.match(mw, /noindex, follow/);
});

test("App mounts VideoWatchPage route", () => {
  const app = readFileSync(join(root, "src/App.jsx"), "utf8");
  assert.match(app, /VideoWatchPage/);
  assert.match(app, /path="\/videos\/:kind\/:id"/);
});
