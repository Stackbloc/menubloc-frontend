import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";
import { describe, it } from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("venue profile page contract", () => {
  it("VenueProfilePage mounts a large video billboard hero", () => {
    const page = read("src/pages/VenueProfilePage.jsx");
    assert.match(page, /venue-video-billboard/);
    assert.match(page, /<video/);
    assert.match(page, /What’s happening/);
    assert.match(page, /Informational only/);
    assert.doesNotMatch(page, /PublicProfileShell/);
    assert.doesNotMatch(page, /restaurant_billboard/);
  });

  it("routes /venues/:slug to VenueProfilePage (not ads /venue)", () => {
    const app = read("src/App.jsx");
    assert.match(app, /path="\/venues\/:slug"/);
    assert.match(app, /VenueProfilePage/);
    assert.match(app, /path="\/venue\/login"/);
  });

  it("venueProfileApi uses api.js helpers", () => {
    const api = read("src/lib/venueProfileApi.js");
    assert.match(api, /from "\.\/api\.js"/);
    assert.match(api, /\/public\/venues/);
    assert.doesNotMatch(api, /localhost:3001/);
  });
});
