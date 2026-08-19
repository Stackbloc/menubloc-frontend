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
import DinerCalendarSheet, { DinerCalendarTrigger } from "./myMenuply/DinerCalendarSheet.jsx";
import {
  listConnections,
  listConnectionsEating,
  listConnectionsPlanning,
  listPeerWhatIAteToday,
  resolveConsumerMediaUrl,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import DinerIdentityHero from "./myMenuply/DinerIdentityHero.jsx";
import { EatingPlanCard, PhotoGrid, SectionHead } from "./myMenuply/myMenuplyBits.jsx";

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
  const [plans, setPlans] = useState([]);
  const [joinMeHref, setJoinMeHref] = useState("");
  const [eatingDate, setEatingDate] = useState(() => whatIAteTodayLocalDate());
  const [planDate, setPlanDate] = useState(() => whatIAteTodayLocalDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [plansCalendarOpen, setPlansCalendarOpen] = useState(false);
  const [eatingMonth, setEatingMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [planMonth, setPlanMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const load = useCallback(async () => {
    setError("");
    try {
      const [connData, peerConnData, eatData, planData, diaryData] = await Promise.all([
        listConnections("accepted"),
        listConnections("accepted", peerId).catch(() => ({ accepted: [] })),
        listConnectionsEating(40, peerId).catch(() => ({ items: [] })),
        listConnectionsPlanning(40, peerId).catch(() => ({ items: [] })),
        listPeerWhatIAteToday(peerId, eatingDate).catch(() => ({ entries: [] })),
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
      const diaryItems = (diaryData.entries || []).map((row) => ({
        ...row,
        id: `wia-${row.id}`,
        entry_id: row.id,
        food_name: row.item_name || row.food_name || "Food",
        kind: "what_i_ate",
      }));
      const planItems = (planData.items || []).filter((item) => Number(item.peer?.id) === peerId);
      setEating(diaryItems.length ? diaryItems : eatItems);
      setPlans(planItems.filter((item) => item.kind !== "join_me" && item.href).map(asPlan));
      const join = planItems.find((item) => item.join_me_href)?.join_me_href || "";
      setJoinMeHref(join);
    } catch (err) {
      setError(err.message || "Unable to load Connection");
    } finally {
      setLoading(false);
    }
  }, [peerId, consumer?.id, profile?.display_name, eatingDate]);

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
  const name = peer?.display_name || (peer?.id ? `Member #${peer.id}` : "Connection");
  const inviteHref = peer?.id
    ? `/account/what-we-doing?with=${encodeURIComponent(String(peer.id))}`
    : "/account/what-we-doing";
  const diaryHref = peer?.id
    ? `/account/connections/${encodeURIComponent(String(peer.id))}/what-i-ate`
    : "/account/what-i-ate";

  return (
    <>
      <StickyPageHeader title={name} />
      <div style={s.page} data-testid="connection-peer-hub">
        <p style={s.kicker}>My food. My people. My plans.</p>
        <h1 style={s.h1}>{name}</h1>
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
              connections={peerConnections}
              viewerUserId={consumer?.id}
            />

            <section style={s.section} data-testid="what-im-eating">
              <SectionHead
                title="What I'm Eating"
                to={diaryHref}
                aside={<DinerCalendarTrigger selectedDate={eatingDate} onOpen={() => setCalendarOpen(true)} />}
              />
              <PhotoGrid items={eating} hideJoinMe />
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
                  .map((row) => planYmd(row.eaten_on || row.created_at))
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
              {plans
                .filter((plan) => compareYmd(plan.plan_date) >= 0 && planYmd(plan.plan_date) === planDate)
                .slice(0, 12)
                .map((plan) => (
                  <EatingPlanCard key={plan.token || plan.id} plan={plan} />
                ))}
              <DinerCalendarSheet
                open={plansCalendarOpen}
                onClose={() => setPlansCalendarOpen(false)}
                testId="future-plans-calendar"
                selectedDate={planDate}
                onSelectDate={setPlanDate}
                viewMonth={planMonth}
                onViewMonthChange={setPlanMonth}
                minYmd={whatIAteTodayLocalDate()}
                dayCounts={plans
                  .filter((plan) => compareYmd(plan.plan_date) >= 0)
                  .map((plan) => planYmd(plan.plan_date))
                  .filter(Boolean)
                  .reduce((rows, ymd) => {
                    bumpDayCount(rows, ymd);
                    return rows;
                  }, [])}
              />
              <div style={{ ...s.labelRow, marginTop: 14 }}>
                <Link to={inviteHref} style={s.subLabel}>
                  Invite Me
                </Link>
                {joinMeHref ? (
                  <Link to={joinMeHref} style={s.subLabel}>
                    Join Me
                  </Link>
                ) : null}
              </div>
            </section>

            <section style={s.section} data-testid="want-to-eat">
              <SectionHead title="What I Want to Eat" />
              <p style={s.muted}>Nothing yet.</p>
            </section>

            <section style={s.section} data-testid="dining-crews">
              <SectionHead title="My Crews" />
              <p style={s.muted}>Nothing yet.</p>
            </section>

            <section style={s.section} data-testid="my-events">
              <SectionHead title="My Events" />
              <p style={s.muted}>Nothing yet.</p>
            </section>
          </>
        ) : null}

        <p style={{ marginTop: 24 }}>
          <Link to="/my-menuply" style={s.link}>
            Back to My Menuply
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}
