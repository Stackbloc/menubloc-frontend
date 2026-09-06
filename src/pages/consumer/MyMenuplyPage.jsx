/**
 * My Menuply — the diner's personal food home.
 * About Me (with Connections), what she's eating, her plans, wants, crews, events.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FeedGuestProfileLanding from "../../components/consumer/feed/FeedGuestProfileLanding.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createDiningCrew,
  deleteDiningCrew,
  deleteDinerSocialEvent,
  deleteWhatWeDoingSession,
  createWhatIAteToday,
  createWhatWeDoingSession,
  createWantToEat,
  deleteWantToEat,
  deleteWhatIAteToday,
  deleteMyFoodActivity,
  followRestaurant,
  unfollowRestaurant,
  getConsumerProfile,
  getFollowedRestaurants,
  getLikedMenuItems,
  unlikeMenuItem,
  inviteToDiningCrew,
  inviteToVenueEventGroup,
  listConnections,
  listConsumerProfileMedia,
  listDiningCrews,
  listMyFoodActivity,
  listMyVenueEventGroups,
  listMyVenueEvents,
  listDinerSocialEvents,
  createDinerSocialEvent,
  ensureDinerSocialEventShareLink,
  listPendingEatInvitePeople,
  listWantToEat,
  listMyDiningIntents,
  removeRestaurantDiningIntent,
  listWhatIAteToday,
  listWhatIAteTodayCalendar,
  listWhatWeDoingSessions,
  resolveConsumerMediaUrl,
  uploadWantToEatPhoto,
  updateConsumerProfile,
  uploadDinerAvatar,
  uploadConsumerProfileMedia,
  deleteConsumerProfileMedia,
  getPublicFlashVideos,
  uploadProfileMedia,
  deleteProfileMedia,
  uploadWhatIAteTodayPhoto,
  uploadEatingPlanMedia,
  updateWhatIAteToday,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { eatingMediaFromUpload } from "../../lib/eatingMediaUtils.js";
import { pruneMenuplyLiveFeedItem } from "../../lib/menuplyLiveFeedControl.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import {
  buildDiningCrewInviteShareData,
  buildMenuplyPathShareData,
  buildSocialEventJoinShareData,
} from "../../lib/diningCrewInviteShare.js";
import EatingHubSection, { PlansCalendarGlyph } from "./myMenuply/EatingHubSection.jsx";
import CrewQuickCompose from "./myMenuply/CrewQuickCompose.jsx";
import EventComposeSheet from "./myMenuply/EventComposeSheet.jsx";
import PlanVideoAttachSheet from "./myMenuply/PlanVideoAttachSheet.jsx";
import InvitePickerSheet from "./myMenuply/InvitePickerSheet.jsx";
import CrewInvitePeopleSheet from "./myMenuply/CrewInvitePeopleSheet.jsx";
import SectionEmptyState from "./myMenuply/SectionEmptyState.jsx";
import { buildJoinMeCandidates } from "./myMenuply/joinMeCandidates.js";
import RequestMmtSheet from "./myMenuply/RequestMmtSheet.jsx";
import MmtDetailSheet from "./myMenuply/MmtDetailSheet.jsx";
import {
  buildEatingDayMarkersFromCalendar,
  compareYmd,
  eatingHistoryStart,
  planYmd,
  venueEventYmd,
} from "./myMenuply/eatingHubUtils.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import ProfileCompletionBanner from "../../components/consumer/ProfileCompletionBanner.jsx";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import MyMenuplyPresentationRails from "./myMenuply/MyMenuplyPresentationRails.jsx";
import ProfileGalleryComposeSheet from "./myMenuply/ProfileGalleryComposeSheet.jsx";
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
import {
  MY_MENUPLY_MONTH_IN_FOOD_PATH,
  MY_MENUPLY_PROFILE_PATH,
} from "../../lib/myMenuplyRoutes.js";
import { futurePlanKey, futurePlanRestaurantName, futurePlanDetailParts } from "./myMenuply/dinerHubFormat.js";
import { dishPhotoUrl, eatingFoodName, joinHomemadeComment } from "./myMenuply/eatingPlaceLink.js";
import { mergeEatingFeedForHub, mapDiaryEntriesForHub, mapFoodActivityForHub, eatingFeedKey } from "../../lib/eatingFeedMerge.js";
import {
  createHomemadeDish,
  deleteHomemadeDish,
  fetchUserHomemadeDishes,
  uploadHomemadeDishPhoto,
} from "../../lib/homemadeDishApi.js";
import HomeAtHomeSection from "./myMenuply/HomeAtHomeSection.jsx";

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

const COMPOSE_LOGIN_ACTIONS = new Set([
  "ate",
  "want",
  "plan",
  "crew",
  "event",
  "profile-gallery",
  "invite-crew",
  "invite-event",
]);

function MyMenuplyAccountSettingsLink({ style }) {
  return (
    <Link
      to="/account"
      data-testid="my-menuply-account-settings"
      aria-label="Account settings"
      title="Settings"
      style={style}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1.01 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export default function MyMenuplyPage() {
  const { isAuthenticated, loading: authLoading, consumer } = useConsumer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const eatingSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [eduConsumer, setEduConsumer] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityNotice, setIdentityNotice] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [profileMedia, setProfileMedia] = useState([]);
  const [flashVideos, setFlashVideos] = useState([]);
  const [flashBusy, setFlashBusy] = useState(false);
  const [flashError, setFlashError] = useState("");
  const [postBusy, setPostBusy] = useState("");
  const [eating, setEating] = useState([]);
  const [eatingCalendarDays, setEatingCalendarDays] = useState([]);
  const [plans, setPlans] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [wants, setWants] = useState([]);
  const [diningIntents, setDiningIntents] = useState([]);
  const [wantListError, setWantListError] = useState("");
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);
  const [socialEvents, setSocialEvents] = useState([]);
  const [homeDishes, setHomeDishes] = useState([]);
  const [homeDishBusy, setHomeDishBusy] = useState(false);
  const [homeDishError, setHomeDishError] = useState("");
  const [hubDate, setHubDate] = useState(() => whatIAteTodayLocalDate());
  const [hubMonth, setHubMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [lastPost, setLastPost] = useState(null);
  const [wantDiscovery, setWantDiscovery] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("Eating");
  const [schedulingPlans, setSchedulingPlans] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [joinCandidates, setJoinCandidates] = useState([]);
  const [requestMmtOpen, setRequestMmtOpen] = useState(false);
  const [mmtDetailId, setMmtDetailId] = useState(null);
  const [inviteMeOutOpen, setInviteMeOutOpen] = useState(false);
  const [inviteMeOutAudience, setInviteMeOutAudience] = useState("connections");
  const [inviteMeOutSelectedIds, setInviteMeOutSelectedIds] = useState([]);
  const [inviteMeOutToggleBusy, setInviteMeOutToggleBusy] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDefaultCategory, setComposeDefaultCategory] = useState("ate");
  const [composeMediaSource, setComposeMediaSource] = useState("camera");
  const [profileGalleryPickerOpen, setProfileGalleryPickerOpen] = useState(false);
  const [profileGalleryMediaSource, setProfileGalleryMediaSource] = useState(null);
  const [crewComposeOpen, setCrewComposeOpen] = useState(false);
  const [eventComposeOpen, setEventComposeOpen] = useState(false);
  const [inviteCrewPickerOpen, setInviteCrewPickerOpen] = useState(false);
  const [inviteEventPickerOpen, setInviteEventPickerOpen] = useState(false);
  const [crewInvitePeopleOpen, setCrewInvitePeopleOpen] = useState(false);
  const [crewInviteTarget, setCrewInviteTarget] = useState(null);
  const [hubFocus, setHubFocus] = useState("");
  const [planPrefill, setPlanPrefill] = useState(null);
  const [planVideoPlan, setPlanVideoPlan] = useState(null);
  const locationCity = profile?.primary_location?.city_name || null;
  const locationState = profile?.primary_location?.state_code || null;

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
        diningIntentRes,
        crewRes,
        eventRes,
        groupRes,
        socialEventRes,
        mediaRes,
        homeRes,
        flashRes,
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
        listMyDiningIntents().catch(() => ({ items: [] })),
        listDiningCrews().catch(() => ({ crews: [] })),
        listMyVenueEvents().catch(() => ({ events: [] })),
        listMyVenueEventGroups().catch(() => ({ groups: [] })),
        listDinerSocialEvents().catch(() => ({ events: [] })),
        listConsumerProfileMedia().catch(() => ({ items: [] })),
        consumer?.id
          ? fetchUserHomemadeDishes(consumer.id).catch(() => ({ dishes: [] }))
          : Promise.resolve({ dishes: [] }),
        consumer?.id
          ? getPublicFlashVideos(consumer.id).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);
      const nextProfile = profileRes?.profile || null;
      setProfile(nextProfile);
      setEduConsumer(profileRes?.consumer || null);
      const inviteAudience = String(nextProfile?.invite_me_out_audience || "none").toLowerCase();
      setInviteMeOutOpen(inviteAudience !== "none");
      setInviteMeOutAudience(inviteAudience === "selected" ? "selected" : "connections");
      setInviteMeOutSelectedIds(
        Array.isArray(nextProfile?.invite_me_out_allowed_user_ids)
          ? nextProfile.invite_me_out_allowed_user_ids
          : []
      );
      setAvatarUrl(resolveConsumerMediaUrl(nextProfile?.avatar_url || ""));
      setProfileMedia(
        (mediaRes?.items || []).filter((row) => String(row?.media_subtype || "") !== "flash_video")
      );
      setFlashVideos(flashRes?.items || []);
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
      setDiningIntents(diningIntentRes.items || []);
      if ((wantRes.items || []).length > 0) setWantListError("");
      setCrews(crewRes.crews || crewRes.items || []);
      setEvents(eventRes.events || []);
      setEventGroups(groupRes.groups || []);
      setSocialEvents(socialEventRes.events || []);
      setHomeDishes(homeRes?.dishes || []);
    } catch (err) {
      setError(err.message || "Unable to load My Menuply");
    } finally {
      setLoading(false);
    }
  }, [hubDate, consumer?.id]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    if (authLoading) return;
    const compose = String(searchParams.get("compose") || "").trim().toLowerCase();
    if (!compose || !COMPOSE_LOGIN_ACTIONS.has(compose)) return;
    if (isAuthenticated) return;
    const media = String(searchParams.get("media") || "").trim().toLowerCase();
    const next = new URLSearchParams();
    next.set("compose", compose);
    if (media) next.set("media", media);
    navigate(`/account/login?next=${encodeURIComponent(`${MY_MENUPLY_PROFILE_PATH}?${next.toString()}`)}`, {
      replace: true,
    });
  }, [authLoading, isAuthenticated, searchParams, navigate]);

  useEffect(() => {
    if (loading || !isAuthenticated) return undefined;
    const compose = String(searchParams.get("compose") || "").trim().toLowerCase();
    const focus = String(searchParams.get("focus") || "").trim().toLowerCase();
    const media = String(searchParams.get("media") || "").trim().toLowerCase();

    function clearComposeParams() {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!next.has("compose") && !next.has("media")) return prev;
          next.delete("compose");
          next.delete("media");
          return next;
        },
        { replace: true }
      );
    }

    if (compose === "profile-gallery") {
      setProfileGalleryMediaSource(media === "library" ? "library" : media === "camera" ? "camera" : null);
      setProfileGalleryPickerOpen(true);
      clearComposeParams();
      const timer = window.setTimeout(() => {
        document
          .querySelector('[data-testid="about-me"]')
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    if (["ate", "want", "plan", "crew", "event"].includes(compose)) {
      if (compose === "crew") {
        setCrewComposeOpen(true);
        clearComposeParams();
        const timer = window.setTimeout(() => {
          eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
        return () => window.clearTimeout(timer);
      }
      if (compose === "event") {
        setEventComposeOpen(true);
        clearComposeParams();
        const timer = window.setTimeout(() => {
          document
            .querySelector('[data-testid="my-events"]')
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
        return () => window.clearTimeout(timer);
      }
      setComposeDefaultCategory(compose);
      setComposeMediaSource(media === "library" ? "library" : "camera");
      if (compose === "plan") {
        setSchedulingPlans(true);
        setCalendarOpen(true);
      } else {
        setComposeOpen(true);
      }
      clearComposeParams();
      const timer = window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    if (compose === "invite-crew") {
      setInviteCrewPickerOpen(true);
      clearComposeParams();
      const timer = window.setTimeout(() => {
        document
          .querySelector('[data-testid="dining-crews"]')
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    if (compose === "invite-event") {
      setInviteEventPickerOpen(true);
      clearComposeParams();
      const timer = window.setTimeout(() => {
        document
          .querySelector('[data-testid="my-events"]')
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    if (focus === "home") {
      setHubFocus("dishes");
    } else if (["connects", "restaurants", "dishes", "events"].includes(focus)) {
      setHubFocus(focus);
    }
    if (focus === "want") {
      setComposeDefaultCategory("want");
      setComposeMediaSource("camera");
      setComposeOpen(true);
      const timer = window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    const mmt = String(searchParams.get("mmt") || "").trim();
    if (mmt && /^\d+$/.test(mmt)) {
      setMmtDetailId(Number(mmt));
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!next.has("mmt")) return prev;
          next.delete("mmt");
          return next;
        },
        { replace: true }
      );
      const timer = window.setTimeout(() => {
        eatingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, loading, isAuthenticated, setSearchParams]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "You";
  const scheduledPlans = plans.filter(
    (plan) => compareYmd(plan.plan_date) >= 0 && isScheduledEatingPlan(plan)
  );
  // Future plans are not date-capped — show all scheduled sessions.
  const shownPlans = scheduledPlans;
  const planCalendarEvents = shownPlans.map((plan) => {
    const { meal } = futurePlanDetailParts(plan);
    return {
      key: futurePlanKey(plan),
      ymd: planYmd(plan.plan_date),
      label: futurePlanRestaurantName(plan),
      timeLabel: meal || null,
      kind: "plan",
      plan,
    };
  });
  const venueCalendarEvents = (events || [])
    .map((ev) => {
      const ymd = venueEventYmd(ev);
      if (!ymd || !ev?.slug) return null;
      const timeLabel =
        String(ev.start_time_label || ev.starts_at_label || ev.time_label || "").trim() || null;
      return {
        key: `venue-event-${ev.id || ev.slug}`,
        ymd,
        label: ev.name || "Event",
        timeLabel,
        kind: "venue_event",
        href: `/events/${encodeURIComponent(String(ev.slug))}`,
        event: ev,
      };
    })
    .filter(Boolean);
  const socialCalendarEvents = (socialEvents || [])
    .map((ev) => {
      const ymd = planYmd(ev.event_date);
      if (!ymd) return null;
      return {
        key: `social-event-${ev.id}`,
        ymd,
        label: ev.title || "Event",
        timeLabel: ev.start_time || null,
        kind: "diner_social",
        event: ev,
      };
    })
    .filter(Boolean);
  const calendarEvents = [...planCalendarEvents, ...venueCalendarEvents, ...socialCalendarEvents];
  const dayMarkers = buildEatingDayMarkersFromCalendar(
    eatingCalendarDays,
    scheduledPlans,
    [...(events || []), ...(socialEvents || [])]
  );

  function openEventsCalendar() {
    setCalendarTitle("My Events");
    setCalendarOpen(true);
  }

  const dinerStats = useMemo(
    () =>
      buildDinerStats({
        connections,
        followed,
        liked,
        eating,
        homeDishes,
        events,
        eventGroups,
        socialEvents,
      }),
    [connections, followed, liked, eating, homeDishes, events, eventGroups, socialEvents]
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
  const showFoodStoryCta = false;

  async function onAvatarFile(file) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setIdentityBusy(true);
    setIdentityError("");
    setIdentityNotice("");
    try {
      const data = await uploadDinerAvatar(file);
      setAvatarUrl(resolveConsumerMediaUrl(data.avatar_url || data.card?.avatar_url || ""));
      setIdentityNotice("Profile photo updated.");
    } catch (err) {
      setAvatarUrl(resolveConsumerMediaUrl(profile?.avatar_url || ""));
      setIdentityError(err.message || "Unable to upload photo");
    } finally {
      URL.revokeObjectURL(previewUrl);
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

  async function onSaveProfileSettings(next) {
    setIdentityError("");
    setIdentityNotice("");
    try {
      const data = await updateConsumerProfile({
        diner_education_status: next.diner_education_status || null,
        diner_field_of_study: next.diner_field_of_study || null,
        diner_occupation: next.diner_occupation || null,
        diner_hometown: next.diner_hometown || null,
        diner_hobbies: next.diner_hobbies || null,
        diner_sex: next.diner_sex || null,
        date_of_birth: next.date_of_birth || null,
        favorite_foods: Array.isArray(next.favorite_foods) ? next.favorite_foods : [],
      });
      const saved = data?.profile || {};
      setProfile((prev) => ({
        ...(prev || {}),
        diner_education_status: saved.diner_education_status ?? next.diner_education_status ?? null,
        diner_field_of_study: saved.diner_field_of_study ?? next.diner_field_of_study ?? null,
        diner_occupation: saved.diner_occupation ?? next.diner_occupation ?? null,
        diner_hometown: saved.diner_hometown ?? next.diner_hometown ?? null,
        diner_hobbies: saved.diner_hobbies ?? next.diner_hobbies ?? null,
        diner_sex: saved.diner_sex ?? next.diner_sex ?? null,
        date_of_birth: saved.date_of_birth
          ? String(saved.date_of_birth).slice(0, 10)
          : next.date_of_birth || null,
        favorite_foods: Array.isArray(saved.favorite_foods)
          ? saved.favorite_foods
          : next.favorite_foods,
      }));
      if (data?.consumer) setEduConsumer(data.consumer);
      setIdentityNotice("Profile details saved.");
    } catch (err) {
      setIdentityError(err.message || "Unable to save profile details");
      throw err;
    }
  }

  async function onProfileMediaAdd(file) {
    setProfileGalleryPickerOpen(false);
    setProfileGalleryMediaSource(null);
    if (!file) return;
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

  async function onFlashVideoAdd(file) {
    if (!file) return;
    setFlashBusy(true);
    setFlashError("");
    setIdentityNotice("");
    try {
      const data = await uploadProfileMedia(file, { media_subtype: "flash_video" });
      const item = data?.item;
      if (item) setFlashVideos((prev) => [...prev, item]);
      setIdentityNotice("Flash Video added.");
    } catch (err) {
      setFlashError(err.message || "Unable to upload Flash Video");
    } finally {
      setFlashBusy(false);
    }
  }

  async function onFlashVideoRemove(item) {
    if (!item?.id) return;
    setFlashBusy(true);
    setFlashError("");
    setIdentityNotice("");
    try {
      await deleteProfileMedia(item.id);
      setFlashVideos((prev) => prev.filter((row) => Number(row.id) !== Number(item.id)));
      setIdentityNotice("Flash Video removed.");
    } catch (err) {
      setFlashError(err.message || "Unable to remove Flash Video");
    } finally {
      setFlashBusy(false);
    }
  }

  async function onHomeAtHomePhoto(file) {
    if (!file) return;
    setHomeDishBusy(true);
    setHomeDishError("");
    try {
      const up = await uploadHomemadeDishPhoto(file);
      const photo_url = up?.photo_url || up?.url;
      if (!photo_url) throw new Error("Photo upload did not return a URL");
      const created = await createHomemadeDish({
        name: "Home-cooked meal",
        photo_url,
        visibility: "public",
      });
      const row = created?.dish || created;
      if (row?.id || row?.homemade_dish_id) {
        setHomeDishes((prev) => [row, ...(prev || [])]);
      }
    } catch (err) {
      setHomeDishError(err.message || "Unable to add @home photo");
    } finally {
      setHomeDishBusy(false);
    }
  }

  async function onHomeAtHomeDelete(dish) {
    const id = dish?.id || dish?.homemade_dish_id;
    if (!id) return;
    setHomeDishBusy(true);
    setHomeDishError("");
    try {
      await deleteHomemadeDish(id);
      setHomeDishes((prev) =>
        (prev || []).filter((row) => Number(row.id || row.homemade_dish_id) !== Number(id))
      );
    } catch (err) {
      setHomeDishError(err.message || "Unable to delete @home photo");
    } finally {
      setHomeDishBusy(false);
    }
  }

  async function postEating({
    text,
    file,
    mealPeriod,
    homemade,
    restaurant,
    dish,
    isRecommend = false,
    ateKind = null,
    foodInterestKey = null,
  }) {
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
      const signal = String(ateKind || "").trim() || null;
      const restaurantId =
        signal === "cuisine" || signal === "food_item" || homemade
          ? null
          : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
      const menuItemId =
        signal === "cuisine" || signal === "food_item" || homemade
          ? null
          : dish?.menu_item_id || undefined;
      const note = String(text || "").trim();
      let foodName = note;
      if (signal === "restaurant") {
        foodName = String(restaurant?.restaurant_name || note || "").trim();
      } else if (signal === "menu_item") {
        foodName = String(dish?.item_name || note || "").trim();
      } else if (!signal) {
        foodName = homemade
          ? note || "Homemade"
          : String(dish?.item_name || "").trim() ||
            String(restaurant?.restaurant_name || "").trim() ||
            note ||
            "Food";
      }
      if (!foodName) {
        setError("Enter what you're eating");
        return;
      }
      const data = await createWhatIAteToday({
        food_name: foodName,
        photo_url,
        video_url,
        eaten_on: hubDate,
        meal_period: mealPeriod || defaultWhatIAteMealPeriod(),
        restaurant_id: restaurantId,
        menu_item_id: menuItemId,
        is_recommend: Boolean(video_url && isRecommend),
        comment:
          signal === "cuisine" || signal === "food_item" || homemade
            ? joinHomemadeComment(true, note)
            : note || undefined,
        signal_kind: signal || undefined,
        food_interest_key: foodInterestKey || undefined,
      });
      if (restaurantId) await maybeFollowRestaurant(restaurantId);
      const entry = data.entry || data;
      if (!entry?.id) {
        throw new Error("Saved but response was incomplete — refresh and try again");
      }
      if (data?.discovery) {
        setWantDiscovery(data.discovery);
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
        food_interest_key: entry.food_interest_key || foodInterestKey || null,
        signal_kind: entry.signal_kind || signal || null,
      });
      window.setTimeout(() => {
        eatingSectionRef.current
          ?.querySelector('[data-testid="want-discovery-panel"], [data-testid="post-after-actions"]')
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
      let photo_url = null;
      let video_url = null;
      const file = planPrefill?.file || payload?.file || null;
      if (file) {
        const up = await uploadEatingPlanMedia(file);
        ({ photo_url, video_url } = eatingMediaFromUpload(up));
      }
      const data = await createWhatWeDoingSession({
        plan_date: payload.planDate,
        restaurant_id: payload.homemade ? null : payload.restaurantId,
        place_label: payload.placeLabel,
        joinable: payload.joinable,
        join_capacity: payload.joinCapacity,
        join_audience: payload.joinAudience,
        join_allowed_user_ids: payload.joinAllowedUserIds,
        photo_url,
        video_url,
        market_discoverable: Boolean(video_url),
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

  async function onDiaryDelete(item) {
    const entryId = item?.entry_id != null ? Number(item.entry_id) : null;
    const activityRaw =
      item?.source_id ??
      item?.activity_id ??
      (typeof item?.id === "string" && /^fa[-:]?\d+$/i.test(item.id)
        ? item.id.replace(/^fa[-:]?/i, "")
        : null);
    const activityId = activityRaw != null && activityRaw !== "" ? Number(activityRaw) : null;

    if (item?.kind === "what_i_ate" && entryId != null) {
      setPostBusy("eating-delete");
      setError("");
      try {
        await deleteWhatIAteToday(entryId);
        pruneMenuplyLiveFeedItem(`ate:${entryId}`);
        setEating((prev) =>
          (prev || []).filter((row) => {
            if (Number(row.entry_id) === entryId) return false;
            if (activityId != null && Number(row.source_id || row.activity_id) === activityId) {
              return false;
            }
            const key = eatingFeedKey(item);
            return eatingFeedKey(row) !== key;
          })
        );
        setLastPost((prev) =>
          prev?.kind === "diary" && Number(prev.id) === entryId ? null : prev
        );
        await load();
      } catch (err) {
        setError(err.message || "Unable to delete");
      } finally {
        setPostBusy("");
      }
      return;
    }

    if ((item?.kind === "im_eating" || item?.kind === "what_i_ate") && activityId != null) {
      setPostBusy("eating-delete");
      setError("");
      try {
        await deleteMyFoodActivity(activityId);
        setEating((prev) =>
          (prev || []).filter((row) => {
            if (Number(row.source_id || row.activity_id) === activityId) return false;
            const rid = String(row.id || "");
            if (rid === `fa-${activityId}` || rid === `fa:${activityId}`) return false;
            return true;
          })
        );
        await load();
      } catch (err) {
        setError(err.message || "Unable to delete");
      } finally {
        setPostBusy("");
      }
    }
  }

  async function onWantDelete(want) {
    if (want?.id == null) return;
    setPostBusy("want-delete");
    setError("");
    setWantListError("");
    try {
      await deleteWantToEat(want.id);
      pruneMenuplyLiveFeedItem(`want:${want.id}`);
      setWants((prev) => (prev || []).filter((row) => Number(row.id) !== Number(want.id)));
      setLastPost((prev) =>
        prev?.kind === "want" && Number(prev.id) === Number(want.id) ? null : prev
      );
    } catch (err) {
      setError(err.message || "Unable to delete");
      setWantListError(err.message || "Unable to delete");
    } finally {
      setPostBusy("");
    }
  }

  async function onDiningIntentDelete(intent) {
    if (intent?.id == null) return;
    setPostBusy("dining-intent-delete");
    setError("");
    try {
      await removeRestaurantDiningIntent(intent.id);
      setDiningIntents((prev) =>
        (prev || []).filter((row) => Number(row.id) !== Number(intent.id))
      );
    } catch (err) {
      setError(err.message || "Unable to remove");
    } finally {
      setPostBusy("");
    }
  }

  async function onHighlightDelete(card) {
    if (!card?.deleteKind) return;
    if (card.deleteKind === "diary" && card.deleteItem) {
      await onDiaryDelete(card.deleteItem);
      return;
    }
    setPostBusy("highlight-delete");
    setError("");
    try {
      if (card.deleteKind === "like" && card.menu_item_id != null) {
        await unlikeMenuItem(card.menu_item_id);
        setLiked((prev) =>
          (prev || []).filter((row) => Number(row.menu_item_id) !== Number(card.menu_item_id))
        );
      } else if (card.deleteKind === "follow" && card.restaurant_id != null) {
        await unfollowRestaurant(card.restaurant_id);
        setFollowed((prev) =>
          (prev || []).filter((row) => Number(row.restaurant_id) !== Number(card.restaurant_id))
        );
      }
    } catch (err) {
      setError(err.message || "Unable to delete");
    } finally {
      setPostBusy("");
    }
  }

  async function onCrewDelete(crew) {
    if (crew?.id == null) return;
    setPostBusy(`crew-delete-${crew.id}`);
    setError("");
    try {
      await deleteDiningCrew(crew.id);
      setCrews((prev) => (prev || []).filter((row) => Number(row.id) !== Number(crew.id)));
    } catch (err) {
      setError(err.message || "Unable to delete group");
    } finally {
      setPostBusy("");
    }
  }

  async function onSocialEventDelete(ev) {
    if (ev?.id == null) return;
    setPostBusy(`social-event-delete-${ev.id}`);
    setError("");
    try {
      await deleteDinerSocialEvent(ev.id);
      setSocialEvents((prev) => (prev || []).filter((row) => Number(row.id) !== Number(ev.id)));
    } catch (err) {
      setError(err.message || "Unable to delete event");
    } finally {
      setPostBusy("");
    }
  }

  async function onPlanDelete(plan) {
    const key = plan?.token || plan?.id;
    if (key == null) return;
    if (plan?.is_creator === false) return;
    setPostBusy(`plan-delete-${key}`);
    setError("");
    try {
      await deleteWhatWeDoingSession(key);
      if (plan?.id != null) pruneMenuplyLiveFeedItem(`plan:${plan.id}`);
      setPlans((prev) =>
        (prev || []).filter((row) => String(row.token || row.id) !== String(key))
      );
      setSelectedPlanKey((prev) => (prev === futurePlanKey(plan) ? "" : prev));
      setLastPost((prev) =>
        prev?.kind === "plan" && String(prev.token || prev.id) === String(key) ? null : prev
      );
    } catch (err) {
      setError(err.message || "Unable to delete eating plan");
    } finally {
      setPostBusy("");
    }
  }

  async function refreshMmtData() {
    try {
      const wantRes = await listWantToEat().catch(() => ({ items: [] }));
      setWants(wantRes.items || []);
    } catch {
      /* keep existing wants */
    }
  }

  async function saveInviteMeOutSettings({ open, audience, selectedIds }) {
    setInviteMeOutToggleBusy(true);
    setError("");
    try {
      const nextAudience = open
        ? audience === "selected"
          ? "selected"
          : "connections"
        : "none";
      const profileData = await updateConsumerProfile({
        invite_me_out_audience: nextAudience,
        invite_me_out_allowed_user_ids:
          nextAudience === "selected" ? selectedIds || [] : [],
      });
      const next = profileData?.profile || {};
      setProfile((prev) => ({ ...(prev || {}), ...next }));
      const savedAudience = String(next.invite_me_out_audience || nextAudience).toLowerCase();
      setInviteMeOutOpen(savedAudience !== "none");
      setInviteMeOutAudience(savedAudience === "selected" ? "selected" : "connections");
      setInviteMeOutSelectedIds(
        Array.isArray(next.invite_me_out_allowed_user_ids)
          ? next.invite_me_out_allowed_user_ids
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to update Invite Me Out");
      throw err;
    } finally {
      setInviteMeOutToggleBusy(false);
    }
  }

  async function postWant({
    text,
    file,
    homemade,
    restaurant,
    dish,
    wantKind,
    foodInterestKey,
    inviteMeOutOpen: wantInviteOpen,
    inviteMeOutAudience: wantInviteAudience,
    inviteMeOutSelectedIds: wantInviteIds,
  }) {
    setPostBusy("want");
    setError("");
    setWantListError("");
    try {
      const open =
        wantInviteOpen === undefined ? inviteMeOutOpen : Boolean(wantInviteOpen);
      const audienceChoice =
        wantInviteAudience === undefined ? inviteMeOutAudience : wantInviteAudience;
      const selectedIds =
        wantInviteIds === undefined ? inviteMeOutSelectedIds : wantInviteIds;
      const audience = open
        ? audienceChoice === "selected"
          ? "selected"
          : "connections"
        : "none";
      const profileData = await updateConsumerProfile({
        invite_me_out_audience: audience,
        invite_me_out_allowed_user_ids: audience === "selected" ? selectedIds || [] : [],
      });
      const next = profileData?.profile || {};
      setProfile((prev) => ({ ...(prev || {}), ...next }));
      const savedAudience = String(next.invite_me_out_audience || audience).toLowerCase();
      setInviteMeOutOpen(savedAudience !== "none");
      setInviteMeOutAudience(savedAudience === "selected" ? "selected" : "connections");
      setInviteMeOutSelectedIds(
        Array.isArray(next.invite_me_out_allowed_user_ids) ? next.invite_me_out_allowed_user_ids : []
      );

      let photo_url;
      let video_url;
      if (file) {
        const up = await uploadWantToEatPhoto(file);
        ({ photo_url, video_url } = eatingMediaFromUpload(up));
      } else {
        const catalogPhoto = dishPhotoUrl(dish);
        if (catalogPhoto) photo_url = catalogPhoto;
      }
      const intent = String(wantKind || "").trim() || null;
      let name = "";
      let restaurantId;
      let menuItemId;
      if (intent === "cuisine" || intent === "food_item" || (!intent && homemade)) {
        name = String(text || "").trim();
        restaurantId = undefined;
        menuItemId = undefined;
      } else if (intent === "restaurant") {
        name = String(restaurant?.restaurant_name || text || "").trim();
        restaurantId = restaurant?.restaurant_id || undefined;
        menuItemId = undefined;
      } else {
        name = eatingFoodName({ text, dish, restaurant, homemade });
        restaurantId = homemade ? null : restaurant?.restaurant_id || dish?.restaurant_id || undefined;
        menuItemId = homemade ? null : dish?.menu_item_id || undefined;
      }
      if (!name) {
        setError("Enter what you want to eat");
        return;
      }
      const data = await createWantToEat({
        food_name: name,
        photo_url,
        video_url,
        market_discoverable: Boolean(video_url),
        restaurant_id: restaurantId,
        menu_item_id: menuItemId,
        intent_kind: intent || undefined,
        food_interest_key: foodInterestKey || undefined,
        comment: homemade ? joinHomemadeComment(true, text) : undefined,
      });
      if (restaurantId) await maybeFollowRestaurant(restaurantId);
      const item = data?.item;
      if (!item?.id) {
        throw new Error("Saved but response was incomplete — refresh and try again");
      }
      setWants((prev) => [item, ...prev.filter((row) => Number(row.id) !== Number(item.id))]);
      if (data?.discovery) {
        setWantDiscovery(data.discovery);
      }
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
      throw err;
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

  async function postSocialEvent({
    title,
    eventDate,
    startTime,
    locationLabel,
    description,
    joinMeOpen,
    file,
  }) {
    setPostBusy("events");
    setError("");
    try {
      let photo_url;
      let video_url;
      if (file) {
        const up = await uploadWhatIAteTodayPhoto(file);
        ({ photo_url, video_url } = eatingMediaFromUpload(up));
      }
      const data = await createDinerSocialEvent({
        title,
        event_date: eventDate,
        start_time: startTime,
        location_label: locationLabel,
        description,
        join_me_open: Boolean(joinMeOpen),
        photo_url,
        video_url,
      });
      const created = data?.event;
      if (created?.id) {
        setSocialEvents((prev) => [created, ...(prev || []).filter((row) => Number(row.id) !== Number(created.id))]);
      }
      await load();
    } catch (err) {
      const message = err.message || "Unable to create event";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
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
    setCrewInviteTarget(crew || null);
    setCrewInvitePeopleOpen(true);
  }

  async function createCrewInviteShareFromSheet({ inviteeUserId = null } = {}) {
    const crew = crewInviteTarget;
    if (!crew?.id) return;
    setPostBusy("invite");
    setError("");
    try {
      const body = inviteeUserId ? { invitee_user_id: inviteeUserId } : {};
      const data = await inviteToDiningCrew(crew.id, body);
      openShare(buildDiningCrewInviteShareData(data.invitation?.url || ""), {
        modalTitle: "Share crew invite",
        analyticsContext: { pageType: "dining_crew_invite", crewId: Number(crew.id) || null },
      });
      setCrewInvitePeopleOpen(false);
    } catch (err) {
      setError(err.message || "Invite failed");
    } finally {
      setPostBusy("");
    }
  }

  async function shareDinerSocialEventInvite(ev) {
    setPostBusy("invite");
    setError("");
    try {
      const data = await ensureDinerSocialEventShareLink(ev.id);
      const token =
        data?.invitation_token ||
        data?.event?.invitation_token ||
        ev.invitation_token;
      if (!token) throw new Error("Unable to create join link");
      openShare(
        buildSocialEventJoinShareData({
          title: ev.title,
          joinPath: `/join-event/${encodeURIComponent(String(token))}`,
        }),
        {
          modalTitle: "Share event Join Me",
          analyticsContext: {
            pageType: "diner_social_event_join",
            eventId: Number(ev.id) || null,
          },
        }
      );
    } catch (err) {
      setError(err.message || "Unable to share event");
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

  async function handleEatingCompose({
    category,
    text,
    file,
    mealPeriod,
    homemade,
    restaurant,
    dish,
    isRecommend,
    wantKind,
    foodInterestKey,
    ateKind,
    inviteMeOutOpen: wantInviteOpen,
    inviteMeOutAudience: wantInviteAudience,
    inviteMeOutSelectedIds: wantInviteIds,
  }) {
    if (category === "cooking") {
      const { postFeedCookingVideo } = await import("../../lib/feedVideoCompose.js");
      await postFeedCookingVideo({ text, file });
      setComposeDefaultCategory("cooking");
      if (consumer?.id) {
        const homeRes = await fetchUserHomemadeDishes(consumer.id).catch(() => ({ dishes: [] }));
        setHomeDishes(homeRes?.dishes || []);
      }
      return;
    }
    if (category === "want") {
      await postWant({
        text,
        file,
        homemade,
        restaurant,
        dish,
        wantKind,
        foodInterestKey,
        inviteMeOutOpen: wantInviteOpen,
        inviteMeOutAudience: wantInviteAudience,
        inviteMeOutSelectedIds: wantInviteIds,
      });
      setComposeDefaultCategory("want");
      return;
    }
    if (category === "ate") {
      await postEating({
        text,
        file,
        mealPeriod,
        homemade,
        restaurant,
        dish,
        isRecommend,
        ateKind,
        foodInterestKey,
      });
      setComposeDefaultCategory("ate");
    }
  }

  function handlePlanSchedule(payload = {}) {
    setPlanPrefill({
      text: payload.text || "",
      homemade: Boolean(payload.homemade),
      restaurant: payload.restaurant || null,
      dish: payload.dish || null,
      file: payload.file || null,
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

  if (!authLoading && !isAuthenticated) {
    return <FeedGuestProfileLanding />;
  }

  return (
    <>
      <div
        style={{
          ...s.page,
          paddingTop: 12,
          paddingBottom:
            "calc(var(--feed-primary-nav-h, 56px) + env(safe-area-inset-bottom, 0px) + 16px)",
        }}
        data-testid="my-menuply-page"
      >
        {isAuthenticated ? (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 8,
            }}
            data-testid="feed-profile-settings-row"
          >
            <MyMenuplyAccountSettingsLink style={s.settingsIconLink} />
          </div>
        ) : null}
        {error ? <p style={{ ...s.error, marginTop: 16 }}>{error}</p> : null}

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
              personalContext={{
                diner_education_status: profile?.diner_education_status,
                diner_field_of_study: profile?.diner_field_of_study,
                diner_occupation: profile?.diner_occupation,
                diner_hometown: profile?.diner_hometown,
                diner_hobbies: profile?.diner_hobbies,
              }}
              locationLabel={profile?.primary_location?.public_label || null}
              connections={connections}
              viewerUserId={consumer?.id}
              busy={identityBusy}
              notice={identityNotice}
              error={identityError}
              onAvatarFile={onAvatarFile}
              onAboutSave={onAboutSave}
              onSaveProfileSettings={onSaveProfileSettings}
              flashVideos={flashVideos}
              flashBusy={flashBusy}
              onFlashVideoRemove={onFlashVideoRemove}
              profileMedia={profileMedia}
              onProfileMediaAdd={onProfileMediaAdd}
              onProfileMediaRemove={onProfileMediaRemove}
              monthInFoodHref={MY_MENUPLY_MONTH_IN_FOOD_PATH}
              dateOfBirth={
                profile?.date_of_birth ? String(profile.date_of_birth).slice(0, 10) : ""
              }
              dinerSex={profile?.diner_sex || ""}
              favoriteFoods={
                Array.isArray(profile?.favorite_foods) ? profile.favorite_foods : []
              }
              eduConsumer={eduConsumer}
            />
            <ProfileGalleryComposeSheet
              open={profileGalleryPickerOpen}
              onClose={() => {
                setProfileGalleryPickerOpen(false);
                setProfileGalleryMediaSource(null);
              }}
              mediaSource={profileGalleryMediaSource}
              onMediaSourceChange={setProfileGalleryMediaSource}
              busy={identityBusy}
              onFile={onProfileMediaAdd}
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
              homeDishes={homeDishes}
              events={events}
              eventGroups={eventGroups}
              viewerUserId={consumer?.id}
              showFoodStoryCta={showFoodStoryCta}
              onLogFood={() => {
                setComposeDefaultCategory("ate");
                setComposeMediaSource("camera");
                setComposeOpen(true);
              }}
              onHighlightDelete={onHighlightDelete}
              highlightDeleteBusy={Boolean(postBusy)}
            />

            <HomeAtHomeSection
              dishes={homeDishes}
              busy={homeDishBusy}
              error={homeDishError}
              onDelete={onHomeAtHomeDelete}
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
              calendarTitle={calendarTitle}
              onCalendarTitleChange={setCalendarTitle}
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
              diningIntents={diningIntents}
              wantListError={wantListError}
              wantDiscovery={wantDiscovery}
              onDismissWantDiscovery={() => setWantDiscovery(null)}
              liked={liked}
              lastPost={lastPost}
              postBusy={postBusy}
              followed={followed}
              joinCandidates={joinCandidates}
              inviteMeOutOpen={inviteMeOutOpen}
              inviteMeOutAudience={inviteMeOutAudience}
              inviteMeOutSelectedIds={inviteMeOutSelectedIds}
              inviteMeOutCandidates={joinCandidates}
              onInviteMeOutSave={saveInviteMeOutSettings}
              inviteMeOutToggleBusy={inviteMeOutToggleBusy}
              onRequestMmt={() => setRequestMmtOpen(true)}
              onViewMmt={(mmt) => setMmtDetailId(Number(mmt?.id) || null)}
              planPrefill={planPrefill}
              locationCity={locationCity}
              locationState={locationState}
              favoriteFoods={
                Array.isArray(profile?.favorite_foods) ? profile.favorite_foods : []
              }
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
              onDiaryDelete={onDiaryDelete}
              diaryDeleteBusy={postBusy === "eating-delete"}
              onWantDelete={onWantDelete}
              wantDeleteBusy={postBusy === "want-delete"}
              onDiningIntentDelete={onDiningIntentDelete}
              diningIntentDeleteBusy={postBusy === "dining-intent-delete"}
              onPlanDelete={onPlanDelete}
              planDeleteBusy={String(postBusy).startsWith("plan-delete-")}
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
              onPlanAddVideo={(next) => setPlanVideoPlan(next)}
              onPostTagged={handlePostTagged}
              onSkipDetails={() => setLastPost(null)}
              foodHref={foodHref}
            />

            <section style={s.section} data-testid="dining-crews">
              <SectionHead
                kicker="Your people"
                title="My Crews"
                to="/account/dining-crews"
                subtitle="The people you eat, hang out, and make plans with"
              />
              {crews.length === 0 ? (
                <SectionEmptyState testId="crews-empty">
                  The people you eat, hang out, and make plans with.
                </SectionEmptyState>
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
                        : "Private · members only",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    onDelete={crew.viewer_role === "owner" ? onCrewDelete : undefined}
                    deleteBusy={postBusy === `crew-delete-${crew.id}`}
                  />
                ))
              )}
            </section>

            <section style={s.section} data-testid="my-events">
              <SectionHead
                kicker="On the calendar"
                title="My Events"
                subtitle="Events you're creating or joining"
                aside={
                  <button
                    type="button"
                    style={s.plansCalendarBtn}
                    data-testid="my-events-calendar-open"
                    aria-label="Open month calendar for my events"
                    onClick={openEventsCalendar}
                  >
                    <PlansCalendarGlyph />
                  </button>
                }
              />
              {events.length === 0 && eventGroups.length === 0 && socialEvents.length === 0 ? (
                <SectionEmptyState testId="events-empty">
                  Events you&apos;re creating or joining.
                </SectionEmptyState>
              ) : (
                <>
                  {socialEvents.slice(0, 6).map((ev) => (
                    <NamedShareCard
                      key={`social-${ev.id}`}
                      name={ev.title}
                      href={`/account/social-events/${ev.id}`}
                      meta={[
                        "Yours",
                        formatEventWhen(ev),
                        ev.start_time || null,
                        ev.location_label || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      description={ev.description || null}
                      onDelete={() => onSocialEventDelete(ev)}
                      deleteBusy={postBusy === `social-event-delete-${ev.id}`}
                      deleteLabel={`Delete event ${ev.title || ""}`.trim()}
                    />
                  ))}
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
                    />
                  ))}
                </>
              )}
            </section>

            <EventComposeSheet
              open={eventComposeOpen}
              onClose={() => setEventComposeOpen(false)}
              busy={postBusy === "events"}
              onSubmit={postSocialEvent}
            />

            <PlanVideoAttachSheet
              open={Boolean(planVideoPlan)}
              plan={planVideoPlan}
              onClose={() => setPlanVideoPlan(null)}
              onAttached={() => {
                void load();
              }}
            />

            {crewComposeOpen ? (
              <div
                role="presentation"
                style={crewSheetStyles.backdrop}
                data-testid="crew-compose-sheet"
                onClick={() => setCrewComposeOpen(false)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Create dining crew"
                  style={crewSheetStyles.panel}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={crewSheetStyles.head}>
                    <p style={crewSheetStyles.title}>New crew</p>
                    <button
                      type="button"
                      style={crewSheetStyles.close}
                      onClick={() => setCrewComposeOpen(false)}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <CrewQuickCompose
                    testId="compose-crew"
                    busy={postBusy === "crews"}
                    onSubmit={async (payload) => {
                      await postCrew(payload);
                      setCrewComposeOpen(false);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <InvitePickerSheet
        open={inviteCrewPickerOpen}
        kind="crew"
        items={crews}
        busy={postBusy === "invite"}
        onClose={() => setInviteCrewPickerOpen(false)}
        onPick={(crew) => {
          setInviteCrewPickerOpen(false);
          shareCrewInvite(crew);
        }}
      />
      <CrewInvitePeopleSheet
        open={crewInvitePeopleOpen}
        crewName={crewInviteTarget?.name || ""}
        connections={connections}
        memberUserIds={(crewInviteTarget?.members || crewInviteTarget?.members_preview || []).map(
          (m) => m.user_id
        )}
        busy={postBusy === "invite"}
        onClose={() => {
          setCrewInvitePeopleOpen(false);
          setCrewInviteTarget(null);
        }}
        onShareLink={() => createCrewInviteShareFromSheet()}
        onInviteConnection={(peerId) => createCrewInviteShareFromSheet({ inviteeUserId: peerId })}
      />
      <InvitePickerSheet
        open={inviteEventPickerOpen}
        kind="event"
        items={socialEvents}
        busy={postBusy === "invite"}
        onClose={() => setInviteEventPickerOpen(false)}
        onPick={(ev) => {
          setInviteEventPickerOpen(false);
          shareDinerSocialEventInvite(ev);
        }}
      />
      {sharePayload?.shareData ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          modalTitle={sharePayload.modalTitle}
          shareData={sharePayload.shareData}
          analyticsContext={sharePayload.analyticsContext}
        />
      ) : null}
      <RequestMmtSheet
        open={requestMmtOpen}
        wants={wants}
        candidates={joinCandidates}
        onClose={() => setRequestMmtOpen(false)}
        onCreated={async () => {
          setRequestMmtOpen(false);
          await refreshMmtData();
        }}
      />
      <MmtDetailSheet
        open={Boolean(mmtDetailId)}
        requestId={mmtDetailId}
        viewerUserId={consumer?.id}
        onClose={() => setMmtDetailId(null)}
        onUpdated={refreshMmtData}
      />
    </>
  );
}

const crewSheetStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 12px calc(var(--bottom-nav-h, 72px) + 12px)",
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    padding: "16px 16px 20px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
  },
};
