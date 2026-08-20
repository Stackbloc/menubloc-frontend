/**
 * My Menuply — the diner's personal food home.
 * About Me (with Connections), what she's eating, her plans, wants, crews, events.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createDiningCrew,
  createWhatIAteToday,
  createWhatWeDoingSession,
  createWantToEat,
  followRestaurant,
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  inviteToDiningCrew,
  inviteToVenueEventGroup,
  listConnections,
  listConsumerProfileMedia,
  listDiningCrews,
  listMyFoodActivity,
  listMyVenueEventGroups,
  listMyVenueEvents,
  listPendingEatInvitePeople,
  listWantToEat,
  listWhatIAteToday,
  listWhatIAteTodayCalendar,
  listWhatWeDoingSessions,
  resolveConsumerMediaUrl,
  uploadWantToEatPhoto,
  updateConsumerProfile,
  uploadDinerAvatar,
  uploadConsumerProfileMedia,
  deleteConsumerProfileMedia,
  uploadWhatIAteTodayPhoto,
  updateWhatIAteToday,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { eatingMediaFromUpload } from "../../lib/eatingMediaUtils.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import {
  buildDiningCrewInviteShareData,
  buildMenuplyPathShareData,
} from "../../lib/diningCrewInviteShare.js";
import EatingHubSection from "./myMenuply/EatingHubSection.jsx";
import CrewQuickCompose from "./myMenuply/CrewQuickCompose.jsx";
import { buildJoinMeCandidates } from "./myMenuply/joinMeCandidates.js";
import {
  buildEatingDayMarkersFromCalendar,
  compareYmd,
  eatingHistoryStart,
  planYmd,
} from "./myMenuply/eatingHubUtils.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import ProfileCompletionBanner from "../../components/consumer/ProfileCompletionBanner.jsx";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import MyMenuplyPresentationRails from "./myMenuply/MyMenuplyPresentationRails.jsx";
import {
  buildDinerStats,
  buildFollowedRestaurantRails,
  buildTopHighlights,
  buildWantSuggestions,
} from "./myMenuply/myMenuplyPresentation.js";
import {
  SectionHead,
  DiningCrewHubCard,
  NamedShareCard,
  foodHref,
  isScheduledEatingPlan,
} from "./myMenuply/myMenuplyBits.jsx";
import { futurePlanKey, futurePlanRestaurantName } from "./myMenuply/dinerHubFormat.js";
import { eatingFoodName, joinHomemadeComment } from "./myMenuply/eatingPlaceLink.js";
import { mergeEatingFeedForHub, mapDiaryEntriesForHub, mapFoodActivityForHub } from "../../lib/eatingFeedMerge.js";

async function maybeFollowRestaurant(restaurantId) {
  const id = Number(restaurantId);
  if (!Number.isFinite(id) || id <= 0) return;
  try {
    await followRestaurant(id);
  } catch {
    /* already following or unavailable */
  }
}

