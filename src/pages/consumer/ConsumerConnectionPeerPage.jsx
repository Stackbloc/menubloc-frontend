/**
 * One Connection — same diner hub layout as My Menuply.
 * Read-only. Hidden sections follow that diner's visibility choices.
 * Route: /account/connections/:peerId
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../../lib/myMenuplyRoutes.js";
import EatingHubSection from "./myMenuply/EatingHubSection.jsx";
import InviteMeOutFlow from "./myMenuply/InviteMeOutFlow.jsx";
import {
  buildEatingDayMarkersFromCalendar,
  compareYmd,
  eatingHistoryStart,
  planYmd,
} from "./myMenuply/eatingHubUtils.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import { DiningCrewHubCard, SectionHead, isScheduledEatingPlan } from "./myMenuply/myMenuplyBits.jsx";
import { futurePlanKey, futurePlanRestaurantName, futurePlanDetailParts } from "./myMenuply/dinerHubFormat.js";
import {
  mapConnectionsEatingForHub,
  mapDiaryEntriesForHub,
  mergeEatingFeedForHub,
} from "../../lib/eatingFeedMerge.js";
import {
  listConnections,
  listConnectionsEating,
  listConnectionsPlanning,
  listDinerDiningCrews,
  listPeerWhatIAteToday,
  listPeerWhatIAteTodayCalendar,
  listPeerProfileMedia,
  listPeerWantToEat,
  requestJoinDiningCrew,
  resolveConsumerMediaUrl,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { formatDinerPeerLabel } from "../../lib/dinerPublicIdentity.js";

function tokenFromHref(href) {
  const match = String(href || "").match(/what-we-doing\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function asPlan(item) {
  return {
    token: tokenFromHref(item.href) || item.token,
    id: item.id,
    plan_date: item.plan_date,
    restaurant_id: item.restaurant_id,
    restaurant_name: item.restaurant_name,
    restaurant_slug: item.restaurant_slug,
    place_label: item.place_label,
    joinable: item.joinable,
    join_capacity: item.join_capacity,
    joiner_count: item.participant_count || item.joiner_count,
    join_me_href: item.join_me_href || (item.joinable ? item.href : null),
    title: item.title,
  };
}

export default function ConsumerConnectionPeerPage() {
  const navigate = useNavigate();
  const { peerId: peerIdParam } = useParams();
  const peerId = Number(peerIdParam);
  const { isAuthenticated, loading: authLoading, consumer, profile } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(null);
  const [peerConnections, setPeerConnections] = useState([]);
  const [eating, setEating] = useState([]);
  const [eatingCalendarDays, setEatingCalendarDays] = useState([]);
  const [plans, setPlans] = useState([]);
  const [joinMeHref, setJoinMeHref] = useState("");
  const [hubDate, setHubDate] = useState(() => whatIAteTodayLocalDate());
  const [hubMonth, setHubMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [crews, setCrews] = useState([]);
  const [crewJoinBusy, setCrewJoinBusy] = useState("");
  const [peerProfileMedia, setPeerProfileMedia] = useState([]);
  const [peerWants, setPeerWants] = useState([]);
  const [viewerMayInviteMeOut, setViewerMayInviteMeOut] = useState(false);
  const [inviteMeOutOpen, setInviteMeOutOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [connData, peerConnData, eatData, planData, diaryData, calendarData, crewData, mediaData, wantData] =
        await Promise.all([
        listConnections("accepted"),
        listConnections("accepted", peerId).catch(() => ({ accepted: [] })),
        listConnectionsEating(40, peerId).catch(() => ({ items: [] })),
        listConnectionsPlanning(40, peerId).catch(() => ({ items: [] })),
        listPeerWhatIAteToday(peerId, hubDate).catch(() => ({ entries: [] })),
        listPeerWhatIAteTodayCalendar(peerId, eatingHistoryStart(), whatIAteTodayLocalDate()).catch(() => ({
          days: [],
        })),
        listDinerDiningCrews(peerId).catch(() => ({ crews: [] })),
        listPeerProfileMedia(peerId).catch(() => ({ items: [] })),
        listPeerWantToEat(peerId).catch(() => ({ items: [] })),
      ]);
      const match = (connData.accepted || []).find((c) => Number(c.peer?.id) === peerId);
      setConnection(match || null);
      const accepted = peerConnData.accepted || [];
      const ignoredPeerId = accepted.some((c) => Number(c.peer?.id) === peerId);
      setPeerConnections(
        ignoredPeerId
          ? consumer?.id
            ? [
                {
                  id: `viewer-${consumer.id}`,
                  peer: {
                    id: consumer.id,
                    display_name: profile?.display_name || "You",
                  },
                },
              ]
            : []
          : accepted
      );
      const eatItems = (eatData.items || []).filter((item) => Number(item.peer?.id) === peerId);
      const diaryItems = mapDiaryEntriesForHub(diaryData.entries || []);
      const activityItems = mapConnectionsEatingForHub(eatItems, peerId);
      const planItems = (planData.items || []).filter((item) => Number(item.peer?.id) === peerId);
      setEating(mergeEatingFeedForHub(diaryItems, activityItems).slice(0, 12));
      setEatingCalendarDays(calendarData?.days || []);
      setPlans(planItems.filter((item) => item.kind !== "join_me" && item.href).map(asPlan));
      setCrews(crewData.crews || crewData.items || []);
      setPeerProfileMedia(mediaData?.items || []);
      setPeerWants(wantData?.items || []);
      setViewerMayInviteMeOut(Boolean(wantData?.invite_me_out?.viewer_may_invite));
      const join = planItems.find((item) => item.join_me_href)?.join_me_href || "";
      setJoinMeHref(join);
    } catch (err) {
      setError(err.message || "Unable to load Connection");
    } finally {
      setLoading(false);
    }
  }, [peerId, consumer?.id, profile?.display_name, hubDate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(`/account/connections/${peerIdParam || ""}`)}`,
        { replace: true }
      );
      return;
    }
    if (!authLoading && isAuthenticated) load();
  }, [authLoading, isAuthenticated, navigate, load, peerIdParam]);

  const peer = connection?.peer;
  const name = formatDinerPeerLabel(peer) || "Connection";
  const inviteHref = peer?.id
    ? `/account/what-we-doing?with=${encodeURIComponent(String(peer.id))}`
    : "/account/what-we-doing";
  void inviteHref;
  const diaryHref = peer?.id
    ? `/account/connections/${encodeURIComponent(String(peer.id))}/what-i-ate`
    : "/account/what-i-ate";
  const scheduledPlans = plans.filter(
    (plan) => compareYmd(plan.plan_date) >= 0 && isScheduledEatingPlan(plan)
  );
  const shownPlans = scheduledPlans;
  const calendarEvents = shownPlans.map((plan) => {
    const { meal } = futurePlanDetailParts(plan);
    return {
      key: futurePlanKey(plan),
      ymd: planYmd(plan.plan_date),
      label: futurePlanRestaurantName(plan),
      timeLabel: meal || null,
      plan,
    };
  });

  const dayMarkers = buildEatingDayMarkersFromCalendar(eatingCalendarDays, scheduledPlans);

  async function requestCrewJoin(crewId) {
    setCrewJoinBusy(String(crewId));
    setError("");
    try {
      await requestJoinDiningCrew(crewId);
      setCrews((prev) =>
        prev.map((crew) =>
          Number(crew.id) === Number(crewId) ? { ...crew, join_request_pending: true } : crew
        )
      );
    } catch (err) {
      setError(err.message || "Unable to request join");
    } finally {
      setCrewJoinBusy("");
    }
  }

  return (
    <>
      <StickyPageHeader title={name} backTo={MY_MENUPLY_PROFILE_PATH} backLabel="My Menuply" />
      <div style={s.page} data-testid="connection-peer-hub">
        {error ? <p style={s.error}>{error}</p> : null}
        {loading ? <p style={s.muted}>Loading…</p> : null}
        {!loading && !connection ? (
          <p style={s.muted}>This person is not one of your Connections.</p>
        ) : null}

        {!loading && connection ? (
          <>
            <DinerIdentityHero
              readOnly
              displayName={name}
              avatarUrl={resolveConsumerMediaUrl(peer?.avatar_url || "")}
              about={peer?.diner_about || ""}
              personalContext={{
                diner_education_status: peer?.diner_education_status,
                diner_field_of_study: peer?.diner_field_of_study,
                diner_occupation: peer?.diner_occupation,
                diner_hometown: peer?.diner_hometown,
              }}
              connections={peerConnections}
              viewerUserId={consumer?.id}
              profileMedia={peerProfileMedia}
              monthInFoodHref={
                peerId ? `/account/connections/${encodeURIComponent(String(peerId))}/month-in-food` : null
              }
            />

            <EatingHubSection
              readOnly
              diaryHref={diaryHref}
              joinMeHref={joinMeHref}
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
              wants={peerWants}
              viewerMayInviteMeOut={viewerMayInviteMeOut}
              onInviteMeOut={() => setInviteMeOutOpen(true)}
            />

            <InviteMeOutFlow
              open={inviteMeOutOpen}
              onClose={() => setInviteMeOutOpen(false)}
              peerName={name}
              wants={peerWants}
            />

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="My Crews" />
              {crews.length === 0 ? (
                <p style={s.muted}>No crews to show.</p>
              ) : (
                crews.slice(0, 8).map((crew) => {
                  const isMember = Boolean(crew.viewer_role);
                  const canRequest =
                    crew.visibility === "public" && !isMember && !crew.is_full;
                  return (
                    <DiningCrewHubCard
                      key={crew.id}
                      crew={crew}
                      href={`/account/dining-crews/${crew.id}`}
                      meta={[
                        `${crew.member_count || 0} ${crew.member_count === 1 ? "member" : "members"}`,
                        crew.visibility === "public" ? "Public" : "Private",
                        isMember ? "Member" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onRequestJoin={canRequest ? () => requestCrewJoin(crew.id) : undefined}
                      requestLabel={
                        crew.join_request_pending || String(crewJoinBusy) === String(crew.id)
                          ? "Request sent"
                          : "Request to join"
                      }
                      requestDisabled={
                        Boolean(crew.join_request_pending) || String(crewJoinBusy) === String(crew.id)
                      }
                    />
                  );
                })
              )}
            </section>

            <section style={s.section} data-testid="my-events">
              <SectionHead title="My Events" />
              <p style={s.muted}>Nothing yet.</p>
            </section>
          </>
        ) : null}

        <p style={{ marginTop: 24 }}>
          <Link to={MY_MENUPLY_PROFILE_PATH} style={s.link}>
            Back to My Menuply
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}
