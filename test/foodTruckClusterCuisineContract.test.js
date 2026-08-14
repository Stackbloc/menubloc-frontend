/**
 * Food truck public profiles must show cuisine + Cluster when display_cluster is present.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
const editorial = read("src/components/restaurant/FoodTruckPublicEditorial.jsx");
const page = read("src/pages/FoodTruckPage.jsx");

assert.match(shell, /clusterName = displayCluster\?\.name/);
assert.doesNotMatch(shell, /clusterName = !isFoodTruck && displayCluster/);
assert.match(editorial, /displayCluster=\{displayCluster\}/);
assert.match(page, /display_cluster:\s*json\?\.display_cluster/);
assert.match(page, /displayCluster=\{profile\?\.display_cluster/);
assert.match(hero, /data-testid="profile-hero-cuisine-cluster"/);
assert.match(hero, /\{\s*" - "\s*\}/);
assert.match(hero, /profileType !== "food_truck" && cluster/);
assert.doesNotMatch(hero, /showRestaurantContact && cluster \?/);


console.log("foodTruckClusterCuisineContract: ok");
