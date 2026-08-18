/**
 * My Menuply — the diner's personal food home.
 * About Me (with Connections), what she's eating, her plans, wants, crews, events.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createDiningCrew,
  createWhatIAteToday,
  createWhatWeDoingSession,
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  listConnections,
  listDiningCrews,
  listMyFoodActivity,
  listMyVenueEventGroups,
  listMyVenueEvents,
  listWhatIAteToday,
  listWhatWeDoingSessions,
  resolveConsumerMediaUrl,
  updateConsumerProfile,
  uploadDinerAvatar,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import { formatWhatWeDoingTitle } from "../../lib/whatWeDoingTitle.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import QuickCompose from "./myMenuply/QuickCompose.jsx";
import {
  PhotoGrid,
  SectionHead,
  foodHref,
  restaurantHref,
} from "./myMenuply/myMenuplyBits.jsx";

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
  const [joinMe, setJoinMe] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);

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
        crewRes,
        eventRes,
        groupRes,
      ] = await Promise.all([
        getConsumerProfile().catch(() => null),
        listMyFoodActivity(20).catch(() => ({ activities: [] })),
        listWhatIAteToday().catch(() => ({ entries: [] })),
        listWhatWeDoingSessions().catch(() => ({ sessions: [] })),
        listConnections().catch(() => ({ accepted: [] })),
        getFollowedRestaurants().catch(() => ({ restaurants: [] })),
        getLikedMenuItems().catch(() => ({ likes: [] })),
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
        food_name: row.item_name || row.food_name || "Food",
        kind: "what_i_ate",
      }));
      setEating([...diaryItems, ...activityItems].slice(0, 12));
      setJoinMe(
        (activityRes.activities || []).filter((row) => {
          const jm = row.join_me;
          return jm && jm.join_me_active !== false && (jm.invitation_token || jm.url);
        })
      );
      setPlans(planRes.sessions || []);
      setConnections(connRes.accepted || []);
      setFollowed(followRes.restaurants || followRes.items || []);
      setLiked(likeRes.likes || []);
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
      let photo_url;
      if (file) {
        const up = await uploadWhatIAteTodayPhoto(file);
        photo_url = up.photo_url || undefined;
      }
      await createWhatIAteToday({
        food_name: text || "Food",
        photo_url,
        eaten_on: whatIAteTodayLocalDate(),
        meal_period: defaultWhatIAteMealPeriod(),
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  async function postPlan({ text }) {
    setPostBusy("plans");
    setError("");
    try {
      const plan_date = text || whatIAteTodayLocalDate();
      await createWhatWeDoingSession({ plan_date });
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
      await createDiningCrew({ name: text });
      await load();
    } catch (err) {
      setError(err.message || "Unable to add");
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
              <PhotoGrid items={eating} empty="Nothing yet." />
              <QuickCompose
                testId="compose-eating"
                placeholder="What did you eat?"
                acceptPhoto
                busy={postBusy === "eating"}
                onSubmit={postEating}
              />
            </section>

            <section style={s.section} data-testid="eating-plans">
              <SectionHead title="My Eating Plans" to="/account/what-we-doing" />
              <div style={s.labelRow}>
                <Link to="/account/what-we-doing" style={s.subLabel}>
                  Invite Me
                </Link>
                <Link to="/account/im-eating" style={s.subLabel}>
                  Join Me
                </Link>
              </div>
              {plans.length === 0 && joinMe.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                <>
                  {plans.slice(0, 4).map((plan) => (
                    <Link
                      key={plan.token || plan.id}
                      to={`/account/what-we-doing/${plan.token}`}
                      style={s.card}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {plan.title || formatWhatWeDoingTitle(plan.plan_date)}
                      </div>
                      <div style={s.muted}>{plan.plan_date}</div>
                    </Link>
                  ))}
                  {joinMe.slice(0, 2).map((row) => (
                    <Link key={row.id} to="/account/im-eating" style={s.card}>
                      <div style={{ fontWeight: 800 }}>Join Me</div>
                      <div style={s.muted}>{row.restaurant_name || row.item_name || "Now"}</div>
                    </Link>
                  ))}
                </>
              )}
              <QuickCompose
                testId="compose-plan"
                inputType="date"
                defaultValue={whatIAteTodayLocalDate()}
                busy={postBusy === "plans"}
                onSubmit={postPlan}
              />
            </section>

            <section style={s.section} data-testid="want-to-eat">
              <SectionHead title="What I Want to Eat" />
              {liked.length === 0 && followed.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                <>
                  {liked.slice(0, 6).map((meal) => (
                    <Link key={meal.menu_item_id} to={foodHref(meal)} style={s.card}>
                      <div style={{ fontWeight: 800 }}>{meal.item_name}</div>
                      <div style={s.muted}>{meal.restaurant_name}</div>
                    </Link>
                  ))}
                  {followed.slice(0, 6).map((place) => (
                    <Link
                      key={place.restaurant_id || place.id}
                      to={restaurantPathFromRow(place) || restaurantHref(place) || "/"}
                      style={s.card}
                    >
                      {place.restaurant_name || place.name}
                    </Link>
                  ))}
                </>
              )}
            </section>

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="My Crews" to="/account/dining-crews" />
              {crews.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                crews.slice(0, 4).map((crew) => (
                  <Link key={crew.id} to={`/account/dining-crews/${crew.id}`} style={s.card}>
                    {crew.name}
                    <div style={s.muted}>
                      {crew.viewer_role === "owner" ? "Organized" : null}
                      {crew.viewer_role === "owner" ? " · " : ""}
                      {crew.member_count || 0} {crew.member_count === 1 ? "member" : "members"}
                    </div>
                  </Link>
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
                    <Link
                      key={ev.id || ev.slug}
                      to={`/events/${encodeURIComponent(String(ev.slug))}`}
                      style={s.card}
                    >
                      {ev.name}
                      <div style={s.muted}>
                        {[ev.rsvp_status === "going" ? "Going" : "Interested", formatEventWhen(ev)]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </Link>
                  ))}
                  {eventGroups.slice(0, 4).map((g) => (
                    <Link
                      key={g.id || g.slug}
                      to={`/events/groups/${encodeURIComponent(String(g.slug))}`}
                      style={s.card}
                    >
                      {g.name}
                      <div style={s.muted}>
                        {[g.role === "owner" ? "Organized" : null, g.event_name].filter(Boolean).join(" · ")}
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </section>
          </>
        ) : null}
      </div>
      <BottomNav />
    </>
  );
}
