import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  applyPhotoBotImport,
  previewPhotoBotImport,
  searchMenuConsoleRestaurants,
} from "../../lib/ownerApi.js";

/**
 * Photo Bot — copy dish photos from a restaurant's online ordering site
 * (Square Online today) into Menu Manager dish photos.
 *   1. Pick the restaurant + paste the ordering page URL
 *   2. Review suggested matches (change or skip any) — nothing is written yet
 *   3. Import the checked photos
 */

const FILTERS = [
  { id: "selected", label: "Will import" },
  { id: "unmatched", label: "No match yet" },
  { id: "all", label: "All photos" },
];

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${OWNER_COLORS.line}`,
  borderRadius: 10,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 14,
};

function primaryButtonStyle({ busy = false, disabled = false } = {}) {
  return {
    border: "none",
    background: OWNER_COLORS.accent,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
    opacity: disabled ? 0.45 : busy ? 0.7 : 1,
  };
}

const secondaryButtonStyle = {
  border: `1px solid ${OWNER_COLORS.line}`,
  background: "#fff",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: OWNER_COLORS.ink };
const mutedStyle = { color: OWNER_COLORS.muted, fontSize: 13 };

function thumbUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.searchParams.has("width")) u.searchParams.set("width", "160");
    return u.toString();
  } catch {
    return url;
  }
}

const ACTION_LABELS = {
  added_primary: "Added as main photo",
  added_secondary: "Added as extra photo",
  skipped_already_imported: "Already imported",
  skipped_duplicate: "Skipped (same photo picked twice)",
  error: "Failed",
};

export default function OwnerPhotoBot() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [sourceUrl, setSourceUrl] = useState("");

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [choices, setChoices] = useState({}); // image_id -> { menu_item_id, checked }
  const [filter, setFilter] = useState("selected");
  const [result, setResult] = useState(null);

  async function run(kind, fn) {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  async function handleSearch(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError("");
    try {
      const data = await searchMenuConsoleRestaurants({ q, limit: 8 });
      setSearchResults(data?.restaurants || []);
    } catch (err) {
      setError(err?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function chooseRestaurant(r) {
    setRestaurant(r);
    setSearchResults(null);
    setPreview(null);
    setResult(null);
  }

  function handlePreview(e) {
    e?.preventDefault();
    if (!restaurant || !sourceUrl.trim()) return;
    run("preview", async () => {
      setResult(null);
      const data = await previewPhotoBotImport(restaurant.id, { url: sourceUrl.trim() });
      const next = {};
      for (const row of data.rows || []) {
        if (!row.image_url) continue;
        next[row.image_id] = {
          menu_item_id: row.suggested_menu_item_id || "",
          checked: Boolean(row.suggested_menu_item_id) && !row.already_imported,
        };
      }
      setChoices(next);
      setPreview(data);
      setFilter("selected");
    });
  }

  function setChoice(imageId, patch) {
    setChoices((prev) => {
      const cur = prev[imageId] || { menu_item_id: "", checked: false };
      const merged = { ...cur, ...patch };
      if ("menu_item_id" in patch) merged.checked = Boolean(patch.menu_item_id);
      return { ...prev, [imageId]: merged };
    });
  }

  const photoRows = useMemo(() => (preview?.rows || []).filter((r) => r.image_url), [preview]);

  const menuGroups = useMemo(() => {
    const groups = new Map();
    for (const mi of preview?.menu_items || []) {
      const key = mi.menu_name || `Menu ${mi.menu_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(mi);
    }
    // Alphabetical within each menu so items are easy to find in the dropdown.
    const byName = (a, b) =>
      String(a.item_name || "").localeCompare(String(b.item_name || ""), undefined, { sensitivity: "base", numeric: true });
    return [...groups.entries()].map(([menuName, items]) => [menuName, [...items].sort(byName)]);
  }, [preview]);

  const selections = useMemo(
    () =>
      photoRows
        .filter((r) => !r.already_imported && choices[r.image_id]?.checked && choices[r.image_id]?.menu_item_id)
        .map((r) => ({ image_id: r.image_id, menu_item_id: Number(choices[r.image_id].menu_item_id) })),
    [photoRows, choices]
  );

  const duplicateItemIds = useMemo(() => {
    const seen = new Map();
    for (const s of selections) seen.set(s.menu_item_id, (seen.get(s.menu_item_id) || 0) + 1);
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id));
  }, [selections]);

  const visibleRows = useMemo(() => {
    if (filter === "selected") return photoRows.filter((r) => !r.already_imported && choices[r.image_id]?.checked);
    if (filter === "unmatched") return photoRows.filter((r) => !r.already_imported && !choices[r.image_id]?.menu_item_id);
    return photoRows;
  }, [filter, photoRows, choices]);

  function handleImport() {
    if (!selections.length) return;
    run("apply", async () => {
      const data = await applyPhotoBotImport(restaurant.id, { url: sourceUrl.trim(), selections });
      setResult(data);
      const imported = new Set(
        (data.results || [])
          .filter((r) => r.action === "added_primary" || r.action === "added_secondary" || r.action === "skipped_already_imported")
          .map((r) => r.image_id)
      );
      setPreview((p) =>
        p ? { ...p, rows: p.rows.map((r) => (imported.has(r.image_id) ? { ...r, already_imported: true } : r)) } : p
      );
      setChoices((prev) => {
        const next = { ...prev };
        for (const id of imported) if (next[id]) next[id] = { ...next[id], checked: false };
        return next;
      });
    });
  }

  const alreadyImportedCount = photoRows.filter((r) => r.already_imported).length;

  return (
    <OwnerLayout title="Photo Bot">
      <div style={{ display: "grid", gap: 20 }}>
        <PageCard style={{ padding: 20 }}>
          <SectionTitle
            title="Restaurant and photo source"
            subtitle="Copies dish photos from the restaurant's online ordering page into Menu Manager. Square Online pages are supported today."
          />

          {restaurant ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{restaurant.name}</div>
                <div style={mutedStyle}>
                  #{restaurant.id}
                  {restaurant.city ? ` · ${restaurant.city}${restaurant.state ? `, ${restaurant.state}` : ""}` : ""}
                </div>
              </div>
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => {
                  setRestaurant(null);
                  setPreview(null);
                  setResult(null);
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <form onSubmit={handleSearch} style={{ marginBottom: 16 }}>
              <label style={labelStyle} htmlFor="photo-bot-restaurant">Restaurant</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  id="photo-bot-restaurant"
                  style={{ ...inputStyle, flex: "1 1 220px", width: "auto" }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Restaurant name or ID"
                />
                <button type="submit" style={primaryButtonStyle({ busy: searching, disabled: !query.trim() })} disabled={!query.trim() || searching}>
                  {searching ? "Searching…" : "Search"}
                </button>
              </div>
              {searchResults ? (
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  {searchResults.length === 0 ? (
                    <div style={mutedStyle}>No restaurants found.</div>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => chooseRestaurant(r)}
                        style={{ ...secondaryButtonStyle, textAlign: "left", fontWeight: 400 }}
                      >
                        <span style={{ fontWeight: 700 }}>{r.name}</span>{" "}
                        <span style={mutedStyle}>
                          #{r.id}
                          {r.city ? ` · ${r.city}${r.state ? `, ${r.state}` : ""}` : ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </form>
          )}

          <form onSubmit={handlePreview}>
            <label style={labelStyle} htmlFor="photo-bot-url">Ordering page URL</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                id="photo-bot-url"
                style={{ ...inputStyle, flex: "1 1 280px", width: "auto" }}
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://www.example.com/s/order"
                inputMode="url"
              />
              <button
                type="submit"
                style={primaryButtonStyle({ busy: busy === "preview", disabled: !restaurant || !sourceUrl.trim() })}
                disabled={!restaurant || !sourceUrl.trim() || Boolean(busy)}
              >
                {busy === "preview" ? "Finding photos…" : "Find photos"}
              </button>
            </div>
            <div style={{ ...mutedStyle, marginTop: 8 }}>
              Only use photos the restaurant owns or has permission to use. DoorDash, Uber Eats and Grubhub are not supported.
            </div>
          </form>

          {error ? (
            <div style={{ marginTop: 14, color: "#b42318", fontSize: 14, fontWeight: 600 }}>{error}</div>
          ) : null}
        </PageCard>

        {result ? (
          <PageCard style={{ padding: 20 }}>
            <SectionTitle
              title="Import finished"
              subtitle={Object.entries(result.counts || {})
                .map(([k, n]) => `${ACTION_LABELS[k] || k}: ${n}`)
                .join(" · ")}
              action={
                <Link to="/owner/menu-manager" style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}>
                  Open Menu Manager
                </Link>
              }
            />
            {(result.results || []).filter((r) => r.action === "error").length ? (
              <div style={{ display: "grid", gap: 6 }}>
                {result.results
                  .filter((r) => r.action === "error")
                  .map((r, i) => (
                    <div key={`${r.image_id}-${i}`} style={{ fontSize: 13 }}>
                      <strong>{r.source_name || r.image_id}</strong> → {r.menu_item_name || `#${r.menu_item_id}`}:{" "}
                      <span style={{ color: "#b42318" }}>{r.error}</span>
                    </div>
                  ))}
              </div>
            ) : null}
          </PageCard>
        ) : null}

        {preview ? (
          <PageCard style={{ padding: 20 }}>
            <SectionTitle
              title="Review matches"
              subtitle={`${preview.restaurant?.restaurant_name}: ${photoRows.length} photos on ${preview.source?.label || "the site"}, ${preview.counts?.menu_items ?? 0} items in Menu Manager${
                alreadyImportedCount ? `, ${alreadyImportedCount} already imported` : ""
              }. Nothing is saved until you import.`}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  style={{
                    ...secondaryButtonStyle,
                    padding: "6px 12px",
                    fontSize: 13,
                    background: filter === f.id ? OWNER_COLORS.accentSoft : "#fff",
                    borderColor: filter === f.id ? OWNER_COLORS.accent : OWNER_COLORS.line,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {visibleRows.length === 0 ? (
              <EmptyState>No photos in this view.</EmptyState>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {visibleRows.map((row) => {
                  const choice = choices[row.image_id] || { menu_item_id: "", checked: false };
                  const dup = choice.checked && duplicateItemIds.has(Number(choice.menu_item_id));
                  return (
                    <div
                      key={row.image_id}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 12,
                        padding: 10,
                        borderRadius: 12,
                        border: `1px solid ${OWNER_COLORS.line}`,
                        background: "#fff",
                        opacity: row.already_imported ? 0.6 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Import photo for ${row.source_name}`}
                        checked={Boolean(choice.checked) && !row.already_imported}
                        disabled={row.already_imported || !choice.menu_item_id}
                        onChange={(e) => setChoice(row.image_id, { checked: e.target.checked })}
                        style={{ width: 18, height: 18 }}
                      />
                      <img
                        src={thumbUrl(row.image_url)}
                        alt={row.source_name}
                        loading="lazy"
                        style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, flex: "0 0 auto", background: OWNER_COLORS.page }}
                      />
                      <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{row.source_name}</div>
                        <div style={mutedStyle}>
                          {row.already_imported
                            ? "Already imported"
                            : row.suggested_menu_item_id
                              ? `Suggested match · ${Math.round(row.score * 100)}%`
                              : row.candidates?.[0]
                                ? `Closest: ${row.candidates[0].item_name} · ${Math.round(row.candidates[0].score * 100)}%`
                                : "No close match"}
                        </div>
                      </div>
                      <select
                        aria-label={`Menu item for ${row.source_name}`}
                        value={choice.menu_item_id}
                        disabled={row.already_imported}
                        onChange={(e) => setChoice(row.image_id, { menu_item_id: e.target.value })}
                        style={{ ...inputStyle, flex: "1 1 220px", width: "auto", borderColor: dup ? "#b42318" : OWNER_COLORS.line }}
                      >
                        <option value="">Don't import</option>
                        {menuGroups.map(([menuName, items]) => (
                          <optgroup key={menuName} label={menuName}>
                            {items.map((mi) => (
                              <option key={mi.id} value={mi.id}>
                                {mi.item_name}
                                {mi.active_photo_count ? ` (has ${mi.active_photo_count} photo${mi.active_photo_count > 1 ? "s" : ""})` : ""}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {dup ? (
                        <div style={{ flexBasis: "100%", color: "#b42318", fontSize: 12 }}>
                          Another photo is also going to this item. Both will be added.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 16 }}>
              <button
                type="button"
                style={primaryButtonStyle({ busy: busy === "apply", disabled: !selections.length })}
                disabled={!selections.length || Boolean(busy)}
                onClick={handleImport}
              >
                {busy === "apply"
                  ? `Importing ${selections.length} photo${selections.length === 1 ? "" : "s"}…`
                  : `Import ${selections.length} photo${selections.length === 1 ? "" : "s"}`}
              </button>
              <div style={mutedStyle}>
                A photo becomes the main photo only when the item has none. You can fix anything later in Menu Manager.
              </div>
            </div>
          </PageCard>
        ) : null}
      </div>
    </OwnerLayout>
  );
}
