import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listConnectionsPlanning } from "../../lib/consumerApi.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import { PlanCard } from "./myMenuply/myMenuplyBits.jsx";
import {
  MY_MENUPLY_CONNECTIONS_PLANNING_PATH,
  MY_MENUPLY_PROFILE_PATH,
} from "../../lib/myMenuplyRoutes.js";

export default function ConnectionsPlanningPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listConnectionsPlanning(40);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Unable to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) load();
    if (!authLoading && !isAuthenticated) setLoading(false);
  }, [authLoading, isAuthenticated, load]);

  return (
    <>
      <StickyPageHeader title="What My Connections Are Planning" />
      <div style={s.page} data-testid="connections-planning-page">
        <p style={s.lead}>Upcoming plans you can already see — Join Me or open the existing eating plan.</p>
        {error ? <p style={s.error}>{error}</p> : null}
        {!isAuthenticated && !authLoading ? (
          <p style={s.muted}>
            <Link to={`/account/login?next=${encodeURIComponent(MY_MENUPLY_CONNECTIONS_PLANNING_PATH)}`} style={s.link}>
              Sign in
            </Link>{" "}
            to see what your connections are planning.
          </p>
        ) : null}
        {loading ? <p style={s.muted}>Loading…</p> : null}
        {!loading && isAuthenticated && items.length === 0 ? (
          <p style={s.muted}>No shared plans yet.</p>
        ) : null}
        {items.map((item) => (
          <PlanCard key={item.id} item={item} />
        ))}
        <p style={{ marginTop: 16 }}>
          <Link to={MY_MENUPLY_PROFILE_PATH} style={s.link}>
            Back to My Menuply
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}
