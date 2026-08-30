import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { listConnectionsEating } from "../../lib/consumerApi.js";
import * as s from "./myMenuply/myMenuplyStyles.js";
import { ConnectionFoodCard } from "./myMenuply/myMenuplyBits.jsx";
import { MY_MENUPLY_PROFILE_PATH } from "../../lib/myMenuplyRoutes.js";

export default function ConnectionsEatingPage() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listConnectionsEating(40);
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
      <StickyPageHeader title="My Connections" />
      <div style={s.page} data-testid="connections-eating-page">
        <p style={s.lead}>Food from people you already eat with — Join Me when you can eat together.</p>
        {error ? <p style={s.error}>{error}</p> : null}
        {!isAuthenticated && !authLoading ? (
          <p style={s.muted}>
            <Link to={`/account/login?next=${encodeURIComponent("/feed/profile")}`} style={s.link}>
              Sign in
            </Link>{" "}
            to see what your connections are eating.
          </p>
        ) : null}
        {loading ? <p style={s.muted}>Loading…</p> : null}
        {!loading && isAuthenticated && items.length === 0 ? (
          <p style={s.muted}>No connection food activity yet.</p>
        ) : null}
        {items.map((item) => (
          <ConnectionFoodCard key={item.id} item={item} />
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
