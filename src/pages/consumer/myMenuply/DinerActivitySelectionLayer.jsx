/**
 * Profile activity-selection layer — structured signals BEFORE media/Feed.
 * Viewer chooses a signal, then explores food / people / connect.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  buildFoodExploreSearchUrl,
  dinerCanonicalProfilePath,
  foodExploreLabel,
  formatPlanActivityHeadline,
  formatWantActivityHeadline,
  wantContextLine,
  wantActivityIcon,
} from "../../../lib/dinerActivityExplore.js";
import { fetchWantDiscovery, createWantToEat } from "../../../lib/consumerApi.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";

export default function DinerActivitySelectionLayer({
  displayName = "Diner",
  locationLabel = null,
  schoolAffiliation = null,
  wants = [],
  plans = [],
  joinMeHref = "",
  showConnect = false,
  onConnect = null,
  connectBusy = false,
  viewerMayInviteMeOut = false,
  onInviteMeOut = null,
  isSelf = false,
  locationCity = null,
  locationState = null,
  onWantCreated = null,
}) {
  const [selectedWantId, setSelectedWantId] = useState(null);
  const [wantBusy, setWantBusy] = useState(false);
  const [wantNotice, setWantNotice] = useState("");
  const [wantError, setWantError] = useState("");
  const [people, setPeople] = useState(null);
  const [peopleBusy, setPeopleBusy] = useState(false);

  const primaryWants = (wants || []).slice(0, 6);
  const primaryPlans = (plans || []).slice(0, 3);
  const selectedWant =
    primaryWants.find((w) => Number(w.id) === Number(selectedWantId)) || primaryWants[0] || null;

  async function handleIWantToo(want) {
    if (!want || isSelf || wantBusy) return;
    setWantBusy(true);
    setWantError("");
    setWantNotice("");
    try {
      await createWantToEat({
        food_name: want.food_name,
        food_interest_key: want.food_interest_key || undefined,
        intent_kind: want.intent_kind || "food_item",
        meal_period: want.meal_period || undefined,
        market_discoverable: true,
        include_discovery: true,
      });
      setWantNotice("Saved to What I Wanna Eat.");
      onWantCreated?.(want);
    } catch (err) {
      setWantError(err.message || "Could not save want");
    } finally {
      setWantBusy(false);
    }
  }

  async function handleSeePeople(want) {
    if (!want) return;
    setPeopleBusy(true);
    setWantError("");
    try {
      const data = await fetchWantDiscovery({
        foodName: want.food_name,
        foodInterestKey: want.food_interest_key,
        limit: 12,
      });
      const connects = Array.isArray(data?.connects_related) ? data.connects_related : [];
      const nearby = Array.isArray(data?.nearby) ? data.nearby : [];
      setPeople([...connects, ...nearby].slice(0, 12));
    } catch (err) {
      setWantError(err.message || "Could not load people");
      setPeople([]);
    } finally {
      setPeopleBusy(false);
    }
  }

  const hasSignals = primaryWants.length > 0 || primaryPlans.length > 0 || Boolean(joinMeHref);

  return (
    <section style={styles.wrap} data-testid="diner-activity-selection">
      <p style={styles.kicker}>What they&apos;re into</p>
      <h2 style={styles.title}>Choose an activity</h2>
      <p style={styles.lead}>
        Scan signals first — then explore food, people, or connect. This is not the Feed.
      </p>

      {!hasSignals ? (
        <p style={styles.empty} data-testid="diner-activity-empty">
          No discoverable eating signals yet.
        </p>
      ) : null}

      {primaryWants.length > 0 ? (
        <ul style={styles.signalList} data-testid="diner-activity-wants">
          {primaryWants.map((want) => {
            const active = Number(selectedWant?.id) === Number(want.id);
            const context = wantContextLine({
              want,
              locationLabel,
              schoolAffiliation,
            });
            return (
              <li key={`want-${want.id}`}>
                <button
                  type="button"
                  style={{ ...styles.signalBtn, ...(active ? styles.signalBtnActive : null) }}
                  data-testid="diner-activity-want-signal"
                  aria-pressed={active}
                  onClick={() => setSelectedWantId(want.id)}
                >
                  <span style={styles.signalHeadline}>
                    {formatWantActivityHeadline({ displayName, want })}
                  </span>
                  {context ? <span style={styles.signalMeta}>{context}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {primaryPlans.length > 0 ? (
        <ul style={styles.signalList} data-testid="diner-activity-plans">
          {primaryPlans.map((plan) => (
            <li key={`plan-${plan.token || plan.id || plan.plan_date}`}>
              <div style={styles.planRow} data-testid="diner-activity-plan-signal">
                <span style={styles.signalHeadline}>
                  {formatPlanActivityHeadline({ displayName, plan })}
                </span>
                {plan.join_me_href || joinMeHref ? (
                  <Link
                    to={plan.join_me_href || joinMeHref}
                    style={styles.secondaryLink}
                    data-testid="diner-activity-join-me"
                  >
                    🤝 Join Me
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {joinMeHref && primaryPlans.length === 0 ? (
        <p style={styles.joinAlone}>
          <Link to={joinMeHref} style={styles.secondaryLink} data-testid="diner-activity-join-me">
            🤝 Join Me — join an open meal
          </Link>
        </p>
      ) : null}

      {selectedWant ? (
        <div style={styles.actions} data-testid="diner-activity-want-actions">
          <p style={styles.actionsLead}>
            {wantActivityIcon(selectedWant)} Selected:{" "}
            <strong>{selectedWant.food_name || "food"}</strong>
          </p>
          <div style={styles.actionRow}>
            {selectedWant.menu_item_id ? (
              <Link
                to={`/menu-items/${encodeURIComponent(String(selectedWant.menu_item_id))}`}
                style={styles.primaryBtn}
                data-testid="diner-activity-see-item"
              >
                View menu item
              </Link>
            ) : (
              <Link
                to={buildFoodExploreSearchUrl({
                  foodName: selectedWant.food_name,
                  foodInterestKey: selectedWant.food_interest_key,
                  city: selectedWant.city || locationCity,
                  state: selectedWant.state || locationState,
                })}
                style={styles.primaryBtn}
                data-testid="diner-activity-see-food"
              >
                {foodExploreLabel(selectedWant)}
              </Link>
            )}
            {!isSelf ? (
              <button
                type="button"
                style={styles.secondaryBtn}
                disabled={wantBusy}
                data-testid="diner-activity-want-too"
                onClick={() => handleIWantToo(selectedWant)}
              >
                {wantBusy ? "Saving…" : "I want this too"}
              </button>
            ) : null}
            <button
              type="button"
              style={styles.secondaryBtn}
              disabled={peopleBusy}
              data-testid="diner-activity-see-people"
              onClick={() => handleSeePeople(selectedWant)}
            >
              {peopleBusy ? "Loading…" : "See people"}
            </button>
            {viewerMayInviteMeOut && typeof onInviteMeOut === "function" ? (
              <button
                type="button"
                style={styles.secondaryBtn}
                data-testid="diner-activity-invite-me-out"
                onClick={onInviteMeOut}
              >
                Invite Me Out
              </button>
            ) : null}
            {showConnect && typeof onConnect === "function" ? (
              <button
                type="button"
                style={styles.connectBtn}
                disabled={connectBusy}
                data-testid="diner-activity-connect"
                onClick={onConnect}
              >
                {connectBusy ? "…" : "👋 Connect"}
              </button>
            ) : null}
          </div>
          {wantNotice ? <p style={styles.notice}>{wantNotice}</p> : null}
          {wantError ? <p style={styles.error}>{wantError}</p> : null}
        </div>
      ) : null}

      {people ? (
        <div style={styles.peopleBox} data-testid="diner-activity-people">
          <p style={styles.peopleTitle}>People with related food signals</p>
          {people.length === 0 ? (
            <p style={styles.empty}>No one nearby has posted this yet.</p>
          ) : (
            <ul style={styles.peopleList}>
              {people.map((row) => {
                const href =
                  dinerCanonicalProfilePath(row.consumer_user_id) ||
                  (row.consumer_user_id
                    ? `/account/diners/${encodeURIComponent(String(row.consumer_user_id))}`
                    : null);
                const label =
                  row.message ||
                  `${row.display_name || "Diner"} ${
                    row.kind === "want" || row.signal_kind === "want" ? "wants" : "is eating"
                  } ${labelWithFoodIcon(
                    row.food_interest_key || selectedWant?.food_interest_key,
                    row.food_name || "food"
                  )}`;
                return (
                  <li key={`${row.kind || row.signal_kind}-${row.id}`} style={styles.peopleItem}>
                    {href ? (
                      <Link to={href} style={styles.peopleLink}>
                        {label}
                      </Link>
                    ) : (
                      <span>{label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  wrap: {
    margin: "0 0 16px",
    padding: "14px 14px 16px",
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
  },
  kicker: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#15803d",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 18,
    fontWeight: 800,
    color: "#14532d",
  },
  lead: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },
  empty: { margin: "12px 0 0", fontSize: 14, color: "#64748b" },
  signalList: {
    listStyle: "none",
    margin: "12px 0 0",
    padding: 0,
    display: "grid",
    gap: 8,
  },
  signalBtn: {
    width: "100%",
    textAlign: "left",
    appearance: "none",
    border: "1px solid #d1fae5",
    background: "#fff",
    borderRadius: 12,
    padding: "12px 12px",
    cursor: "pointer",
    display: "grid",
    gap: 4,
  },
  signalBtnActive: {
    borderColor: "#16a34a",
    boxShadow: "0 0 0 2px rgba(22,163,74,0.15)",
  },
  signalHeadline: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  signalMeta: { fontSize: 12, color: "#64748b" },
  planRow: {
    display: "grid",
    gap: 6,
    padding: "12px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  joinAlone: { margin: "12px 0 0", fontSize: 14 },
  actions: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #dcfce7",
  },
  actionsLead: { margin: "0 0 10px", fontSize: 14, color: "#166534" },
  actionRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
    border: "none",
  },
  secondaryBtn: {
    appearance: "none",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  connectBtn: {
    appearance: "none",
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryLink: {
    color: "#166534",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 14,
  },
  notice: { margin: "8px 0 0", fontSize: 13, color: "#166534" },
  error: { margin: "8px 0 0", fontSize: 13, color: "#b91c1c" },
  peopleBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  peopleTitle: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  peopleList: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  peopleItem: { fontSize: 14, lineHeight: 1.35 },
  peopleLink: { color: "#166534", textDecoration: "none", fontWeight: 600 },
};
