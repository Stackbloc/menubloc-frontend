/**
 * My Menuply — the diner's personal food home.
 * About Me (with Connections), what she's eating, her plans, wants, crews, events.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createDiningCrew,
  createWhatIAteToday,
  createWhatWeDoingSession,
  createWantToEat,
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  inviteToDiningCrew,
  inviteToVenueEventGroup,
  listConnections,
  listDiningCrews,
  listMyFoodActivity,
  listMyVenueEventGroups,
  listMyVenueEvents,
  listWantToEat,
  listWhatIAteToday,
  listWhatWeDoingSessions,
  resolveConsumerMediaUrl,
  updateConsumerProfile,
  uploadDinerAvatar,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import {
  buildDiningCrewInviteShareData,
  buildMenuplyPathShareData,
} from "../../lib/diningCrewInviteShare.js";
import WhatIAteTodayCalendar from "../../components/consumer/WhatIAteTodayCalendar.jsx";
import * as s from "./myMenuply/myMenuplyStyles.js";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import QuickCompose from "./myMenuply/QuickCompose.jsx";
import PostAfterActions from "./myMenuply/PostAfterActions.jsx";
import {
  PhotoGrid,
  SectionHead,
  EatingPlanCard,
  NamedShareCard,
  foodHref,
} from "./myMenuply/myMenuplyBits.jsx";

function planYmd(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return "";
}

function compareYmd(ymd, today = whatIAteTodayLocalDate()) {
  const day = planYmd(ymd);
  if (!day) return 0;
  if (day > today) return 1;
  if (day < today) return -1;
  return 0;
}

function bumpDayCount(rows, ymd) {
  const day = planYmd(ymd);
  if (!day) return;
  const found = rows.find((r) => r.eaten_on === day);
  if (found) found.entry_count += 1;
  else rows.push({ eaten_on: day, entry_count: 1 });
}

function formatEventWhen(ev) {
  const raw = ev?.starts_at || ev?.event_date;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MyMenuplyPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityNotice, setIdentityNotice] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [postBusy, setPostBusy] = useState("");
  const [eating, setEating] = useState([]);
  const [plans, setPlans] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [wants, setWants] = useState([]);
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);
  const [planDate, setPlanDate] = useState(() => whatIAteTodayLocalDate());
  const [planMonth, setPlanMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [lastPost, setLastPost] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [
        profileRes,
        activityRes,
        ateRes,
        planRes,
        connRes,
        followRes,
        likeRes,
        wantRes,
        crewRes,
        eventRes,
        groupRes,
      ] = await Promise.all([
        getConsumerProfile().catch(() => null),
        listMyFoodActivity(20).catch(() => ({ activities: [] })),
        listWhatIAteToday(whatIAteTodayLocalDate()).catch(() => ({ entries: [] })),
        listWhatWeDoingSessions().catch(() => ({ sessions: [] })),
        listConnections().catch(() => ({ accepted: [] })),
        getFollowedRestaurants().catch(() => ({ restaurants: [] })),
        getLikedMenuItems().catch(() => ({ likes: [] })),
        listWantToEat().catch(() => ({ items: [] })),
        listDiningCrews().catch(() => ({ crews: [] })),
        listMyVenueEvents().catch(() => ({ events: [] })),
        listMyVenueEventGroups().catch(() => ({ groups: [] })),
      ]);
      const nextProfile = profileRes?.profile || null;
      setProfile(nextProfile);
      setAvatarUrl(resolveConsumerMediaUrl(nextProfile?.avatar_url || ""));
      const activityItems = (activityRes.activities || []).map((row) => ({
        ...row,
        id: `fa-${row.id}`,
        food_name: row.item_name || row.comment || "Food",
        kind: "im_eating",
      }));
      const diaryItems = (ateRes.entries || []).map((row) => ({
        ...row,
        id: `wia-${row.id}`,
        entry_id: row.id,
        food_name: row.item_name || row.food_name || "Food",
        kind: "what_i_ate",
      }));
      setEating([...diaryItems, ...activityItems].slice(0, 12));
      setPlans(planRes.sessions || []);
      setConnections(connRes.accepted || []);
      setFollowed(followRes.restaurants || followRes.items || []);
      setLiked(likeRes.likes || []);
      setWants(wantRes.items || []);
      setCrews(crewRes.crews || crewRes.items || []);
      setEvents(eventRes.events || []);
      setEventGroups(groupRes.groups || []);
    } catch (err) {
      setError(err.message || "Unable to load My Menuply");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "You";

  async function onAvatarFile(file) {
    setIdentityBusy(true);
    setIdentityError("");
    setIdentityNotice("");
    try {
      const data = await uploadDinerAvatar(file);
      setAvatarUrl(resolveConsumerMediaUrl(data.avatar_url || data.card?.avatar_url || ""));
      setIdentityNotice("Profile photo updated.");
    } catch (err) {
      setIdentityError(err.message || "Unable to upload photo");
    } finally {
      setIdentityBusy(false);
    }
  }

  async function onAboutSave(next) {
    setIdentityError("");
    setIdentityNotice("");
    try {
      const data = await updateConsumerProfile({ diner_about: next });
      setProfile((prev) => ({ ...(prev || {}), diner_about: data?.profile?.diner_about ?? next }));
      setIdentityNotice("About saved.");
    } catch (err) {
      setIdentityError(err.message || "Unable to save About");
    }
  }

  async function postEating({ text, file }) {
    setPostBusy("eating");
    setError("");
    try {
      if (compareYmd(planDate) > 0) {
        const data = await createWhatWeDoingSession({
          plan_date: planDate,
          place_label: text || undefined,
        });
        const session = data.session || data;
        setLastPost({ kind: "plan", token: session.token, id: session.id });
      } else {
        let photo_url;
        if (file) {
          const up = await uploadWhatIAteTodayPhoto(file);
          photo_url = up.photo_url || undefined;
        }
        const data = await createWhatIAteToday({
          food_name: text || "Food",
          photo_url,
          eaten_on: planDate,
          meal_period: defaultWhatIAteMealPeriod(),
        });
        const entry = data.entry || data;
        setLastPost({ kind: "diary", id: entry.id });
      }
      await load();
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  async function postWant({ text }) {
    setPostBusy("want");
    setError("");
    try {
      const data = await createWantToEat({ food_name: text });
      const item = data.item || data;
      setLastPost({
        kind: "want",
        id: item.id,
        food_name: item.food_name,
        comment: item.comment,
        meal_period: item.meal_period,
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  async function postCrew({ text }) {
    setPostBusy("crews");
    setError("");
    try {
      await createDiningCrew({
        name: text,
        visibility: "public",
        membership_approval: "organizer",
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  function openShare(shareData, { modalTitle, analyticsContext }) {
    if (!shareData?.url) throw new Error("Unable to create join link");
    setSharePayload({ shareData, modalTitle, analyticsContext });
    setShareOpen(true);
  }

  async function shareCrewInvite(crew) {
    setPostBusy("invite");
    setError("");
    try {
      const data = await inviteToDiningCrew(crew.id, {});
      openShare(buildDiningCrewInviteShareData(data.invitation?.url || ""), {
        modalTitle: "Share crew invite",
        analyticsContext: { pageType: "dining_crew_invite", crewId: Number(crew.id) || null },
      });
    } catch (err) {
      setError(err.message || "Invite failed");
    } finally {
      setPostBusy("");
    }
  }

  async function shareEventInvite(ev) {
    setPostBusy("invite");
    setError("");
    try {
      const slug = String(ev.slug || "").trim();
      if (!slug) throw new Error("Event link is missing");
      const name = String(ev.name || "this event").trim();
      openShare(
        buildMenuplyPathShareData(`/events/${encodeURIComponent(slug)}`, {
          title: name,
          text: `Join me at ${name} on Menuply.`,
        }),
        {
          modalTitle: "Share event",
          analyticsContext: { pageType: "venue_event_invite", eventSlug: slug },
        }
      );
    } catch (err) {
      setError(err.message || "Unable to share event");
    } finally {
      setPostBusy("");
    }
  }

  async function shareEventGroupInvite(group) {
    setPostBusy("invite");
    setError("");
    try {
      const data = await inviteToVenueEventGroup(group.id || group.slug);
      const name = String(group.name || "this event group").trim();
      openShare(
        buildMenuplyPathShareData(data.invitation?.url || "", {
          title: name,
          text: `Join ${name} on Menuply.`,
        }),
        {
          modalTitle: "Share event group invite",
          analyticsContext: { pageType: "venue_event_group_invite", groupId: Number(group.id) || null },
        }
      );
    } catch (err) {
      setError(err.message || "Invite failed");
    } finally {
      setPostBusy("");
    }
  }

  return (
    <>
      <StickyPageHeader title="My Menuply" />
      <div style={s.page} data-testid="my-menuply-page">
        <p style={s.kicker}>My food. My people. My plans.</p>
        <h1 style={s.h1}>My Menuply</h1>
        {error ? <p style={s.error}>{error}</p> : null}

        {!authLoading && !isAuthenticated ? (
          <div style={s.signInBox}>
            <p style={{ margin: "0 0 12px", color: "#475467" }}>Sign in for My Menuply.</p>
            <Link to="/account/login?next=/my-menuply" style={s.primaryBtn}>
              Sign in
            </Link>
            <div style={{ marginTop: 10 }}>
              <Link to="/diner/signup" style={s.link}>
                Create account
              </Link>
            </div>
          </div>
        ) : null}

        {authLoading || (isAuthenticated && loading) ? <p style={s.muted}>Loading…</p> : null}

        {isAuthenticated && !loading ? (
          <>
            <DinerIdentityHero
              displayName={displayName}
              avatarUrl={avatarUrl}
              about={profile?.diner_about || ""}
              connections={connections}
              busy={identityBusy}
              notice={identityNotice}
              error={identityError}
              onAvatarFile={onAvatarFile}
              onAboutSave={onAboutSave}
            />

            <section style={s.section} data-testid="what-im-eating">
              <SectionHead title="What I'm Eating" to="/account/what-i-ate" />
              <QuickCompose
                testId="compose-eating"
                placeholder={compareYmd(planDate) > 0 ? "What are you eating?" : "What did you eat?"}
                acceptPhoto={compareYmd(planDate) <= 0}
                busy={postBusy === "eating"}
                onSubmit={postEating}
              />
              <PhotoGrid
                items={eating}
                onSelect={(item) => {
                  if (item?.kind !== "what_i_ate") return;
                  setLastPost({
                    kind: "diary",
                    id: item.entry_id,
                    meal_period: item.meal_period,
                    comment: item.comment,
                    food_name: item.food_name,
                    restaurant_id: item.restaurant_id,
                    restaurant_name: item.restaurant_name,
                    menu_item_id: item.menu_item_id,
                    item_name: item.food_name,
                  });
                }}
              />
              {lastPost?.kind === "diary" ? (
                <PostAfterActions
                  kind="diary"
                  record={lastPost}
                  busy={postBusy === "eating"}
                  followed={followed}
                  onTagged={async () => {
                    setLastPost(null);
                    await load();
                  }}
                />
              ) : null}
              <WhatIAteTodayCalendar
                testId="eating-plans-calendar"
                selectedDate={planDate}
                onSelectDate={setPlanDate}
                viewMonth={planMonth}
                onViewMonthChange={setPlanMonth}
                dayCounts={[
                  ...plans.map((plan) => planYmd(plan.plan_date)),
                  ...eating.map((row) => planYmd(row.eaten_on)),
                ]
                  .filter(Boolean)
                  .reduce((rows, ymd) => {
                    bumpDayCount(rows, ymd);
                    return rows;
                  }, [])}
              />
              <h2 style={s.sectionTitle}>Future plans</h2>
              {plans
                .filter((plan) => compareYmd(plan.plan_date) > 0)
                .slice(0, 12)
                .map((plan) => (
                  <EatingPlanCard
                    key={plan.token || plan.id}
                    plan={plan}
                    onAddDetails={(next) => {
                      setLastPost({
                        kind: "plan",
                        token: next.token,
                        id: next.id,
                        joinable: next.joinable,
                        join_capacity: next.join_capacity,
                        restaurant_id: next.restaurant_id,
                        restaurant_name: next.restaurant_name,
                        place_label: next.place_label,
                      });
                    }}
                  />
                ))}
              {lastPost?.kind === "plan" ? (
                <PostAfterActions
                  kind="plan"
                  record={lastPost}
                  busy={postBusy === "eating"}
                  followed={followed}
                  onTagged={async () => {
                    setLastPost(null);
                    await load();
                  }}
                />
              ) : null}
              <div style={{ ...s.labelRow, marginTop: 14 }}>
                <Link to="/account/what-we-doing" style={s.subLabel}>
                  Invite Me
                </Link>
                <Link to="/account/im-eating" style={s.subLabel}>
                  Join Me
                </Link>
              </div>
            </section>

            <section style={s.section} data-testid="want-to-eat">
              <SectionHead title="What I Want to Eat" />
              <QuickCompose
                testId="compose-want"
                placeholder="What do you want to eat?"
                busy={postBusy === "want"}
                onSubmit={postWant}
              />
              {wants.map((want) => (
                <button
                  key={want.id}
                  type="button"
                  style={{ ...s.card, appearance: "none", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
                  onClick={() =>
                    setLastPost({
                      kind: "want",
                      id: want.id,
                      food_name: want.food_name,
                      comment: want.comment,
                      meal_period: want.meal_period,
                      restaurant_id: want.restaurant_id,
                      restaurant_name: want.restaurant_name,
                      menu_item_id: want.menu_item_id,
                      item_name: want.item_name || want.food_name,
                    })
                  }
                >
                  <div style={{ fontWeight: 800 }}>{want.food_name}</div>
                  {want.restaurant_name ? <div style={s.muted}>{want.restaurant_name}</div> : null}
                </button>
              ))}
              {lastPost?.kind === "want" ? (
                <PostAfterActions
                  kind="want"
                  record={lastPost}
                  busy={postBusy === "want"}
                  followed={followed}
                  onTagged={async () => {
                    setLastPost(null);
                    await load();
                  }}
                />
              ) : null}
              {liked.slice(0, 6).map((meal) => (
                <Link key={meal.menu_item_id} to={foodHref(meal)} style={s.card}>
                  <div style={{ fontWeight: 800 }}>{meal.item_name}</div>
                  <div style={s.muted}>{meal.restaurant_name}</div>
                </Link>
              ))}
            </section>

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="My Crews" to="/account/dining-crews" />
              {crews.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                crews.slice(0, 4).map((crew) => (
                  <NamedShareCard
                    key={crew.id}
                    name={crew.name}
                    href={`/account/dining-crews/${crew.id}`}
                    meta={[
                      crew.viewer_role === "owner" ? "Organized" : null,
                      `${crew.member_count || 0} ${crew.member_count === 1 ? "member" : "members"}`,
                      crew.visibility === "public"
                        ? "Others can request to join"
                        : "Invite people to join",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    onInvite={() => shareCrewInvite(crew)}
                    inviteLabel="Invite people to join"
                  />
                ))
              )}
              <QuickCompose
                testId="compose-crew"
                placeholder="Crew name"
                busy={postBusy === "crews"}
                onSubmit={postCrew}
              />
            </section>

            <section style={s.section} data-testid="my-events">
              <SectionHead title="My Events" />
              {events.length === 0 && eventGroups.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                <>
                  {events.slice(0, 4).map((ev) => (
                    <NamedShareCard
                      key={ev.id || ev.slug}
                      name={ev.name}
                      href={`/events/${encodeURIComponent(String(ev.slug))}`}
                      meta={[
                        ev.rsvp_status === "going" ? "Going" : "Interested",
                        formatEventWhen(ev),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onInvite={() => shareEventInvite(ev)}
                      inviteLabel="Invite people to join"
                    />
                  ))}
                  {eventGroups.slice(0, 4).map((g) => (
                    <NamedShareCard
                      key={g.id || g.slug}
                      name={g.name}
                      href={`/events/groups/${encodeURIComponent(String(g.slug))}`}
                      meta={[
                        g.role === "owner" ? "Organized" : null,
                        g.event_name,
                        g.visibility === "public" ? "Others can request to join" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onInvite={() => shareEventGroupInvite(g)}
                      inviteLabel="Invite people to join"
                    />
                  ))}
                </>
              )}
            </section>
          </>
        ) : null}
      </div>
      <BottomNav />
      {sharePayload?.shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          modalTitle={sharePayload.modalTitle}
          shareData={sharePayload.shareData}
          analyticsContext={sharePayload.analyticsContext}
        />
      ) : null}
    </>
  );
}
