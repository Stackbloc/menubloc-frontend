import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEatInviteMessageDraft,
  buildEatInviteShareText,
  defaultScheduledTimeForInviteSeed,
  listInviteMessageOptions,
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
  assert.match(modal, /listInviteMessageOptions/);
  assert.match(modal, /invite-message-options/);
  assert.match(modal, /invite-message-option-\$\{opt\.code\}/);
  assert.match(modal, /invite-message-option-custom/);
  assert.match(modal, /Write your own/);
  assert.match(modal, /invite-invitee-name/);
  assert.match(modal, /invitee_display_name/);
  assert.match(modal, /invite-schedule-mode/);
  assert.match(modal, /invite-schedule-recipient-chooses/);
  assert.match(modal, /Let them choose the date/);
  assert.match(modal, /schedule_mode/);
  assert.match(modal, /recipient_chooses/);
  assert.match(modal, /restaurant_negotiable|restaurantNegotiable/);
  assert.match(modal, /schedule_negotiable|scheduleNegotiable/);
  assert.match(modal, /initialSeedCode/);
  assert.match(modal, /autoOpenShareOnReady/);
  assert.match(modal, /defaultScheduledTimeForInviteSeed/);
  assert.match(modal, /RSVP without a Menuply account/);

  const startPage = read("src/pages/consumer/InviteToEatStartPage.jsx");
  assert.match(startPage, /seed_code/);
  assert.match(startPage, /quick_invite/);
  assert.match(startPage, /autoOpenShareOnReady/);
  assert.match(startPage, /initialSeedCode/);
  assert.match(modal, /Allow restaurant changes|fixed-location/);
  assert.match(modal, /type=["']radio["']/);
  assert.match(modal, /gridTemplateColumns:\s*["']16px minmax\(0, 1fr\)["']/);
  assert.match(modal, /radioControl/);
  assert.doesNotMatch(modal, /marginTop:\s*3/);
  assert.match(modal, /invite_kind/);
  assert.match(modal, /invite-guest-name/);
  assert.match(modal, /getOrCreateEatInviteGuestKey/);
  assert.match(modal, /guest_key/);
  assert.match(modal, /diningCrewId/);
  assert.match(modal, /dining_crew_id/);
  assert.doesNotMatch(modal, /Invitation Sent/);
  assert.doesNotMatch(modal, /invite-first-name|organizer_first_name/);
  assert.doesNotMatch(modal, /navigator\.share/);
  assert.match(modal, /shareOpen && shareData/);
  assert.doesNotMatch(modal, /navigator\.contacts|getUserMedia/);
  assert.doesNotMatch(modal, /\bDate\b.*category|dating/i);
  assert.doesNotMatch(modal, /glossary|Let's Do Lunch means/i);

  const api = read("src/lib/eatInvitationsApi.js");
  assert.match(api, /\/public\/eat-invitations/);
  assert.match(api, /createEatInvitationCounterProposal/);
  assert.match(api, /resolveEatInvitationProposal/);
  assert.match(api, /\/proposals/);
  assert.doesNotMatch(api, /\/api\/consumer\/eat-invitations/);

  const guestId = read("src/lib/eatInviteGuestIdentity.js");
  assert.match(guestId, /getOrCreateEatInviteGuestKey/);
  assert.match(guestId, /setEatInviteGuestDisplayName/);
});

test("Share copy options include LDL/LDD/LHC/MMH with light emoji", () => {
  assert.equal(defaultScheduledTimeForInviteSeed("LHC"), "09:00");
  assert.equal(defaultScheduledTimeForInviteSeed("LDL"), "12:30");
  assert.equal(defaultScheduledTimeForInviteSeed("LDD"), "19:00");
  assert.equal(pickInviteCopySeed({ scheduledTime: "12:30" }).code, "LDL");
  assert.equal(pickInviteCopySeed({ scheduledTime: "19:00" }).code, "LDD");
  assert.equal(pickInviteCopySeed({ scheduledTime: "10:00" }).code, "LHC");
  assert.equal(pickInviteCopySeed({ scheduledTime: "23:00" }).code, "MMH");

  const options = listInviteMessageOptions({
    inviteKind: "private",
    restaurantName: "Fixins",
    dateLabel: "Friday",
    timeLabel: "12:30 PM",
    scheduledTime: "12:30",
  });
  assert.equal(options.length, 4);
  assert.deepEqual(
    options.map((o) => o.code),
    ["LDL", "LDD", "LHC", "MMH"]
  );
  assert.match(options[0].text, /LDL/);

  const lunch = buildEatInviteShareText({
    inviteKind: "private",
    restaurantName: "Fixins",
    dateLabel: "Friday, August 15",
    timeLabel: "12:30 PM",
    scheduledTime: "12:30",
    seedCode: "LDL",
    url: "https://menuply.com/invite/abc",
  });
  assert.match(lunch, /LDL/);
  assert.match(lunch, /Let's do lunch at Fixins/);
  assert.match(lunch, /menuply\.com\/invite\/abc/);
  assert.match(lunch, /Open a free Menuply account/);
  assert.match(lunch, /menuply\.com\/diner\/signup/);

  const custom = buildEatInviteShareText({
    inviteKind: "group",
    restaurantName: "Fixins",
    message: "Join us for tacos",
    url: "https://menuply.com/invite/xyz",
  });
  assert.match(custom, /Join us for tacos/);
  assert.doesNotMatch(custom, /LDL|LDD|LHC|MMH/);

  const coffee = buildEatInviteMessageDraft({
    inviteKind: "private",
    restaurantName: "Bestia",
    dateLabel: "tomorrow",
    timeLabel: "10:00 AM",
    scheduledTime: "10:00",
    seedCode: "LHC",
  });
  assert.match(coffee, /LHC/);
  assert.match(coffee, /Let's have coffee at Bestia/);

  const chooseTime = buildEatInviteMessageDraft({
    inviteKind: "private",
    restaurantName: "Bestia",
    dateLabel: "",
    timeLabel: "",
    seedCode: "LDD",
  });
  assert.match(chooseTime, /You pick the date/);
});

test("Eat invitation public page uses live About Us; named private invitee; guest RSVP", () => {
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
  assert.match(page, /invite-guest-no-account/);
  assert.match(page, /invite-account-invite/);
  assert.match(page, /MenuplyAccountInviteCard/);
  assert.match(page, /No Menuply account needed/);
  assert.match(page, /skipGuestNameField/);
  assert.match(page, /invite-named-invitee/);
  assert.match(page, /invitee_display_name/);
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
  assert.match(page, /invite-propose-schedule|proposedDate|proposed_date/);
  assert.match(page, /recipient_chooses|recipientChooses/);
  assert.match(page, /You choose the date/);
  assert.match(page, /createEatInvitationCounterProposal/);
  assert.match(page, /resolveEatInvitationProposal/);
  assert.match(page, /invite-proposal-history|ProposalHistory/);
  assert.match(page, /invite-counter-form|Propose a change/);
  assert.match(page, /invite-proposal-accept/);
  assert.match(page, /Counter again/);
  assert.match(page, /restaurant_negotiable|restaurantNegotiable/);
  assert.match(page, /invite-restaurant-fixed|Restaurant is fixed/);
  assert.doesNotMatch(page, /Not responded/);
  const inviteApi = read("src/lib/eatInvitationsApi.js");
  assert.match(inviteApi, /\/proposals/);
  assert.match(inviteApi, /resolveEatInvitationProposal/);
  assert.match(inviteApi, /createEatInvitationCounterProposal/);
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

test("Detail action rail order includes Invite after Share and Comment after Invite", () => {
  const src = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const likeIdx = src.indexOf("LikeMenuItemButton");
  const shareIdx = src.indexOf("<ShareButton");
  const inviteIdx = src.indexOf("<InviteToEatButton");
  const commentIdx = src.indexOf('target="menu_item"');
  assert.ok(likeIdx > 0 && shareIdx > likeIdx && inviteIdx > shareIdx);
  assert.ok(commentIdx > inviteIdx, "Comment after Invite");
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
