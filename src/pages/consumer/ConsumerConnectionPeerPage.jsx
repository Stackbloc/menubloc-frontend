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
    title: item.title,
  };
}

export default function ConsumerConnectionPeerPage() {
  const navigate = useNavigate();
  const { peerId: peerIdParam } = useParams();
  const peerId = Number(peerIdParam);
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(null);
  const [eating, setEating] = useState([]);
  const [plans, setPlans] = useState([]);
  const [joinMeHref, setJoinMeHref] = useState("");
  const [planDate, setPlanDate] = useState(() => whatIAteTodayLocalDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [planMonth, setPlanMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const load = useCallback(async () => {
    setError("");
    try {
      const [connData, eatData, planData] = await Promise.all([
        listConnections("accepted"),
        listConnectionsEating(40, peerId).catch(() => ({ items: [] })),
        listConnectionsPlanning(40, peerId).catch(() => ({ items: [] })),
      ]);
      const match = (connData.accepted || []).find((c) => Number(c.peer?.id) === peerId);
      setConnection(match || null);
      const eatItems = (eatData.items || []).filter((item) => Number(item.peer?.id) === peerId);
      const planItems = (planData.items || []).filter((item) => Number(item.peer?.id) === peerId);
      setEating(eatItems);
      setPlans(planItems.filter((item) => item.kind !== "join_me" && item.href).map(asPlan));
      const join = [...eatItems, ...planItems].find((item) => item.join_me_href)?.join_me_href || "";
      setJoinMeHref(join);
    } catch (err) {
      setError(err.message || "Unable to load Connection");
    } finally {
      setLoading(false);
    }
  }, [peerId]);

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
              connections={[]}
            />

            <section style={s.section} data-testid="what-im-eating">
              <SectionHead
                title="What I'm Eating"
                to={diaryHref}
                aside={<DinerCalendarTrigger selectedDate={planDate} onOpen={() => setCalendarOpen(true)} />}
              />
              <PhotoGrid items={eating} />
              <DinerCalendarSheet
                open={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                testId="eating-plans-calendar"
                selectedDate={planDate}
                onSelectDate={setPlanDate}
                viewMonth={planMonth}
                onViewMonthChange={setPlanMonth}
                dayCounts={[
                  ...plans.map((plan) => planYmd(plan.plan_date)),
                  ...eating.map((row) => planYmd(row.created_at || row.eaten_on)),
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
                  <EatingPlanCard key={plan.token || plan.id} plan={plan} />
                ))}
              <div style={{ ...s.labelRow, marginTop: 14 }}>
                <Link to={inviteHref} style={s.subLabel}>
                  Invite Me
                </Link>
                <Link to={joinMeHref || inviteHref} style={s.subLabel}>
                  Join Me
                </Link>
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
