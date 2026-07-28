/**
 * Platform-owner panel: pick a restaurant and set its public Restaurant Style.
 * Uses live owner API (not operator draft/publish).
 */
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import RestaurantStyleSelector from "../../components/operator/RestaurantStyleSelector.jsx";
import {
  getOwnerRestaurantProfileStyle,
  searchMenuConsoleRestaurants,
  updateOwnerRestaurantProfileStyle,
} from "../../lib/ownerApi.js";
import { getProfileStyleTokens } from "../../lib/restaurantProfileStyles.js";
import { restaurantPathFromRow } from "../../lib/canonicalUrl.js";

const SEARCH_LIMIT = 10;

export default function OwnerRestaurantStylePanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [styleState, setStyleState] = useState(null);
  const [draftKey, setDraftKey] = useState(null);
  const [loadingStyle, setLoadingStyle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const searchTimeout = useRef(null);
  const searchSeq = useRef(0);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  function runSearch(q) {
    const trimmed = String(q || "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchErr("");
      setSearching(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    setSearchErr("");
    searchMenuConsoleRestaurants({ q: trimmed, limit: SEARCH_LIMIT })
      .then((res) => {
        if (seq !== searchSeq.current) return;
        setResults(Array.isArray(res?.restaurants) ? res.restaurants : []);
      })
      .catch((err) => {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSearchErr(err?.message || "Search failed.");
      })
      .finally(() => {
        if (seq === searchSeq.current) setSearching(false);
      });
  }

  function onQueryChange(value) {
    setQuery(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(value), 280);
  }

  async function selectRestaurant(restaurant) {
    const id = restaurant?.id || restaurant?.restaurant_id;
    if (!id) return;
    setSelected({
      id,
      name: restaurant.name || restaurant.restaurant_name || `Restaurant #${id}`,
      city: restaurant.city || "",
      state: restaurant.state || "",
    });
    setResults([]);
    setQuery("");
    setMessage("");
    setError("");
    setLoadingStyle(true);
    try {
      const res = await getOwnerRestaurantProfileStyle(id);
      const row = res.restaurant || {};
      setStyleState(row);
      setDraftKey(row.profile_style_key ?? null);
    } catch (err) {
      setStyleState(null);
      setDraftKey(null);
      setError(err?.message || "Could not load Restaurant Style.");
    } finally {
      setLoadingStyle(false);
    }
  }

  function clearSelection() {
    setSelected(null);
    setStyleState(null);
    setDraftKey(null);
    setMessage("");
    setError("");
  }

  async function handleSave() {
    if (!selected?.id) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await updateOwnerRestaurantProfileStyle(selected.id, draftKey);
      const row = res.restaurant || {};
      setStyleState((prev) => ({
        ...(prev || {}),
        ...row,
      }));
      setDraftKey(row.profile_style_key ?? null);
      setMessage(res.message || "Saved.");
    } catch (err) {
      setError(err?.message || "Could not save Restaurant Style.");
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    selected &&
    styleState &&
    (draftKey ?? null) !== (styleState.profile_style_key ?? null);

  const publicHref =
    restaurantPathFromRow({
      id: selected?.id,
      slug: styleState?.slug,
      city: styleState?.city || selected?.city,
      state: styleState?.state || selected?.state,
    }) || (selected?.id ? `/restaurants/${selected.id}` : null);

  return (
    <section style={{ marginBottom: 28 }} data-testid="owner-restaurant-style-panel">
      <SectionTitle
        title="Restaurant Style"
        subtitle="Set the public profile background atmosphere for any restaurant. Changes apply live (no operator Publish step)."
      />
      <PageCard style={{ padding: 22 }}>
        {!selected ? (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted, marginBottom: 6 }}>
              Find a restaurant
            </label>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by name, city, or id…"
              data-testid="owner-style-restaurant-search"
              style={{
                width: "100%",
                maxWidth: 480,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${OWNER_COLORS.line}`,
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            {searching ? (
              <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Searching…</div>
            ) : null}
            {searchErr ? (
              <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c" }}>{searchErr}</div>
            ) : null}
            {results.length ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8, maxWidth: 520 }}>
                {results.map((r) => {
                  const id = r.id || r.restaurant_id;
                  const name = r.name || r.restaurant_name || `Restaurant #${id}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectRestaurant(r)}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: `1px solid ${OWNER_COLORS.line}`,
                        background: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: OWNER_COLORS.ink }}>{name}</div>
                      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                        #{id}
                        {r.city || r.state ? ` · ${[r.city, r.state].filter(Boolean).join(", ")}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: OWNER_COLORS.ink }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
                  #{selected.id}
                  {selected.city || selected.state
                    ? ` · ${[selected.city, selected.state].filter(Boolean).join(", ")}`
                    : ""}
                  {styleState?.effective_profile_style
                    ? ` · Live: ${getProfileStyleTokens(styleState.effective_profile_style).name}`
                    : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {publicHref ? (
                  <Link
                    to={publicHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${OWNER_COLORS.line}`,
                      background: "#fff",
                      color: OWNER_COLORS.ink,
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    View public profile
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={clearSelection}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${OWNER_COLORS.line}`,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Change restaurant
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  data-testid="owner-style-save"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: dirty ? OWNER_COLORS.accent : "#d6d3d1",
                    color: "#fff",
                    cursor: dirty && !saving ? "pointer" : "default",
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save style"}
                </button>
              </div>
            </div>

            {loadingStyle ? (
              <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>Loading style…</div>
            ) : styleState ? (
              <RestaurantStyleSelector
                profileStyleKey={draftKey}
                category={styleState.category || ""}
                cuisine={styleState.cuisine || ""}
                restaurantName={selected.name}
                onChange={setDraftKey}
              />
            ) : null}

            {message ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {message}
              </div>
            ) : null}
            {error ? (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            ) : null}
          </div>
        )}
      </PageCard>
    </section>
  );
}
