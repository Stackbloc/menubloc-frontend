import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

assert.match(read("src/pages/EventDetailPage.jsx"), /event-social-section/);
assert.match(read("src/pages/EventDetailPage.jsx"), /createVenueEventGroup/);
assert.match(read("src/pages/EventGroupDetailPage.jsx"), /members_hidden/);
assert.match(read("src/pages/EventGroupDetailPage.jsx"), /EventGroupInvitePage/);
assert.match(read("src/App.jsx"), /path="\/events\/groups\/:slug"/);
assert.match(read("src/App.jsx"), /path="\/events\/groups\/invite\/:token"/);
assert.match(read("src/lib/consumerApi.js"), /setVenueEventRsvp/);
assert.match(read("src/lib/api.js"), /DEFAULT_PROD_API_BASE/);
assert.doesNotMatch(read("src/pages/EventDetailPage.jsx"), /10\+ tickets →|Reserved area/);

console.log("venueEventGroupsContract: PASS");
