/**
 * My Menuply — the diner's personal food home.
 * About Me (with Connections), what she's eating, her plans, wants, crews, events.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import {
  buildDiningCrewInviteShareData,
  buildMenuplyPathShareData,
} from "../../lib/diningCrewInviteShare.js";
import DinerCalendarSheet, { DinerCalendarTrigger } from "./myMenuply/DinerCalendarSheet.jsx";
import * as s from "./myMenuply/myMenuplyStyles.js";
import ProfileCompletionBanner from "../../components/consumer/ProfileCompletionBanner.jsx";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import QuickCompose from "./myMenuply/QuickCompose.jsx";
import PostAfterActions from "./myMenuply/PostAfterActions.jsx";
import EatingPlanDayForm from "./myMenuply/EatingPlanDayForm.jsx";
import { buildJoinMeCandidates } from "./myMenuply/joinMeCandidates.js";
import {
  PhotoGrid,
  SectionHead,
  FuturePlanRow,
  NamedShareCard,
  foodHref,
  isScheduledEatingPlan,
} from "./myMenuply/myMenuplyBits.jsx";
import { futurePlanKey, futurePlanRestaurantName } from "./myMenuply/dinerHubFormat.js";
import { mergeEatingFeedForHub } from "../../lib/eatingFeedMerge.js";

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
  const { isAuthenticated, loading: authLoading, consumer } = useConsumer();
  const [searchParams] = useSearchParams();
  const wantSectionRef = useRef(null);
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
  const [plans, setPlans] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [liked, setLiked] = useState([]);
  const [wants, setWants] = useState([]);
  const [wantListError, setWantListError] = useState("");
  const [crews, setCrews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventGroups, setEventGroups] = useState([]);
  const [planDate, setPlanDate] = useState(() => whatIAteTodayLocalDate());
  const [eatingDate, setEatingDate] = useState(() => whatIAteTodayLocalDate());
  const [planMonth, setPlanMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [eatingMonth, setEatingMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [lastPost, setLastPost] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [plansCalendarOpen, setPlansCalendarOpen] = useState(false);
  const [schedulingPlans, setSchedulingPlans] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [joinCandidates, setJoinCandidates] = useState([]);

  const load = useCallback(async () => {
    setError("");
    try {
      const [
        profileRes,
        activityRes,
        ateRes,
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
        listWhatIAteToday(eatingDate).catch(() => ({ entries: [] })),
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
      setEating(mergeEatingFeedForHub(diaryItems, activityItems).slice(0, 12));
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
  }, [eatingDate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  useEffect(() => {
    if (searchParams.get("focus") !== "want") return undefined;
    if (loading || !isAuthenticated) return undefined;
    const timer = window.setTimeout(() => {
      wantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = wantSectionRef.current?.querySelector("input[type='text']");
      input?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [searchParams, loading, isAuthenticated]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "You";
  const scheduledPlans = plans.filter(
    (plan) => compareYmd(plan.plan_date) >= 0 && isScheduledEatingPlan(plan)
  );
  const shownPlans = scheduledPlans.slice(0, 24);
  const calendarEvents = shownPlans.map((plan) => ({
    key: futurePlanKey(plan),
    ymd: planYmd(plan.plan_date),
    label: futurePlanRestaurantName(plan),
    plan,
  }));

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

  async function postEating({ text, file }) {
    setPostBusy("eating");
    setError("");
    try {
      if (compareYmd(eatingDate) > 0) return;
      let photo_url;
      if (file) {
        const up = await uploadWhatIAteTodayPhoto(file);
        photo_url = up.photo_url || undefined;
      }
      const data = await createWhatIAteToday({
        food_name: text || "Food",
        photo_url,
        eaten_on: eatingDate,
        meal_period: defaultWhatIAteMealPeriod(),
      });
      const entry = data.entry || data;
      setLastPost({ kind: "diary", id: entry.id });
      await load();
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
        restaurant_id: payload.restaurantId,
        place_label: payload.placeLabel,
        joinable: payload.joinable,
        join_capacity: payload.joinCapacity,
        join_audience: payload.joinAudience,
        join_allowed_user_ids: payload.joinAllowedUserIds,
      });
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
      const photo_url = up.photo_url;
      if (item?.kind === "what_i_ate" && item.entry_id) {
        await updateWhatIAteToday(item.entry_id, { photo_url });
      } else {
        await createWhatIAteToday({
          food_name: item?.food_name || "Food",
          photo_url,
          eaten_on: eatingDate,
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

  async function postWant({ text, file }) {
    setPostBusy("want");
    setError("");
    setWantListError("");
    try {
      let photo_url;
      if (file) {
        const up = await uploadWantToEatPhoto(file);
        photo_url = up.photo_url || undefined;
      }
      const name = String(text || "").trim() || (file ? "Want to eat" : "");
      if (!name) {
        setError("Enter what you want to eat");
        return;
      }
      const data = await createWantToEat({ food_name: name, photo_url });
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
        wantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

            <section style={s.section} data-testid="what-im-eating">
              <SectionHead
                title="What I'm Eating"
                to="/account/what-i-ate"
                aside={<DinerCalendarTrigger selectedDate={eatingDate} onOpen={() => setCalendarOpen(true)} />}
              />
              <QuickCompose
                testId="compose-eating"
                placeholder="What did you eat?"
                acceptPhoto
                busy={postBusy === "eating"}
                onSubmit={postEating}
              />
              <PhotoGrid
                items={
                  eating.length
                    ? eating
                    : [
                        {
                          id: "placeholder",
                          food_name: "Food",
                          eaten_on: eatingDate,
                          meal_period: defaultWhatIAteMealPeriod(),
                          kind: "what_i_ate",
                        },
                      ]
                }
                hideJoinMe
                onPhotoPick={onEatingPhotoPick}
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
              <DinerCalendarSheet
                open={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                testId="eating-plans-calendar"
                selectedDate={eatingDate}
                onSelectDate={setEatingDate}
                viewMonth={eatingMonth}
                onViewMonthChange={setEatingMonth}
                maxYmd={whatIAteTodayLocalDate()}
                dayCounts={eating
                  .map((row) => planYmd(row.eaten_on))
                  .filter(Boolean)
                  .reduce((rows, ymd) => {
                    bumpDayCount(rows, ymd);
                    return rows;
                  }, [])}
              />
              <div style={s.row}>
                <h2 style={s.sectionTitle}>Future plans</h2>
                <DinerCalendarTrigger selectedDate={planDate} onOpen={() => setPlansCalendarOpen(true)} />
              </div>
              {scheduledPlans.length === 0 ? (
                <p style={s.muted} data-testid="future-plans-summary">
                  No Plans Scheduled.
                </p>
              ) : (
                shownPlans.map((plan) => {
                  const key = futurePlanKey(plan);
                  return (
                    <FuturePlanRow
                      key={key}
                      plan={plan}
                      open={selectedPlanKey === key}
                      onToggle={() => setSelectedPlanKey((prev) => (prev === key ? "" : key))}
                      onAddDetails={(next) => {
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
                    />
                  );
                })
              )}
              {!schedulingPlans ? (
                <button
                  type="button"
                  style={{ ...s.primaryBtn, width: "100%", minHeight: 44, justifyContent: "center", marginTop: 8 }}
                  onClick={() => {
                    setSchedulingPlans(true);
                    setPlansCalendarOpen(true);
                  }}
                >
                  Click to Schedule Future Plans
                </button>
              ) : (
                <EatingPlanDayForm
                  planDate={planDate}
                  busy={postBusy === "eating"}
                  followed={followed}
                  joinCandidates={joinCandidates}
                  onSubmit={postPlan}
                />
              )}
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
              <DinerCalendarSheet
                open={plansCalendarOpen}
                onClose={() => setPlansCalendarOpen(false)}
                testId="future-plans-calendar"
                title="Future plans"
                selectedDate={planDate}
                onSelectDate={(ymd) => {
                  setPlanDate(ymd);
                  const match = scheduledPlans.find((plan) => planYmd(plan.plan_date) === ymd);
                  if (match) setSelectedPlanKey(futurePlanKey(match));
                  else setSchedulingPlans(true);
                }}
                onSelectEvent={(event) => {
                  setPlanDate(event.ymd);
                  setSelectedPlanKey(event.key);
                  setSchedulingPlans(false);
                }}
                viewMonth={planMonth}
                onViewMonthChange={setPlanMonth}
                minYmd={whatIAteTodayLocalDate()}
                events={calendarEvents}
                dayCounts={scheduledPlans
                  .map((plan) => planYmd(plan.plan_date))
                  .filter(Boolean)
                  .reduce((rows, ymd) => {
                    bumpDayCount(rows, ymd);
                    return rows;
                  }, [])}
              />
              <div style={{ ...s.labelRow, marginTop: 14 }}>
                <Link to="/account/what-we-doing" style={s.subLabel}>
                  Invite Me
                </Link>
              </div>
              <p style={s.muted}>
                Only people you open Join Me to can see that future plan.
              </p>
            </section>

            <section style={s.section} data-testid="want-to-eat" ref={wantSectionRef}>
              <SectionHead title="What I Want to Eat" />
              <p style={s.muted}>Items you want to try. Connections can see this on your hub.</p>
              <QuickCompose
                testId="compose-want"
                placeholder="What do you want to eat?"
                acceptPhoto
                busy={postBusy === "want"}
                autoFocus={searchParams.get("focus") === "want"}
                onSubmit={postWant}
              />
              {wantListError ? <p style={s.error}>{wantListError}</p> : null}
              {lastPost?.kind === "want" &&
              !wants.some((row) => Number(row.id) === Number(lastPost.id)) ? (
                <div style={s.card} data-testid="want-to-eat-just-posted">
                  <div style={{ fontWeight: 800 }}>{lastPost.food_name}</div>
                  <div style={{ ...s.muted, fontSize: 12, marginTop: 4 }}>Saved — link a menu item below</div>
                </div>
              ) : null}
              {lastPost?.kind === "want" ? (
                <PostAfterActions
                  kind="want"
                  record={lastPost}
                  busy={postBusy === "want"}
                  followed={followed}
                  onTagged={async (updated) => {
                    if (updated?.id) {
                      setWants((prev) => {
                        const rest = prev.filter((row) => Number(row.id) !== Number(updated.id));
                        return [updated, ...rest];
                      });
                    }
                    setLastPost(null);
                    await load();
                  }}
                />
              ) : null}
              {wants.length === 0 && lastPost?.kind !== "want" ? (
                <p style={s.muted} data-testid="want-to-eat-empty">
                  Nothing on your want list yet. Post above, then link a menu item if you like.
                </p>
              ) : null}
              {wants.map((want) => {
                const href = want.menu_item_id ? `/menu-items/${want.menu_item_id}` : null;
                const body = (
                  <>
                    {want.photo_url ? (
                      <img
                        src={resolveConsumerMediaUrl(want.photo_url)}
                        alt=""
                        style={{ ...s.photo, height: 120, borderRadius: 12, marginBottom: 8 }}
                      />
                    ) : null}
                    <div style={{ fontWeight: 800 }}>{want.food_name}</div>
                    {want.restaurant_name ? <div style={s.muted}>{want.restaurant_name}</div> : null}
                    {want.menu_item_id ? (
                      <div style={{ ...s.muted, fontSize: 12, marginTop: 4 }}>Menu item linked</div>
                    ) : (
                      <div style={{ ...s.muted, fontSize: 12, marginTop: 4 }}>Tap to link a menu item</div>
                    )}
                  </>
                );
                const cardStyle = {
                  ...s.card,
                  appearance: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                };
                const openTag = () =>
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
                  });
                if (href) {
                  return (
                    <Link key={want.id} to={href} style={cardStyle} data-testid="want-to-eat-item">
                      {body}
                    </Link>
                  );
                }
                return (
                  <button key={want.id} type="button" style={cardStyle} data-testid="want-to-eat-item" onClick={openTag}>
                    {body}
                  </button>
                );
              })}
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
                    description={crew.description}
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