function formatEventWhen(ev) {
  const raw = ev?.starts_at || ev?.event_date;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function MyMenuplyPage() {
  const { isAuthenticated, loading: authLoading, consumer } = useConsumer();
  const [searchParams] = useSearchParams();
  const eatingSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityNotice, setIdentityNotice] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [profileMedia, setProfileMedia] = useState([]);
  const [postBusy, setPostBusy] = useState("");
  const [eating, setEating] = useState([]);
  const [eatingCalendarDays, setEatingCalendarDays] = useState([]);
  const [plans, setPlans] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [wants, setWants] = useState([]);
  const [wantListError, setWantListError] = useState("");
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);
  const [hubDate, setHubDate] = useState(() => whatIAteTodayLocalDate());
  const [hubMonth, setHubMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [lastPost, setLastPost] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [schedulingPlans, setSchedulingPlans] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [joinCandidates, setJoinCandidates] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDefaultCategory, setComposeDefaultCategory] = useState("ate");
  const [hubFocus, setHubFocus] = useState("");
  const [planPrefill, setPlanPrefill] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [
        profileRes,
        activityRes,
        ateRes,
        calendarRes,
        planRes,
        connRes,
        inviteRes,
        followRes,
        likeRes,
        wantRes,
        crewRes,
        eventRes,
        groupRes,
        mediaRes,
      ] = await Promise.all([
        getConsumerProfile().catch(() => null),
        listMyFoodActivity(20).catch(() => ({ activities: [] })),
        listWhatIAteToday(hubDate).catch(() => ({ entries: [] })),
        listWhatIAteTodayCalendar(eatingHistoryStart(), whatIAteTodayLocalDate()).catch(() => ({
          days: [],
        })),
        listWhatWeDoingSessions().catch(() => ({ sessions: [] })),
        listConnections().catch(() => ({ accepted: [] })),
        listPendingEatInvitePeople().catch(() => ({ people: [] })),
        getFollowedRestaurants().catch(() => ({ restaurants: [] })),
        getLikedMenuItems().catch(() => ({ likes: [] })),
        listWantToEat().catch((err) => {
          setWantListError(err?.message || "Unable to load want list");
          return { items: [] };
        }),
        listDiningCrews().catch(() => ({ crews: [] })),
        listMyVenueEvents().catch(() => ({ events: [] })),
        listMyVenueEventGroups().catch(() => ({ groups: [] })),
        listConsumerProfileMedia().catch(() => ({ items: [] })),
      ]);
      const nextProfile = profileRes?.profile || null;
      setProfile(nextProfile);
      setAvatarUrl(resolveConsumerMediaUrl(nextProfile?.avatar_url || ""));
      setProfileMedia(mediaRes?.items || []);
      const activityItems = mapFoodActivityForHub(activityRes.activities || []);
      const diaryItems = mapDiaryEntriesForHub(ateRes.entries || []);
      setEating(mergeEatingFeedForHub(diaryItems, activityItems).slice(0, 12));
      setEatingCalendarDays(calendarRes?.days || []);
      setPlans(planRes.sessions || []);
      setConnections(connRes.accepted || []);
      setJoinCandidates(
        buildJoinMeCandidates({
          connections: connRes.accepted || [],
          pendingInvites: inviteRes.people || [],
        })
      );
      setFollowed(followRes.restaurants || followRes.items || []);
      setLiked(likeRes.likes || []);
      setWants(wantRes.items || []);
      if ((wantRes.items || []).length > 0) setWantListError("");
      setCrews(crewRes.crews || crewRes.items || []);
      setEvents(eventRes.events || []);
      setEventGroups(groupRes.groups || []);
    } catch (err) {
      setError(err.message || "Unable to load My Menuply");
    } finally {
      setLoading(false);
    }
  }, [hubDate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    if (loading || !isAuthenticated) return undefined;
    const compose = String(searchParams.get("compose") || "").trim().toLowerCase();
    const focus = String(searchParams.get("focus") || "").trim().toLowerCase();
    if (["ate", "want", "plan"].includes(compose)) {
      setComposeDefaultCategory(compose);
      if (compose === "plan") {
        setSchedulingPlans(true);
        setCalendarOpen(true);
      } else {
        setComposeOpen(true);
      }
      const timer = window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    if (["connects", "restaurants", "dishes", "events"].includes(focus)) {
      setHubFocus(focus);
    }
    if (focus === "want") {
      setComposeDefaultCategory("want");
      setComposeOpen(true);
      const timer = window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, loading, isAuthenticated]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "You";
  const scheduledPlans = plans.filter(
    (plan) => compareYmd(plan.plan_date) >= 0 && isScheduledEatingPlan(plan)
  );
  // Future plans are not date-capped — show all scheduled sessions.
  const shownPlans = scheduledPlans;
  const calendarEvents = shownPlans.map((plan) => ({
    key: futurePlanKey(plan),
    ymd: planYmd(plan.plan_date),
    label: futurePlanRestaurantName(plan),
    plan,
  }));
  const dayMarkers = buildEatingDayMarkersFromCalendar(eatingCalendarDays, scheduledPlans);

  const dinerStats = useMemo(
    () =>
      buildDinerStats({
        connections,
        followed,
        liked,
        eating,
        events,
        eventGroups,
      }),
    [connections, followed, liked, eating, events, eventGroups]
  );
  const topHighlights = useMemo(
    () => buildTopHighlights({ eating, liked, followed }),
    [eating, liked, followed]
  );
  const followedRestaurantRails = useMemo(
    () => buildFollowedRestaurantRails(followed),
    [followed]
  );
  const wantSuggestions = useMemo(() => {
    if (wants.length > 0) return [];
    return buildWantSuggestions(liked);
  }, [wants.length, liked]);
  const showFoodStoryCta = eating.length === 0 && wants.length === 0 && shownPlans.length === 0;

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

  async function onProfileMediaAdd(file) {
    setIdentityBusy(true);
    setIdentityError("");
    setIdentityNotice("");
    try {
      const data = await uploadConsumerProfileMedia(file);
      const item = data?.item;
      if (item) setProfileMedia((prev) => [...prev, item]);
      setIdentityNotice("Profile media added.");
    } catch (err) {
      setIdentityError(err.message || "Unable to upload profile media");
    } finally {
      setIdentityBusy(false);
    }
  }

  async function onProfileMediaRemove(item) {
    if (!item?.id) return;
    setIdentityBusy(true);
    setIdentityError("");
    setIdentityNotice("");
    try {
      await deleteConsumerProfileMedia(item.id);
      setProfileMedia((prev) => prev.filter((row) => Number(row.id) !== Number(item.id)));
      setIdentityNotice("Profile media removed.");
    } catch (err) {
      setIdentityError(err.message || "Unable to remove profile media");
    } finally {
      setIdentityBusy(false);
    }
  }

  async function postEating({ text, file, mealPeriod, homemade, restaurant, dish }) {
    setPostBusy("eating");
    setError("");
    try {
      if (compareYmd(hubDate) > 0) return;
      let photo_url;
      let video_url;
      if (file) {
        const up = await uploadWhatIAteTodayPhoto(file);
        ({ photo_url, video_url } = eatingMediaFromUpload(up));
      }
      const restaurantId = homemade ? null : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
      const menuItemId = homemade ? null : dish?.menu_item_id || undefined;
      const data = await createWhatIAteToday({
        food_name: eatingFoodName({ text, dish, restaurant, homemade }),
        photo_url,
        video_url,
        eaten_on: hubDate,
        meal_period: mealPeriod || defaultWhatIAteMealPeriod(),
        restaurant_id: restaurantId,
        menu_item_id: menuItemId,
        comment: homemade ? joinHomemadeComment(true, text) : undefined,
      });
      if (restaurantId) await maybeFollowRestaurant(restaurantId);
      const entry = data.entry || data;
      if (!entry?.id) {
        throw new Error("Saved but response was incomplete — refresh and try again");
      }
      const hubItem = mapDiaryEntriesForHub([
        {
          ...entry,
          eaten_on: planYmd(entry.eaten_on) || hubDate,
          food_name: entry.food_name || text || "Food",
          photo_url: entry.photo_url || photo_url || null,
          video_url: entry.video_url || video_url || null,
        },
      ])[0];
      setEating((prev) => {
        const rest = (prev || []).filter((row) => Number(row.entry_id) !== Number(entry.id));
        return [hubItem, ...rest];
      });
      setLastPost({
        kind: "diary",
        id: entry.id,
        food_name: hubItem.food_name,
        meal_period: hubItem.meal_period,
        comment: hubItem.comment,
        eaten_on: hubItem.eaten_on,
        photo_url: hubItem.photo_url,
        video_url: hubItem.video_url,
      });
      window.setTimeout(() => {
        eatingSectionRef.current
          ?.querySelector('[data-testid="post-after-actions"]')
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
      await load();
      setEating((prev) => {
        if ((prev || []).some((row) => Number(row.entry_id) === Number(entry.id))) return prev;
        return [hubItem, ...(prev || [])];
      });
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  async function postPlan(payload) {
    setPostBusy("eating");
    setError("");
    try {
      const data = await createWhatWeDoingSession({
        plan_date: payload.planDate,
        restaurant_id: payload.homemade ? null : payload.restaurantId,
        place_label: payload.placeLabel,
        joinable: payload.joinable,
        join_capacity: payload.joinCapacity,
        join_audience: payload.joinAudience,
        join_allowed_user_ids: payload.joinAllowedUserIds,
      });
      if (!payload.homemade && payload.restaurantId) {
        await maybeFollowRestaurant(payload.restaurantId);
      }
      setPlanPrefill(null);
      const session = data.session || data;
      setLastPost({ kind: "plan", token: session.token, id: session.id });
      setSchedulingPlans(false);
      setSelectedPlanKey(futurePlanKey(session));
      await load();
    } catch (err) {
      setError(err.message || "Unable to add plan");
    } finally {
      setPostBusy("");
    }
  }

  async function onEatingPhotoPick(item, file) {
    setPostBusy("eating");
    setError("");
    try {
      const up = await uploadWhatIAteTodayPhoto(file);
      const { photo_url, video_url } = eatingMediaFromUpload(up);
      if (item?.kind === "what_i_ate" && item.entry_id) {
        await updateWhatIAteToday(item.entry_id, { photo_url, video_url });
      } else {
        await createWhatIAteToday({
          food_name: item?.food_name || "Food",
          photo_url,
          video_url,
          eaten_on: hubDate,
          meal_period: item?.meal_period || defaultWhatIAteMealPeriod(),
        });
      }
      await load();
    } catch (err) {
      setError(err.message || "Unable to add photo");
    } finally {
      setPostBusy("");
    }
  }

  async function postWant({ text, file, homemade, restaurant, dish }) {
    setPostBusy("want");
    setError("");
    setWantListError("");
    try {
      let photo_url;
      if (file) {
        const up = await uploadWantToEatPhoto(file);
        photo_url = up.photo_url || undefined;
      }
      const name = eatingFoodName({ text, dish, restaurant, homemade });
      if (!name) {
        setError("Enter what you want to eat");
        return;
      }
      const restaurantId = homemade ? null : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
      const menuItemId = homemade ? null : dish?.menu_item_id || undefined;
      const data = await createWantToEat({
        food_name: name,
        photo_url,
        restaurant_id: restaurantId,
        menu_item_id: menuItemId,
        comment: homemade ? joinHomemadeComment(true, text) : undefined,
      });
      if (restaurantId) await maybeFollowRestaurant(restaurantId);
      const item = data?.item;
      if (!item?.id) {
        throw new Error("Saved but response was incomplete — refresh and try again");
      }
      setWants((prev) => [item, ...prev.filter((row) => Number(row.id) !== Number(item.id))]);
      setLastPost({
        kind: "want",
        id: item.id,
        food_name: item.food_name,
        comment: item.comment,
        meal_period: item.meal_period,
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurant_name,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name || item.food_name,
      });
      window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
      listWantToEat()
        .then((fresh) => {
          const items = fresh?.items || [];
          if (items.length > 0) {
            setWants(items);
            setWantListError("");
          }
        })
        .catch((err) => {
          setWantListError(err?.message || "Unable to refresh want list");
        });
    } catch (err) {
      setError(err.message || "Unable to add");
    } finally {
      setPostBusy("");
    }
  }

  async function postCrew({ name, purpose }) {
    setPostBusy("crews");
    setError("");
    try {
      await createDiningCrew({
        name,
        description: purpose || null,
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

  async function handleEatingCompose({ category, text, file, mealPeriod, homemade, restaurant, dish }) {
    if (category === "want") {
      await postWant({ text, file, homemade, restaurant, dish });
      setComposeDefaultCategory("want");
      return;
    }
    if (category === "ate") {
      await postEating({ text, file, mealPeriod, homemade, restaurant, dish });
      setComposeDefaultCategory("ate");
    }
  }

  function handlePlanSchedule(payload = {}) {
    setPlanPrefill({
      text: payload.text || "",
      homemade: Boolean(payload.homemade),
      restaurant: payload.restaurant || null,
      dish: payload.dish || null,
    });
    setSchedulingPlans(true);
    setCalendarOpen(true);
  }

  async function handlePostTagged(updated) {
    if (lastPost?.kind === "want" && updated?.id) {
      setWants((prev) => {
        const rest = prev.filter((row) => Number(row.id) !== Number(updated.id));
        return [updated, ...rest];
      });
    }
    setLastPost(null);
    await load();
  }

  return (
    <>
      <StickyPageHeader title="My Menuply" />
      <div style={s.page} data-testid="my-menuply-page">
        <div style={s.pageHeroBand}>
          <p style={s.kicker}>My food. My people. My plans.</p>
          <h1 style={s.h1}>My Menuply</h1>
          <p style={s.lead}>Your personal food home — diary, wishes, and plans.</p>
        </div>
        {error ? <p style={{ ...s.error, marginTop: 16 }}>{error}</p> : null}

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
            {profile?.profile_completion?.needs_primary_location ? (
              <ProfileCompletionBanner message="Add your primary location so friends and nearby diners can find you when you choose." />
            ) : null}
            <DinerIdentityHero
              displayName={displayName}
              avatarUrl={avatarUrl}
              about={profile?.diner_about || ""}
              locationLabel={profile?.primary_location?.public_label || null}
              connections={connections}
              viewerUserId={consumer?.id}
              busy={identityBusy}
              notice={identityNotice}
              error={identityError}
              onAvatarFile={onAvatarFile}
              onAboutSave={onAboutSave}
              profileMedia={profileMedia}
              onProfileMediaAdd={onProfileMediaAdd}
              onProfileMediaRemove={onProfileMediaRemove}
            />

            <MyMenuplyPresentationRails
              stats={dinerStats}
              hubFocus={hubFocus}
              onHubFocusChange={setHubFocus}
              highlights={topHighlights}
              followedRestaurants={followedRestaurantRails}
              wantSuggestions={wantSuggestions}
              connections={connections}
              followed={followed}
              liked={liked}
              eating={eating}
              events={events}
              eventGroups={eventGroups}
              viewerUserId={consumer?.id}
              showFoodStoryCta={showFoodStoryCta}
              onLogFood={() => {
                setComposeDefaultCategory("ate");
                setComposeOpen(true);
              }}
            />

            <EatingHubSection
              sectionRef={eatingSectionRef}
              composeOpen={composeOpen}
              onComposeOpenChange={setComposeOpen}
              composeDefaultCategory={composeDefaultCategory}
              hubDate={hubDate}
              onHubDateChange={setHubDate}
              hubMonth={hubMonth}
              onHubMonthChange={setHubMonth}
              calendarOpen={calendarOpen}
              onCalendarOpenChange={setCalendarOpen}
              dayMarkers={dayMarkers}
              calendarEvents={calendarEvents}
              eating={eating}
              scheduledPlans={scheduledPlans}
              shownPlans={shownPlans}
              selectedPlanKey={selectedPlanKey}
              onSelectedPlanKeyChange={setSelectedPlanKey}
              schedulingPlans={schedulingPlans}
              onSchedulingPlansChange={setSchedulingPlans}
              wants={wants}
              wantListError={wantListError}
              liked={liked}
              lastPost={lastPost}
              postBusy={postBusy}
              followed={followed}
              joinCandidates={joinCandidates}
              planPrefill={planPrefill}
              onComposeSubmit={handleEatingCompose}
              onPlanSchedule={handlePlanSchedule}
              onPostPlan={postPlan}
              onEatingPhotoPick={onEatingPhotoPick}
              onWantSelect={(want) =>
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
              onDiarySelect={(item) => {
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
              onPlanAddDetails={(next) => {
                setSelectedPlanKey(futurePlanKey(next));
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
              onPostTagged={handlePostTagged}
              onSkipDetails={() => setLastPost(null)}
              foodHref={foodHref}
            />

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="My Crews" to="/account/dining-crews" />
              {crews.length === 0 ? (
                <p style={s.muted}>Nothing yet.</p>
              ) : (
                crews.slice(0, 4).map((crew) => (
                  <DiningCrewHubCard
                    key={crew.id}
                    crew={crew}
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
              <CrewQuickCompose
                testId="compose-crew"
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
