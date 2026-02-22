// menubloc-frontend/src/components/SearchResultCard.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function pickFirst(obj, keys, fallback = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
}

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// highlight query matches inside text
function highlight(text, query) {
  const t = asStr(text);
  const q = asStr(query).trim();
  if (!t || !q) return t;

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = t.split(re);
  if (parts.length <= 1) return t;

  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{
          background: "#fff3a0",
          padding: "0 2px",
          borderRadius: 3,
          fontWeight: 900,
        }}
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function SearchResultCard({ item, query }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState("insights"); // insights | nutrition | pairings

  // IDs for linking
  const restaurantId = useMemo(() => asStr(pickFirst(item, ["restaurant_id", "restaurantId"], "")), [item]);
  const menuItemId = useMemo(() => asStr(pickFirst(item, ["menu_item_id", "menuItemId"], "")), [item]);

  const restaurantName = useMemo(
    () => asStr(pickFirst(item, ["restaurant_name", "restaurantName", "name", "title"], "Restaurant")),
    [item]
  );

  const dishName = useMemo(
    () => asStr(pickFirst(item, ["menu_item_name", "item_name", "dish", "menuItemName", "menu_item"], "")),
    [item]
  );

  const isDish = !!dishName;

  const priceRaw = useMemo(() => pickFirst(item, ["price", "item_price", "menu_item_price"], ""), [item]);
  const price = useMemo(() => (isDish ? money(priceRaw) : ""), [isDish, priceRaw]);

  const city = useMemo(() => asStr(pickFirst(item, ["city"], "")), [item]);
  const state = useMemo(() => asStr(pickFirst(item, ["state"], "")), [item]);
  const address = useMemo(() => asStr(pickFirst(item, ["address", "address_line1", "address1"], "")), [item]);

  const cuisine = useMemo(() => asStr(pickFirst(item, ["cuisine", "cuisine_type"], "")), [item]);

  const snippet = useMemo(
    () => asStr(pickFirst(item, ["snippet", "description", "menu_item_description", "blurb"], "")),
    [item]
  );

  const insights = useMemo(() => {
    const vegan = !!item?.vegan || String(item?.is_vegan || item?.item_vegan || "").toLowerCase() === "true";
    const gf =
      !!item?.gluten_free || String(item?.is_gluten_free || item?.item_gluten_free || "").toLowerCase() === "true";
    const tags = [];
    if (vegan) tags.push("Vegan");
    if (gf) tags.push("Gluten-free");
    if (item?.deals || item?.has_deal || item?.has_active_deal) tags.push("Deal");
    if (cuisine) tags.unshift(cuisine);
    return tags.length ? tags.join(" · ") : "No insights yet (menu ingestion will add more).";
  }, [item, cuisine]);

  const nutrition = useMemo(() => {
    const calories = pickFirst(item, ["calories", "kcal"], "");
    const protein = pickFirst(item, ["protein_g", "protein"], "");
    const sodium = pickFirst(item, ["sodium_mg", "sodium"], "");
    return { calories, protein, sodium };
  }, [item]);

  const pairings = useMemo(() => {
    const c = String(cuisine || "").toLowerCase();
    if (c.includes("ital")) return ["Sparkling water", "Side salad", "Garlic bread"];
    if (c.includes("japan")) return ["Green tea", "Gyoza", "Side salad"];
    return ["Sparkling water", "Side salad", "Fruit"];
  }, [cuisine]);

  const chips = [
    { id: "insights", label: "Insights" },
    { id: "nutrition", label: "Nutrition" },
    { id: "pairings", label: "Pairings" },
  ];

  const styles = {
    card: {
      border: "1px solid #eee",
      borderRadius: 16,
      padding: 14,
      background: "#fff",
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      cursor: "pointer",
    },
    topRow: { display: "flex", justifyContent: "space-between", gap: 12 },
    titleRow: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
    title: { fontWeight: 900, fontSize: 14, lineHeight: 1.2, minWidth: 0 },
    sub: { fontSize: 12, color: "#666", marginTop: 4 },
    price: { fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" },
    snippet: { marginTop: 10, fontSize: 12, color: "#333" },
    chipRow: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
    chip: (active) => ({
      padding: "6px 10px",
      borderRadius: 999,
      border: active ? "1px solid #111" : "1px solid #e5e5e5",
      fontSize: 12,
      fontWeight: 800,
      background: active ? "#fff" : "transparent",
      userSelect: "none",
    }),
    panel: {
      marginTop: 10,
      borderTop: "1px solid #f0f0f0",
      paddingTop: 10,
      fontSize: 12,
      color: "#333",
    },
    mini: { color: "#666", fontSize: 12, marginTop: 6 },
    caret: { fontSize: 12, color: "#777", flex: "none" },
    footer: { marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 },
    link: { fontSize: 12, fontWeight: 900, color: "#6b5cff", textDecoration: "none" },
    inlineLink: { fontWeight: 900, color: "#111", textDecoration: "underline" },
    restaurantLink: { fontWeight: 800, color: "#6b5cff", textDecoration: "underline" },
  };

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const locationLine = [address, city && state ? `${city}, ${state}` : city || state].filter(Boolean).join(" · ");

  const restaurantHref = restaurantId ? `/r/${restaurantId}` : null;
  const itemHref = restaurantId && menuItemId && isDish ? `/r/${restaurantId}/item/${menuItemId}` : null;

  const titleNode = isDish ? (
    itemHref ? (
      <Link to={itemHref} style={styles.inlineLink} onClick={(e) => e.stopPropagation()}>
        {highlight(dishName, query)}
      </Link>
    ) : (
      <span>{highlight(dishName, query)}</span>
    )
  ) : restaurantHref ? (
    <Link to={restaurantHref} style={styles.inlineLink} onClick={(e) => e.stopPropagation()}>
      {highlight(restaurantName, query)}
    </Link>
  ) : (
    <span>{highlight(restaurantName, query)}</span>
  );

  const restaurantNode =
    restaurantHref && restaurantName ? (
      <Link to={restaurantHref} style={styles.restaurantLink} onClick={(e) => e.stopPropagation()}>
        {highlight(restaurantName, query)}
      </Link>
    ) : (
      <span>{highlight(restaurantName, query)}</span>
    );

  return (
    <div
      style={styles.card}
      role="button"
      tabIndex={0}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
      aria-expanded={open}
    >
      <div style={styles.topRow}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.titleRow}>
            <div style={styles.title}>
              {titleNode} <span style={styles.caret}>{open ? "▲" : "▼"}</span>
            </div>
          </div>

          <div style={styles.sub}>
            {isDish
              ? [restaurantNode, city && state ? `${city}, ${state}` : city || state].filter(Boolean).join(" · ")
              : locationLine}
          </div>
        </div>

        <div style={styles.price}>{price}</div>
      </div>

      {snippet ? <div style={styles.snippet}>{highlight(snippet, query)}</div> : null}

      {/* Tabs */}
      <div style={styles.chipRow} onClick={stop}>
        {chips.map((c) => (
          <div
            key={c.id}
            style={styles.chip(panel === c.id)}
            onClick={() => setPanel(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setPanel(c.id);
              }
            }}
            aria-pressed={panel === c.id}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Expandable content */}
      {open && (
        <div style={styles.panel} onClick={stop}>
          {panel === "insights" && (
            <>
              <div style={{ fontWeight: 900 }}>Insights</div>
              <div style={styles.mini}>{insights}</div>
            </>
          )}

          {panel === "nutrition" && (
            <>
              <div style={{ fontWeight: 900 }}>Nutrition</div>
              <div style={styles.mini}>
                Calories: {nutrition.calories || "—"} · Protein: {nutrition.protein || "—"} · Sodium:{" "}
                {nutrition.sodium || "—"}
              </div>
              <div style={styles.mini}>Nutrition is a stub until Common Knowledge has item-level nutrition.</div>
            </>
          )}

          {panel === "pairings" && (
            <>
              <div style={{ fontWeight: 900 }}>Pairings</div>
              <div style={styles.mini}>{pairings.join(" · ")}</div>
              <div style={styles.mini}>Pairings are heuristic for now; we’ll upgrade after menu ingestion.</div>
            </>
          )}

          <div style={styles.footer}>
            {restaurantHref ? (
              <Link to={restaurantHref} style={styles.link} onClick={(e) => e.stopPropagation()}>
                View restaurant
              </Link>
            ) : (
              <a href="#" style={styles.link} onClick={stop}>
                View restaurant
              </a>
            )}

            {itemHref ? (
              <Link to={itemHref} style={styles.link} onClick={(e) => e.stopPropagation()}>
                View item
              </Link>
            ) : (
              <a href="#" style={styles.link} onClick={stop}>
                Save
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
