/**
 * Fast restaurant-scoped menu item picker for diner order feedback.
 * Selects existing Menuply menu items (or unmatched fallback). Does not create menu rows.
 */

import React, { useEffect, useRef, useState } from "react";
import { getOrderFeedbackMenuCandidates } from "../../lib/consumerApi.js";

const MAX_ITEMS = 3;

function itemKey(item) {
  if (item?.canonical_menu_item_id) return `ck:${item.canonical_menu_item_id}`;
  return `name:${String(item?.display_name || "").trim().toLowerCase()}`;
}

function sameItem(a, b) {
  return itemKey(a) === itemKey(b);
}

export default function OrderFeedbackMenuItemPicker({
  orderId,
  initialItems = [],
  selected,
  onChange,
}) {
  const [prior, setPrior] = useState([]);
  const [matches, setMatches] = useState([]);
  const [query, setQuery] = useState("");
  const [unmatched, setUnmatched] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [searchError, setSearchError] = useState("");
  const timer = useRef(null);
  const abort = useRef(null);

  useEffect(() => {
    if (!orderId) return undefined;
    let cancelled = false;
    setLoading(true);
    getOrderFeedbackMenuCandidates(orderId)
      .then((data) => {
        if (cancelled) return;
        setPrior(Array.isArray(data.prior) ? data.prior : []);
      })
      .catch(() => {
        if (!cancelled) setPrior([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (abort.current) abort.current.abort();
    };
  }, []);

  const seeded = (initialItems || [])
    .map((item) => ({
      canonical_menu_item_id: item.canonical_menu_item_id || null,
      display_name: item.name || item.display_name || "",
      source: "order_item",
    }))
    .filter((item) => item.display_name);
  const priorList = (prior.length ? prior : seeded).slice(0, 12);

  function updateSelected(next) {
    onChange(next.slice(0, MAX_ITEMS));
  }

  function selectItem(item) {
    if (!item?.display_name) return;
    if (selected.some((row) => sameItem(row, item))) return;
    if (selected.length >= MAX_ITEMS) return;
    updateSelected([
      ...selected,
      {
        canonical_menu_item_id: item.canonical_menu_item_id || null,
        unmatched_item_name: item.canonical_menu_item_id ? null : item.display_name,
        display_name: item.display_name,
        source: item.source || (item.canonical_menu_item_id ? "menu_search" : "unmatched"),
        rating: null,
        comment: "",
      },
    ]);
    setQuery("");
    setMatches([]);
    setUnmatched("");
  }

  function removeItem(item) {
    updateSelected(selected.filter((row) => !sameItem(row, item)));
  }

  function patchItem(item, patch) {
    updateSelected(
      selected.map((row) => (sameItem(row, item) ? { ...row, ...patch } : row))
    );
  }

  function runSuggest(q) {
    if (timer.current) clearTimeout(timer.current);
    if (abort.current) abort.current.abort();
    const value = String(q || "").trim();
    if (value.length < 2 || !orderId) {
      setMatches([]);
      setSuggesting(false);
      setSearchError("");
      return;
    }
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      abort.current = controller;
      const kill = setTimeout(() => controller.abort(), 800);
      setSuggesting(true);
      setSearchError("");
      try {
        const data = await getOrderFeedbackMenuCandidates(orderId, value, {
          signal: controller.signal,
        });
        setMatches(Array.isArray(data.matches) ? data.matches : []);
      } catch {
        setMatches([]);
        setSearchError("Menu search is taking too long — you can still add the dish by name.");
      } finally {
        clearTimeout(kill);
        setSuggesting(false);
      }
    }, 150);
  }

  const atLimit = selected.length >= MAX_ITEMS;
  const visiblePrior = priorList.filter(
    (item) => !selected.some((row) => sameItem(row, item))
  );
  const visibleMatches = matches.filter(
    (item) => !selected.some((row) => sameItem(row, item))
  );

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>What did you try?</h2>
      <p style={styles.muted}>
        Select up to 3 dishes from this restaurant&apos;s Menuply menu. One or
        two is fine. Feedback stays tied to those items — not a separate menu.
      </p>

      {loading && !priorList.length ? (
        <p style={styles.muted}>Loading dishes from this order…</p>
      ) : null}

      {visiblePrior.length ? (
        <div>
          <div style={styles.chipLabel}>From your order and activity</div>
          <div style={styles.chips}>
            {visiblePrior.map((item) => (
              <button
                key={itemKey(item)}
                type="button"
                disabled={atLimit}
                onClick={() => selectItem(item)}
                style={{
                  ...styles.chip,
                  opacity: atLimit ? 0.5 : 1,
                  cursor: atLimit ? "not-allowed" : "pointer",
                }}
              >
                {item.display_name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label style={styles.searchLabel}>
        Search this restaurant&apos;s menu
        <input
          type="search"
          value={query}
          disabled={atLimit}
          placeholder="Chicken Sandwich, Birria Tacos, Spicy Ramen…"
          onChange={(e) => {
            setQuery(e.target.value);
            runSuggest(e.target.value);
          }}
          style={styles.input}
        />
      </label>
      {suggesting ? <p style={styles.muted}>Searching…</p> : null}
      {searchError ? <p style={styles.hint}>{searchError}</p> : null}
      {query.trim().length >= 2 && !suggesting && visibleMatches.length === 0 ? (
        <p style={styles.hint}>
          No matching Menuply menu item. Add the dish by name below — we will
          not create a new menu item.
        </p>
      ) : null}
      {visibleMatches.length ? (
        <div style={styles.matchList}>
          {visibleMatches.map((item) => (
            <button
              key={itemKey(item)}
              type="button"
              disabled={atLimit}
              onClick={() => selectItem(item)}
              style={styles.matchBtn}
            >
              {item.display_name}
            </button>
          ))}
        </div>
      ) : null}

      <label style={styles.searchLabel}>
        Can&apos;t find it? Add what you ate
        <span style={styles.fallbackRow}>
          <input
            type="text"
            value={unmatched}
            disabled={atLimit}
            maxLength={160}
            placeholder="Dish name"
            onChange={(e) => setUnmatched(e.target.value)}
            style={{ ...styles.input, marginBottom: 0 }}
          />
          <button
            type="button"
            disabled={atLimit || !unmatched.trim()}
            onClick={() =>
              selectItem({
                display_name: unmatched.trim(),
                canonical_menu_item_id: null,
                source: "unmatched",
              })
            }
            style={styles.addBtn}
          >
            Add
          </button>
        </span>
      </label>
      <p style={styles.hint}>
        {selected.length}/{MAX_ITEMS} selected. You can submit without selecting
        three.
      </p>

      {selected.length ? (
        <div style={styles.selectedList}>
          {selected.map((item) => (
            <div key={itemKey(item)} style={styles.selectedCard}>
              <div style={styles.selectedHead}>
                <div>
                  <div style={styles.selectedName}>{item.display_name}</div>
                  <div style={styles.selectedMeta}>
                    {item.canonical_menu_item_id
                      ? "Linked to this restaurant's menu"
                      : "Not matched to a Menuply menu item"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
              <div style={styles.stars} role="group" aria-label={`${item.display_name} rating`}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = item.rating != null && n <= item.rating;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star${n === 1 ? "" : "s"} for ${item.display_name}`}
                      onClick={() =>
                        patchItem(item, { rating: item.rating === n ? null : n })
                      }
                      style={{
                        ...styles.starBtn,
                        color: active ? "#f59e0b" : "#64748b",
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
              <textarea
                value={item.comment || ""}
                rows={2}
                maxLength={1000}
                placeholder="What did you think of this dish? (optional)"
                onChange={(e) => patchItem(item, { comment: e.target.value })}
                style={styles.textarea}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 18,
    fontWeight: 800,
  },
  muted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.45,
    margin: "6px 0 12px",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#cbd5e1",
    marginBottom: 8,
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "inherit",
  },
  searchLabel: {
    display: "grid",
    gap: 8,
    margin: "0 0 10px",
    fontWeight: 700,
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: "10px 12px",
    fontFamily: "inherit",
    fontSize: 15,
  },
  fallbackRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
  },
  addBtn: {
    border: "none",
    borderRadius: 999,
    background: "#334155",
    color: "#fff",
    fontWeight: 800,
    padding: "10px 14px",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  matchList: {
    display: "grid",
    gap: 6,
    margin: "0 0 12px",
  },
  matchBtn: {
    textAlign: "left",
    border: "1px solid #334155",
    background: "#111827",
    color: "#e2e8f0",
    borderRadius: 12,
    padding: "10px 12px",
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  },
  selectedList: {
    display: "grid",
    gap: 10,
    marginTop: 8,
  },
  selectedCard: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid #334155",
    background: "#111827",
  },
  selectedHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },
  selectedName: {
    fontWeight: 800,
    fontSize: 16,
  },
  selectedMeta: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 12,
  },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#86efac",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  stars: {
    display: "flex",
    gap: 2,
    margin: "10px 0",
  },
  starBtn: {
    background: "transparent",
    border: "none",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 2px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    padding: 12,
    fontFamily: "inherit",
    fontSize: 14,
    resize: "vertical",
  },
};
