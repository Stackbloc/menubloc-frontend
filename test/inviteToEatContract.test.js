import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEatInviteMessageDraft,
  buildEatInviteShareText,
  pickInviteCopySeed,
} from "../src/lib/eatInviteShareCopy.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("InviteToEatButton tooltip and Invitation Ready confirmation", () => {
  const btn = read("src/components/InviteToEatButton.jsx");
  assert.match(btn, /Invite to Eat/);
  assert.match(btn, /InviteToEatModal/);
  assert.doesNotMatch(btn, /sendSms|twilio|contact.*sync/i);
  assert.doesNotMatch(btn, /\/account\/login/);
  assert.doesNotMatch(btn, /isAuthenticated/);

  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /Who do you want to invite/);
  assert.match(modal, /invite-kind-private/);
  assert.match(modal, /invite-kind-group/);
  assert.match(modal, /One Person/);
  assert.match(modal, /A Group/);
  assert.match(modal, /Create Invitation/);
  assert.match(modal, /Invitation Ready/);
  assert.match(modal, /Share \/ Send/);
  assert.match(modal, /ShareModal/);
  assert.match(modal, /does not send SMS/);
  assert.match(modal, /Ready to Send/);
  assert.match(modal, /buildEatInviteShareText/);
  assert.match(modal, /buildEatInviteMessageDraft/);
  assert.match(modal, /invite_kind/);
  assert.match(modal, /invite-guest-name/);
  assert.match(modal, /getOrCreateEatInviteGuestKey/);
  assert.match(modal, /guest_key/);
  assert.doesNotMatch(modal, /Invitation Sent/);
  assert.doesNotMatch(modal, /invite-first-name|organizer_first_name/);
  assert.doesNotMatch(modal, /navigator\.share/);
  assert.match(modal, /shareOpen && shareData/);
  assert.doesNotMatch(modal, /navigator\.contacts|getUserMedia/);
  assert.doesNotMatch(modal, /\bDate\b.*category|dating/i);
  assert.doesNotMatch(modal, /acronym|glossary|Let's Do Lunch|emoji.?picker|invite_description/i);

  const api = read("src/lib/eatInvitationsApi.js");
  assert.match(api, /\/public\/eat-invitations/);
  assert.doesNotMatch(api, /\/api\/consumer\/eat-invitations/);

  const guestId = read("src/lib/eatInviteGuestIdentity.js");
  assert.match(guestId, /getOrCreateEatInviteGuestKey/);
  assert.match(guestId, /setEatInviteGuestDisplayName/);
});

