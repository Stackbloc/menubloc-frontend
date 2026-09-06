import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Join Me is identity-gated and distinct from Invite to Eat", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path=["']\/join-me\/:token["']/);
  assert.match(app, /JoinMeLandingPage/);

  const landing = read("src/pages/JoinMeLandingPage.jsx");
  assert.match(landing, /join-me-landing/);
  assert.match(landing, /I'm here now|Join Me/i);

  const eat = read("src/pages/EatInvitationPage.jsx");
  assert.match(eat, /Navigate to=\{`\/join-me\/\$\{encodeURIComponent/);

  const share = read("src/lib/joinMeShare.js");
  assert.match(share, /https:\/\/menuply\.com\/join-me/);
  assert.match(share, /absoluteCanonicalUrl/);
  assert.doesNotMatch(share, /window\.location\.(href|origin)/);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /\/api\/consumer\/join-me/);

  const panel = read("src/components/foodActivity/ImEatingAtPanel.jsx");
  assert.match(panel, /isAuthenticated/);
  assert.match(panel, /GuestContributeNextStep/);
  assert.match(panel, /join-me-activate/);

  assert.doesNotMatch(read("src/pages/FoodInterestsPage.jsx"), /JoinMeLandingPage/);
});

test("Join Me joiner CTA never routes to I'm Eating At composer", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.doesNotMatch(page, /joinMeHref=["']\/account\/im-eating["']/);

  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(hub, /isJoinMeGuestHref/);
  assert.match(hub, /readOnly && isJoinMeGuestHref\(joinMeHref\)/);
  assert.match(hub, /\/join-me\//);
  assert.match(hub, /\/account\/what-we-doing\//);
  assert.doesNotMatch(hub, /joinMeHref=["']\/account\/im-eating["']/);
});
