import React, { useState } from "react";
import { PLACE_ADDRESS_MAX, PLACE_CITY_MAX, PLACE_STATE_MAX } from "../lib/unlistedPlace.js";

/**
 * Where a restaurant not on Menuply yet is (Andre 2026-11-07): city + state, and a street address
 * only if the diner opens it. All optional; the invite shows whatever is filled in.
 * Limits match mig 0400 (city 80, state 40, street 200).
 */
export default function UnlistedPlaceLocation({ placeName, value, onChange }) {
  const [showStreet, setShowStreet] = useState(Boolean(value?.address));
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  return (
    <div style={styles.wrap} data-testid="unlisted-place-location">
      <div style={styles.label}>Where is {placeName || "it"}? (optional)</div>
      <div style={styles.row}>
        <input
          type="text"
          value={value?.city || ""}
          onChange={set("city")}
          placeholder="City"
          maxLength={PLACE_CITY_MAX}
          autoComplete="address-level2"
          aria-label="City"
          data-testid="unlisted-place-city"
          style={{ ...styles.input, flex: 2 }}
        />
        <input
          type="text"
          value={value?.state || ""}
          onChange={set("state")}
          placeholder="State"
          maxLength={PLACE_STATE_MAX}
          autoComplete="address-level1"
          aria-label="State"
          data-testid="unlisted-place-state"
          style={{ ...styles.input, flex: 1 }}
        />
      </div>
      {showStreet ? (
        <input
          type="text"
          value={value?.address || ""}
          onChange={set("address")}
          placeholder="Street address"
          maxLength={PLACE_ADDRESS_MAX}
          autoComplete="address-line1"
          aria-label="Street address"
          data-testid="unlisted-place-address"
          style={styles.input}
          autoFocus
        />
      ) : (
        <button type="button" onClick={() => setShowStreet(true)} style={styles.add} data-testid="unlisted-place-add-street">
          + Add street address
        </button>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 8, marginTop: 12 },
  label: { fontSize: 13, fontWeight: 700, color: "#292524" },
  row: { display: "flex", gap: 8 },
  input: {
    minWidth: 0,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d6d3d1",
    fontSize: 15,
    fontFamily: "inherit",
    background: "#fff",
    color: "#1c1917",
  },
  add: {
    justifySelf: "start",
    padding: 0,
    border: "none",
    background: "none",
    color: "#1c1917",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
  },
};
