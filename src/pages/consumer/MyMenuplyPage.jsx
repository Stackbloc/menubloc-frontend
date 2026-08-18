/**
 * My Menuply — personal food/social home.
 * Four questions: what I ate, what I am planning, what connections are eating, what they are planning.
 * Not the account settings dashboard.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import InviteToEatButton from "../../components/InviteToEatButton.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  listConnectionsEating,
  listConnectionsPlanning,
  listDiningCrews,
  listMyFoodActivity,
  listMyVenueEvents,
  listWhatIAteToday,
  listWhatWeDoingSessions,
  resolveConsumerMediaUrl,
  updateConsumerProfile,
  uploadDinerAvatar,
} from "../../lib/consumerApi.js";
import { restaurantPathFromRow } from "../../lib/canonicalUrl.js";
import { formatWhatWeDoingTitle } from "../../lib/whatWeDoingTitle.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import {
  ConnectionFoodCard,
  PhotoGrid,
  PlanCard,
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
  const [eating, setEating] = useState([]);
  const [plans, setPlans] = useState([]);
  const [connEating, setConnEating] = useState([]);
  const [connPlanning, setConnPlanning] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [
        profileRes,
        activityRes,
        ateRes,
        planRes,
        eatConn,
        planConn,
        followRes,
        likeRes,
        crewRes,
        eventRes,
      ] = await Promise.all([
        getConsumerProfile().catch(() => null),
        listMyFoodActivity(20).catch(() => ({ activities: [] })),
        listWhatIAteToday().catch(() => ({ entries: [] })),
        listWhatWeDoingSessions().catch(() => ({ sessions: [] })),
        listConnectionsEating(8).catch(() => ({ items: [] })),
        listConnectionsPlanning(8).catch(() => ({ items: [] })),
        getFollowedRestaurants().catch(() => ({ restaurants: [] })),
        getLikedMenuItems().catch(() => ({ likes: [] })),
        listDiningCrews().catch(() => ({ crews: [] })),
        listMyVenueEvents().catch(() => ({ events: [] })),
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
      setPlans(planRes.sessions || []);
      setConnEating(eatConn.items || []);
      setConnPlanning(planConn.items || []);
      setFollowed(followRes.restaurants || followRes.items || []);
      setLiked(likeRes.likes || []);
      setCrews(crewRes.crews || crewRes.items || []);
      setEvents(eventRes.events || []);
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

  const placesIEat = useMemo(() => {
    const map = new Map();
    for (const item of eating) {
      const id = item.restaurant_id || item.restaurant_slug;
      if (!id || map.has(String(id))) continue;
      map.set(String(id), item);
    }
    return [...map.values()];
  }, [eating]);

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

  return (
    <>
      <StickyPageHeader title="My Menuply" />
      <div style={s.page} data-testid="my-menuply-page">
        <p style={s.kicker}>My food. My people. My plans.</p>
        <h1 style={s.h1}>My Menuply</h1>
        <p style={s.lead}>Your food life — not account settings.</p>
        {error ? <p style={s.error}>{error}</p> : null}

        {!authLoading && !isAuthenticated ? (
          <div style={s.signInBox}>
            <p style={{ margin: "0 0 12px", color: "#475467" }}>
              Sign in to see what you ate, what you are planning, and what your connections are eating.
            </p>
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
              busy={identityBusy}
              notice={identityNotice}
              error={identityError}
              onAvatarFile={onAvatarFile}
              onAboutSave={onAboutSave}
            />

            <section style={s.section} data-testid="what-im-eating">
              <SectionHead
                title="What I'm Eating"
                desc="Photos from your dining history — tap to open the food or place."
                to="/account/what-i-ate"
                actionLabel="Add photo"
              />
              <PhotoGrid items={eating} empty="No dining photos yet. Add I'm Eating At or What I Ate Today." />
            </section>

            <section style={s.section} data-testid="public-activity">
              <SectionHead
                title="What's happening"
                desc="Public and nearby food activity — not your connections."
                to="/waiter#activity"
              />
            </section>

            <section style={s.section} data-testid="connections-eating">
              <SectionHead
                title="What My Connections Are Eating"
                desc="What are my connections eating?"
                to="/my-menuply/connections-eating"
              />
              {connEating.length === 0 ? (
                <p style={s.muted}>No connection food activity yet. Eat together starts here.</p>
              ) : (
                connEating.slice(0, 4).map((item) => <ConnectionFoodCard key={item.id} item={item} />)
              )}
            </section>

            <section style={s.section} data-testid="eating-plans">
              <SectionHead
                title="Eating Plans"
                desc="What am I planning to eat?"
                to="/account/what-we-doing"
                actionLabel="Create Eating Plan"
              />
              {plans.length === 0 ? (
                <p style={s.muted}>No upcoming plans. Create one and invite people.</p>
              ) : (
                plans.slice(0, 4).map((plan) => (
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
                ))
              )}
            </section>

            <section style={s.section} data-testid="connections-planning">
              <SectionHead
                title="What My Connections Are Planning"
                desc="What are my connections planning to eat?"
                to="/my-menuply/connections-planning"
              />
              {connPlanning.length === 0 ? (
                <p style={s.muted}>No shared plans yet. Join Me when someone is looking.</p>
              ) : (
                connPlanning.slice(0, 4).map((item) => <PlanCard key={item.id} item={item} />)
              )}
            </section>

            <section style={s.section} data-testid="where-i-eat">
              <h2 style={s.sectionTitle}>Where I Eat</h2>
              <p style={s.sectionDesc}>Places I eat — existing restaurant profiles, not a duplicate list.</p>
              <h3 style={{ ...s.kicker, marginTop: 8 }}>Places I Eat</h3>
              {placesIEat.length === 0 ? (
                <p style={s.muted}>Restaurants from your eating history will show here.</p>
              ) : (
                placesIEat.slice(0, 6).map((place) => (
                  <Link key={place.restaurant_id || place.restaurant_slug} to={restaurantHref(place) || "/"} style={s.card}>
                    {place.restaurant_name || "Restaurant"}
                  </Link>
                ))
              )}
              <h3 style={{ ...s.kicker, marginTop: 16 }}>Places I Want to Eat</h3>
              {followed.length === 0 ? (
                <p style={s.muted}>
                  Follow restaurants to save them.{" "}
                  <Link to="/account/following" style={s.link}>
                    Following
                  </Link>
                </p>
              ) : (
                followed.slice(0, 6).map((place) => (
                  <Link
                    key={place.restaurant_id || place.id}
                    to={restaurantPathFromRow(place) || `/restaurants/${place.restaurant_id || place.id}`}
                    style={s.card}
                  >
                    {place.restaurant_name || place.name}
                  </Link>
                ))
              )}
            </section>

            <section style={s.section} data-testid="want-to-eat">
              <SectionHead title="Want to Eat" desc="Dishes and places you want to try." to="/search" actionLabel="Find food" />
              {liked.length === 0 && followed.length === 0 ? (
                <p style={s.muted}>Like a dish or follow a restaurant to build this list.</p>
              ) : (
                <>
                  {liked.slice(0, 6).map((meal) => (
                    <div key={meal.menu_item_id} style={s.card}>
                      <Link to={foodHref(meal)} style={{ ...s.link, color: "#0B0F0C", fontWeight: 800 }}>
                        {meal.item_name}
                      </Link>
                      <div style={s.muted}>{meal.restaurant_name}</div>
                      <div style={s.actions}>
                        {meal.restaurant_id ? (
                          <InviteToEatButton
                            restaurantId={meal.restaurant_id}
                            restaurantName={meal.restaurant_name}
                            menuItemId={meal.menu_item_id}
                            menuItemName={meal.item_name}
                            size="compact"
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </section>

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="Dining Crews" to="/account/dining-crews" />
              {crews.length === 0 ? (
                <p style={s.muted}>No Dining Crew yet — not a follower list.</p>
              ) : (
                crews.slice(0, 4).map((crew) => (
                  <Link
                    key={crew.id}
                    to={`/account/dining-crews/${crew.id}`}
                    style={s.card}
                  >
                    {crew.name}
                    <div style={s.muted}>
                      {crew.member_count || 0} {crew.member_count === 1 ? "member" : "members"}
                    </div>
                  </Link>
                ))
              )}
            </section>

            <section style={s.section} data-testid="my-events">
              <SectionHead title="Events" desc="Attending, interested, and created." to="/clusters" actionLabel="Find events" />
              {events.length === 0 ? (
                <p style={s.muted}>No events yet.</p>
              ) : (
                events.slice(0, 4).map((ev) => (
                  <Link key={ev.id || ev.slug} to={`/events/${encodeURIComponent(String(ev.slug))}`} style={s.card}>
                    {ev.name}
                    <div style={s.muted}>
                      {[ev.rsvp_status === "going" ? "Going" : "Interested", formatEventWhen(ev)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </Link>
                ))
              )}
            </section>
          </>
        ) : null}
      </div>
      <BottomNav />
    </>
  );
}
