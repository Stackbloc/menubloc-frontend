/**
 * Direct Add to What I Ate Today from a canonical menu-item page.
 * Lookup is skipped — the current CK item is attached. Never blocks a retry.
 */

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { createWhatIAteToday, whatIAteTodayLocalDate } from "../../lib/consumerApi.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";

export default function WhatIAteTodayAddButton({ menuItemId, foodName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useConsumer();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const ckId = Number(menuItemId);
  const hasCkId = Number.isFinite(ckId) && ckId > 0;
  const name = String(foodName || "").trim();

  async function handleClick() {
    setError("");
    setNotice("");
    if (!isAuthenticated) {
      const next = `${location.pathname}${location.search || ""}`;
      navigate(`/account/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!name && !hasCkId) return;
    setBusy(true);
    try {
      await createWhatIAteToday({
        food_name: name || "Menu item",
        menu_item_id: hasCkId ? ckId : undefined,
        eaten_on: whatIAteTodayLocalDate(),
        meal_period: defaultWhatIAteMealPeriod(),
      });
      setNotice("Added to What I Ate Today.");
    } catch (err) {
      setError(err.message || "Could not add. Try again from your profile.");
    } finally {
      setBusy(false);
    }
  }

  if (!name && !hasCkId) return null;

  return (
    <div data-testid="what-i-ate-today-add" style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        style={btnStyle}
      >
        {busy ? "Adding…" : "Add to What I Ate Today"}
      </button>
      {notice ? <p style={okStyle}>{notice}</p> : null}
      {error ? <p style={errStyle}>{error}</p> : null}
    </div>
  );
}

const btnStyle = {
  appearance: "none",
  border: "1px solid rgba(34,197,94,0.45)",
  background: "rgba(34,197,94,0.12)",
  color: "#86efac",
  fontWeight: 800,
  fontSize: 13,
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
};

const okStyle = { margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "#86efac" };
const errStyle = { margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "#fca5a5" };
