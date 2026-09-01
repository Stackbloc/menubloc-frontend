/**
 * Guest Feed video — FE contract (public publish + consent + claim).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("guest feed video legal consent UI and API wiring", () => {
  const legal = read("src/lib/legalConsent.js");
  assert.match(legal, /buildGuestPublicationLegalPayload/);
  assert.match(legal, /GUEST_PUBLICATION_CONSENT_LABEL/);
  assert.match(legal, /GUEST_PUBLICATION_NOTICE/);
  assert.match(read("src/content/legal.js"), /terms_of_use_v2026_08_27/);

  const gate = read("src/components/consumer/feed/GuestFeedVideoConsentGate.jsx");
  assert.match(gate, /guest-feed-video-consent-gate/);
  assert.match(gate, /\/terms/);
  assert.match(gate, /\/privacy/);
  assert.match(gate, /guest-feed-video-consent-checkbox/);

  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  assert.match(overlay, /GuestFeedVideoConsentGate/);
  assert.match(overlay, /GuestFeedVideoNextStep/);
  assert.match(overlay, /postGuestFeedAteVideo/);
  assert.doesNotMatch(overlay, /navigate\(`\/account\/login\?next=/);

  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  const pickCategoryBlock =
    shell.match(/function handlePickCategory[\s\S]*?\n  \}/)?.[0] || "";
  assert.match(pickCategoryBlock, /setComposeCategory\(category\)/);
  assert.doesNotMatch(pickCategoryBlock, /account\/login/);

  const api = read("src/lib/guestFeedVideoApi.js");
  assert.match(api, /\/public\/feed-video/);
  assert.match(api, /getOrCreateGuestReporterKey/);

  const compose = read("src/lib/feedVideoCompose.js");
  assert.match(compose, /postGuestFeedWantVideo/);
  assert.match(compose, /postGuestFeedReviewVideo/);

  const claim = read("src/lib/guestFeedClaimSession.js");
  assert.match(claim, /appendGuestFeedClaimToAuthBody/);

  const consumerApi = read("src/lib/consumerApi.js");
  assert.match(consumerApi, /appendGuestFeedClaimToAuthBody/);

  const next = read("src/components/consumer/feed/GuestFeedVideoNextStep.jsx");
  assert.match(next, /guest-feed-video-next-step/);
  assert.match(next, /Create a free account/);
  assert.match(next, /Not now/);
});
