import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

assert.match(read("src/pages/EventDetailPage.jsx"), /event-age-requirement/);
assert.match(read("src/pages/EventDetailPage.jsx"), /event-purchase-stub/);
assert.match(read("src/pages/operator/OperatorEventsEditor.jsx"), /listVenueEvents/);
assert.match(read("src/pages/operator/OperatorVenuePackagePage.jsx"), /\/operator\/events\/manage/);
assert.match(read("src/components/restaurant/publicProfile/ProfileUpcomingEvents.jsx"), /\/events\//);
assert.match(read("src/App.jsx"), /path="\/events\/:slug"/);
assert.match(read("src/App.jsx"), /path="\/operator\/events\/manage"/);
assert.match(read("src/lib/operatorApi.js"), /listVenueEvents/);
assert.match(read("src/lib/api.js"), /DEFAULT_PROD_API_BASE/);

console.log("venueEventsContract: PASS");