test("Share copy quietly seeds LDL/LDD/LHC/MMH with light emoji", () => {
  assert.equal(pickInviteCopySeed({ scheduledTime: "12:30" }).code, "LDL");
  assert.equal(pickInviteCopySeed({ scheduledTime: "19:00" }).code, "LDD");
  assert.equal(pickInviteCopySeed({ scheduledTime: "10:00" }).code, "LHC");
  assert.equal(pickInviteCopySeed({ scheduledTime: "23:00" }).code, "MMH");

  const lunch = buildEatInviteShareText({
    inviteKind: "private",
    restaurantName: "Fixins",
    dateLabel: "Friday, August 15",
    timeLabel: "12:30 PM",
    scheduledTime: "12:30",
    url: "https://menuply.com/invite/abc",
  });
  assert.match(lunch, /LDL/);
  assert.match(lunch, /Let's do lunch at Fixins/);
  assert.match(lunch, /menuply\.com\/invite\/abc/);

  const dinner = buildEatInviteShareText({
    inviteKind: "group",
    restaurantName: "Fixins",
    dateLabel: "Saturday, August 15",
    timeLabel: "7:00 PM",
    scheduledTime: "19:00",
    url: "https://menuply.com/invite/xyz",
  });
  assert.match(dinner, /LDD/);
  assert.match(dinner, /Let's do dinner at Fixins/);
  assert.match(dinner, /Who wants to join me/);

  const coffee = buildEatInviteMessageDraft({
    inviteKind: "private",
    restaurantName: "Bestia",
    dateLabel: "tomorrow",
    timeLabel: "10:00 AM",
    scheduledTime: "10:00",
  });
  assert.match(coffee, /LHC/);
  assert.match(coffee, /Let's have coffee at Bestia/);

  const meet = buildEatInviteMessageDraft({
    inviteKind: "group",
    restaurantName: "In-N-Out Burger",
    dateLabel: "Saturday",
    timeLabel: "11:00 PM",
    scheduledTime: "23:00",
  });
  assert.match(meet, /MMH/);
  assert.match(meet, /Meet me here/);
  assert.match(meet, /In-N-Out Burger/);
});

test("Eat invitation public page uses live About Us; guest RSVP; private vs group", () => {
  const page = read("src/pages/EatInvitationPage.jsx");
  assert.match(page, /You're Invited to Eat/);
  assert.match(page, /invited you to eat/);
  assert.match(page, /invite_kind/);
  assert.match(page, /isPrivate/);
  assert.match(page, /I'm Going|I&apos;m Going/);
  assert.match(page, /Maybe/);
  assert.match(page, /Can&apos;t Make It|Can't Make It/);
  assert.match(page, /respondToEatInvitation/);
  assert.match(page, /View Menu/);
  assert.match(page, /invite-guest-name/);
  assert.match(page, /getOrCreateEatInviteGuestKey/);
  assert.match(page, /Open in Maps/);
  assert.match(page, /invite-restaurant-address/);
  assert.match(page, /invite-restaurant-about-us/);
  assert.match(page, /restaurant_about_us/);
  assert.match(page, /invite-restaurant-cuisine/);
  assert.match(page, /invite-party-roster|PartyRoster/);
  assert.match(page, /isGroup \? <PartyRoster/);
  assert.match(page, /and friends/);
  assert.match(page, /ShareModal/);
  assert.match(page, /Share Invitation/);
  assert.match(page, /invite-organizer-status/);
  assert.doesNotMatch(page, /Not responded/);
  assert.doesNotMatch(page, /Join Menuply because/);
  assert.doesNotMatch(page, /invite-first-name/);
  assert.doesNotMatch(page, /Create a free Menuply account to respond/);
  assert.doesNotMatch(page, /invite-auth-prompt/);
  assert.doesNotMatch(page, /\/account\/login/);
  assert.doesNotMatch(page, /invite_description|AI_restaurant_description/);

  const app = read("src/App.jsx");
  assert.match(app, /path=["']\/eat\/:token["']/);
  assert.match(app, /path=["']\/invite\/:token["']/);
  assert.match(app, /EatInvitationPage/);
});

test("Public profile About heading uses restaurant name", () => {
  const about = read("src/components/restaurant/publicProfile/ProfileAboutFounded.jsx");
  assert.match(about, /About \$\{placeName\}|About \$\{/);
  assert.match(about, /aboutHeading/);
  assert.doesNotMatch(about, />About Us</);
});

test("Detail action rail order includes Invite after Share", () => {
  const src = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const likeIdx = src.indexOf("LikeMenuItemButton");
  const shareIdx = src.indexOf("<ShareButton");
  const inviteIdx = src.indexOf("<InviteToEatButton");
  assert.ok(likeIdx > 0 && shareIdx > likeIdx && inviteIdx > shareIdx);
});

test("Restaurant profile hero includes Invite and Comment after Share", () => {
  const hero = read("src/components/restaurant/publicProfile/ProfileHero.jsx");
  assert.match(hero, /InviteToEatButton/);
  assert.match(hero, /FoodCommentNavButton/);
  const railStart = hero.indexOf('data-testid="profile-hero-actions"');
  assert.ok(railStart > -1);
  const railSlice = hero.slice(railStart, railStart + 2200);
  assert.match(
    railSlice,
    /ShareButton[\s\S]*InviteToEatButton[\s\S]*FoodCommentNavButton/
  );
});
