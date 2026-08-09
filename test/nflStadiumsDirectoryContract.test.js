/**
 * NFL stadiums directory — /clusters/stadiums/nfl
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function run() {
  const page = read("src/pages/NflStadiumsDirectoryPage.jsx");
  assert.match(page, /fetchDestinationVenueDirectory/);
  assert.match(page, /league: "nfl"/);
  assert.match(page, /\/destination-venues\//);
  assert.match(page, /teamLabel|teams/);
  assert.match(page, /CLUSTER_DIRECTORY_GRID_STYLE/);
  assert.match(page, /Explore →/);
  assert.match(page, /#f8fafc|#ffffff/);
  assert.doesNotMatch(page, /#0c1620|#0f1a24/);
  assert.doesNotMatch(page, /HomeNext/);
  assert.doesNotMatch(page, /FoodInterestsPage/);

  const api = read("src/lib/destinationVenueApi.js");
  assert.match(api, /fetchDestinationVenueDirectory/);
  assert.match(api, /\/public\/destination-venues/);

  const app = read("src/App.jsx");
  assert.match(app, /NflStadiumsDirectoryPage/);
  assert.match(app, /\/clusters\/stadiums\/nfl/);
  // Must be registered before /clusters/:stateSlug/:citySlug
  const stadiumsIdx = app.indexOf('path="/clusters/stadiums/nfl"');
  const cityIdx = app.indexOf('path="/clusters/:stateSlug/:citySlug"');
  assert.ok(stadiumsIdx > 0 && cityIdx > stadiumsIdx, "stadiums route before city catch-all");
  assert.match(app, /Navigate to="\/clusters\/stadiums\/nfl"/);

  const hub = read("src/pages/DestinationVenuePage.jsx");
  assert.match(hub, /\/clusters\/stadiums\/nfl/);

  console.log("nflStadiumsDirectoryContract PASS");
}

run();
