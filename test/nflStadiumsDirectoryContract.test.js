/**
 * NFL stadiums directory — /nfl/stadiums
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
  assert.doesNotMatch(page, /HomeNext/);
  assert.doesNotMatch(page, /FoodInterestsPage/);

  const api = read("src/lib/destinationVenueApi.js");
  assert.match(api, /fetchDestinationVenueDirectory/);
  assert.match(api, /\/public\/destination-venues/);

  const app = read("src/App.jsx");
  assert.match(app, /NflStadiumsDirectoryPage/);
  assert.match(app, /\/nfl\/stadiums/);

  console.log("nflStadiumsDirectoryContract PASS");
}

run();
