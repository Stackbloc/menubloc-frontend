import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { EmptyState, OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  getOwnerMenuUploads,
  searchOwnerRestaurantsForUpload,
  submitOwnerMenuTextIngest,
  submitOwnerMenuFilePdf,
  searchMenuConsoleRestaurants,
  getMenuConsoleRestaurantMenus,
  getMenuConsoleMenu,
  createMenuConsoleMenu,
  updateMenuConsoleMenu,
  publishMenuConsoleMenu,
  unpublishMenuConsoleMenu,
  deleteMenuConsoleMenu,
  addMenuConsoleItem,
  updateMenuConsoleItem,
  deleteMenuConsoleItem,
  searchMenuConsoleItems,
  bulkMenuConsoleItems,
} from "../../lib/ownerApi.js";

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#101828",
  boxSizing: "border-box",
  outline: "none",
};

const STATUS_BADGE = {
  draft:        { background: "#e8f0fe", color: "#1a56db" },
  published:    { background: "#f0fdf4", color: "#15803d" },
  archived:     { background: "#f3f4f6", color: "#6b7280" },
  removed:      { background: "#fef2f2", color: "#991b1b" },
  pending:      { background: "#fffbeb", color: "#92400e" },
  failed:       { background: "#fef2f2", color: "#991b1b" },
  needs_review: { background: "#fffbeb", color: "#92400e" },
};

function StatusChip({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.draft;
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      fontSize: 11, fontWeight: 700, ...s,
    }}>
      {status}
    </span>
  );
}

// ─── Upload Activity tab (unchanged logic, wrapped) ────────────────────────────

const UPLOAD_FILTERS = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending" },
  { key: "failed",       label: "Failed" },
  { key: "needs_review", label: "Needs Review" },
  { key: "published",    label: "Published" },
  { key: "today",        label: "Today" },
  { key: "last7days",    label: "Last 7 Days" },
];

const UPLOAD_COL_HEADS = ["Restaurant", "Email", "Type", "Status", "Items (inserted/parsed)", "Uploaded", "Location", ""];

function UploadActivityTab({ searchParams, setSearchParams, restaurantFilter }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const activeFilter = searchParams.get("status") || "all";

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (restaurantFilter?.id) params.restaurant_id = restaurantFilter.id;
    if (activeFilter === "today") params.today = "1";
    else if (activeFilter === "last7days") params.last7days = "1";
    else if (activeFilter !== "all") params.status = activeFilter;

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) { settled = true; setLoading(false); setError("The request took too long. Please refresh."); }
    }, 15000);

    getOwnerMenuUploads(params)
      .then((result) => { if (!settled) setData(result); })
      .catch(() => { if (!settled) setError("Upload data is temporarily unavailable."); })
      .finally(() => { settled = true; clearTimeout(timeout); setLoading(false); });

    return () => { settled = true; clearTimeout(timeout); };
  }, [activeFilter, restaurantFilter?.id]);

  function setFilter(key) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("status");
      next.delete("tab");
      if (key !== "all") next.set("status", key);
      next.set("tab", "uploads");
      return next;
    });
  }

  function onUploadSuccess() {
    setLoading(true);
    const params = restaurantFilter?.id ? { restaurant_id: restaurantFilter.id } : {};
    getOwnerMenuUploads(params)
      .then((result) => setData(result))
      .catch(() => setError("Upload data is temporarily unavailable."))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      {restaurantFilter && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 10,
          background: OWNER_COLORS.accentSoft, border: `1px solid ${OWNER_COLORS.accent}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.accent }}>
            Showing uploads for: {restaurantFilter.name}
            {restaurantFilter.city ? ` — ${restaurantFilter.city}, ${restaurantFilter.state}` : ""}
          </div>
        </div>
      )}
      {error ? <ErrorBanner message={error} /> : null}
      <NewUploadSection onSuccess={onUploadSuccess} initialRestaurant={restaurantFilter} />

      <SectionTitle
        title="Upload Activity"
        subtitle="All restaurant menu imports — filter by status or date."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {UPLOAD_FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "8px 14px", borderRadius: 10,
              border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
              background: active ? OWNER_COLORS.accentSoft : "#fff",
              color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
              fontWeight: active ? 700 : 600, fontSize: 13, cursor: "pointer",
            }}>{f.label}</button>
          );
        })}
      </div>

      <PageCard>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: OWNER_COLORS.muted, fontSize: 14 }}>Loading uploads…</div>
        ) : !data?.uploads?.length ? (
          <div style={{ padding: 24 }}><EmptyState>No uploads found for this filter.</EmptyState></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${OWNER_COLORS.line}` }}>
                  {UPLOAD_COL_HEADS.map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: OWNER_COLORS.muted, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{data.uploads.map((u) => <UploadRow key={u.id} upload={u} />)}</tbody>
            </table>
          </div>
        )}
      </PageCard>

      {data?.total > 0 && (
        <div style={{ marginTop: 12, color: OWNER_COLORS.muted, fontSize: 13, textAlign: "right" }}>
          Showing {data.uploads?.length ?? 0} of {data.total} uploads
        </div>
      )}
    </div>
  );
}

// ─── localStorage helpers for recent restaurants ──────────────────────────────

const RECENT_KEY = "mcRecentRestaurants";
const MAX_RECENT = 5;

function saveRecentRestaurant(r) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const next = [
      { id: r.id, name: r.name, city: r.city, state: r.state, lastViewed: new Date().toISOString() },
      ...prev.filter((x) => x.id !== r.id),
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function loadRecentRestaurants() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

// ─── Menu type tab definitions ────────────────────────────────────────────────

const MENU_TYPE_TABS = [
  { key: "main",       label: "Main" },
  { key: "breakfast",  label: "Breakfast" },
  { key: "lunch",      label: "Lunch" },
  { key: "dinner",     label: "Dinner" },
  { key: "kids",       label: "Kids" },
  { key: "happy_hour", label: "Happy Hour" },
  { key: "catering",   label: "Catering" },
  { key: "specials",   label: "Specials" },
];
const STANDARD_MENU_TYPES = new Set(MENU_TYPE_TABS.map((t) => t.key));
const SEARCH_LIMIT = 20;

const FILTER_CHIPS = [
  { key: "all",         label: "All" },
  { key: "has_menus",   label: "Has Menus" },
  { key: "no_menus",    label: "No Menus" },
  { key: "published",   label: "Published" },
  { key: "draft",       label: "Draft" },
  { key: "needs_review", label: "Needs Review" },
];

const ITEM_FILTER_CHIPS = [
  { key: "all",            label: "All Items" },
  { key: "published",      label: "Published" },
  { key: "draft",          label: "Draft" },
  { key: "hidden",         label: "Hidden" },
  { key: "needs_review",   label: "Needs Review" },
  { key: "modified_today", label: "Modified Today" },
  { key: "modified_7d",    label: "Last 7 Days" },
  { key: "modified_30d",   label: "Last 30 Days" },
];
const ITEM_SEARCH_LIMIT = 50;

// ─── Menu Manager tab ─────────────────────────────────────────────────────────

function MenuManagerTab({ selectedRestaurant, setSelectedRestaurant, searchParams, setSearchParams }) {
  // race-condition guard: each selectRestaurant call gets a version; stale responses are discarded
  const restaurantVersionRef = useRef(0);

  // ── search view state
  const [searchQ, setSearchQ]           = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = no search run yet
  const [searchTotal, setSearchTotal]   = useState(0);
  const [searchPage, setSearchPage]     = useState(1);
  const [searching, setSearching]       = useState(false);
  const [searchErr, setSearchErr]       = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const searchTimeout = useRef(null);

  // ── recent restaurants (localStorage)
  const [recentRestaurants, setRecentRestaurants] = useState(loadRecentRestaurants);

  // ── restaurant view state
  const [restaurantSummary, setRestaurantSummary] = useState(null); // { hidden_count, duplicate_count }
  const [menus, setMenus]               = useState([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [activeMenuType, setActiveMenuType] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menuDetail, setMenuDetail]     = useState(null);
  const [menuDetailLoading, setMenuDetailLoading] = useState(false);
  const [menuDetailErr, setMenuDetailErr] = useState("");

  // ── recent uploads (for selected restaurant)
  const [recentUploads, setRecentUploads] = useState([]);

  // ── item search state (within selected restaurant)
  const [itemQ, setItemQ]               = useState("");
  const [itemFilter, setItemFilter]     = useState("all");
  const [itemResults, setItemResults]   = useState(null); // null = not active
  const [itemTotal, setItemTotal]       = useState(0);
  const [itemPage, setItemPage]         = useState(1);
  const [itemSearching, setItemSearching] = useState(false);
  const [itemSearchErr, setItemSearchErr] = useState("");
  const itemSearchTimeout = useRef(null);

  // ── bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [bulkAction, setBulkAction]     = useState(null); // null | "move" | "change_section"
  const [bulkTargetMenuId, setBulkTargetMenuId] = useState("");
  const [bulkSectionInput, setBulkSectionInput] = useState("");
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [bulkErr, setBulkErr]           = useState("");

  // ── search
  function runSearch(q, page, filter) {
    if (!q || q.length < 2) { setSearchResults(null); return; }
    setSearching(true);
    setSearchErr("");
    searchMenuConsoleRestaurants({ q, page, limit: SEARCH_LIMIT, filter: filter ?? searchFilter })
      .then((data) => {
        setSearchResults(data.restaurants || []);
        setSearchTotal(data.total || 0);
      })
      .catch(() => setSearchErr("Search unavailable. Please try again."))
      .finally(() => setSearching(false));
  }

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchQ(q);
    setSearchPage(1);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(() => runSearch(q.trim(), 1, searchFilter), 300);
  }

  function handlePage(newPage) {
    setSearchPage(newPage);
    runSearch(searchQ, newPage, searchFilter);
  }

  function handleFilterChange(f) {
    setSearchFilter(f);
    setSearchPage(1);
    if (searchQ.trim().length >= 2) runSearch(searchQ.trim(), 1, f);
  }

  // ── item search (within selected restaurant)
  function resetItemSearch() {
    setItemQ("");
    setItemFilter("all");
    setItemResults(null);
    setItemTotal(0);
    setItemPage(1);
    setItemSearchErr("");
    setSelectedItemIds(new Set());
    setBulkAction(null);
    setBulkErr("");
  }

  function runItemSearch(q, page, filter, restaurantId) {
    const rId = restaurantId ?? selectedRestaurant?.id;
    if (!rId) return;
    const isActive = (q || "").trim().length >= 2 || filter !== "all";
    if (!isActive) { setItemResults(null); return; }
    setItemSearching(true);
    setItemSearchErr("");
    setSelectedItemIds(new Set());
    setBulkAction(null);
    searchMenuConsoleItems(rId, { q: q.trim(), filter, page, limit: ITEM_SEARCH_LIMIT })
      .then((data) => {
        setItemResults(data.items || []);
        setItemTotal(data.total || 0);
      })
      .catch(() => setItemSearchErr("Item search unavailable. Please try again."))
      .finally(() => setItemSearching(false));
  }

  function handleItemQChange(e) {
    const q = e.target.value;
    setItemQ(q);
    setItemPage(1);
    clearTimeout(itemSearchTimeout.current);
    itemSearchTimeout.current = setTimeout(() => runItemSearch(q, 1, itemFilter), 300);
  }

  function handleItemFilterChange(f) {
    setItemFilter(f);
    setItemPage(1);
    runItemSearch(itemQ, 1, f);
  }

  function handleItemPage(newPage) {
    setItemPage(newPage);
    runItemSearch(itemQ, newPage, itemFilter);
  }

  function handleSelectItem(id) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (!itemResults) return;
    const allIds = itemResults.map((r) => r.id);
    setSelectedItemIds((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }

  async function handleBulkOp(operation, extra = {}) {
    if (selectedItemIds.size === 0) return;
    setBulkLoading(true);
    setBulkErr("");
    try {
      await bulkMenuConsoleItems(selectedRestaurant.id, {
        operation,
        item_ids: [...selectedItemIds],
        ...extra,
      });
      setBulkAction(null);
      setBulkTargetMenuId("");
      setBulkSectionInput("");
      // Reload menus to refresh item counts and summary stats
      const menusData = await getMenuConsoleRestaurantMenus(selectedRestaurant.id);
      if (menusData.menus) setMenus(menusData.menus);
      if (menusData.summary) setRestaurantSummary(menusData.summary);
      runItemSearch(itemQ, itemPage, itemFilter);
    } catch (err) {
      setBulkErr(err?.payload?.error || err?.message || "Bulk operation failed.");
    } finally {
      setBulkLoading(false);
    }
  }

  // ── select a restaurant → enter restaurant view
  async function selectRestaurant(r) {
    restaurantVersionRef.current += 1;
    const myVersion = restaurantVersionRef.current;

    setSelectedRestaurant(r);
    setMenus([]);
    setRecentUploads([]);
    setSelectedMenuId(null);
    setMenuDetail(null);
    setMenuDetailErr("");
    setActiveMenuType(null);
    setMenusLoading(true);
    resetItemSearch();
    saveRecentRestaurant(r);
    setRecentRestaurants(loadRecentRestaurants());
    try {
      const [menuData, uploadData] = await Promise.allSettled([
        getMenuConsoleRestaurantMenus(r.id),
        getOwnerMenuUploads({ restaurant_id: r.id, limit: 50 }),
      ]);
      if (myVersion !== restaurantVersionRef.current) return; // stale — a newer selectRestaurant fired
      if (menuData.status === "fulfilled") {
        const data = menuData.value;
        if (data.restaurant) setSelectedRestaurant(data.restaurant);
        if (data.summary) setRestaurantSummary(data.summary);
        const loaded = data.menus || [];
        setMenus(loaded);
        const initial = loaded.find((m) => m.menu_type === "main") || loaded[0];
        if (initial) {
          setActiveMenuType(initial.menu_type || "main");
          loadMenu(initial.id, r.id);
        }
      }
      if (uploadData.status === "fulfilled") {
        setRecentUploads(uploadData.value.uploads || []);
      }
    } catch {
      if (myVersion !== restaurantVersionRef.current) return;
      setMenus([]);
    } finally {
      if (myVersion === restaurantVersionRef.current) setMenusLoading(false);
    }
  }

  // ── load a specific menu into the editor
  async function loadMenu(menuId, overrideRestaurantId) {
    setSelectedMenuId(menuId);
    setMenuDetail(null);
    setMenuDetailErr("");
    setMenuDetailLoading(true);
    const rId = overrideRestaurantId ?? selectedRestaurant?.id;
    try {
      const data = await getMenuConsoleMenu(rId, menuId);
      setMenuDetail(data);
    } catch (err) {
      setMenuDetailErr(err?.payload?.error || err?.message || "Could not load menu.");
    } finally {
      setMenuDetailLoading(false);
    }
  }

  function handleMenuTypeTab(typeKey) {
    setActiveMenuType(typeKey);
    const menu = typeKey === "__custom__"
      ? menus.find((m) => !STANDARD_MENU_TYPES.has(m.menu_type))
      : menus.find((m) => m.menu_type === typeKey);
    if (menu) loadMenu(menu.id);
  }

  // ── menu CRUD callbacks passed to editor
  function onMenuUpdated(updated) {
    setMenus((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
    if (menuDetail?.menu?.id === updated.id) {
      setMenuDetail((prev) => prev ? { ...prev, menu: { ...prev.menu, ...updated } } : prev);
    }
  }

  function onMenuDeleted(menuId) {
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
    if (selectedMenuId === menuId) { setSelectedMenuId(null); setMenuDetail(null); }
  }

  function onMenuCreated(newMenu) {
    setMenus((prev) => [...prev, newMenu]);
    setActiveMenuType(newMenu.menu_type || "main");
    loadMenu(newMenu.id);
  }

  function handleBack() {
    setSelectedRestaurant(null);
    setRestaurantSummary(null);
    setMenus([]);
    setSelectedMenuId(null);
    setMenuDetail(null);
    setActiveMenuType(null);
    setRecentUploads([]);
    resetItemSearch();
  }

  // Opens the menu that contains a search-result item, exiting item search mode.
  function handleJumpToMenu(item) {
    resetItemSearch();
    setActiveMenuType(item.menu_type || "main");
    loadMenu(item.menu_id);
  }

  // ── derived values
  const availableTypeTabs = [
    ...MENU_TYPE_TABS.filter((t) => menus.some((m) => m.menu_type === t.key)),
    ...(menus.some((m) => !STANDARD_MENU_TYPES.has(m.menu_type))
      ? [{ key: "__custom__", label: "Custom" }]
      : []),
  ];

  const menusOfActiveType = activeMenuType === "__custom__"
    ? menus.filter((m) => !STANDARD_MENU_TYPES.has(m.menu_type))
    : menus.filter((m) => m.menu_type === activeMenuType);

  const totalItems = menus.reduce((s, m) => s + (m.item_count || 0), 0);
  const publishedItems = menus
    .filter((m) => m.status === "published")
    .reduce((s, m) => s + (m.item_count || 0), 0);
  const draftItems = menus
    .filter((m) => m.status === "draft")
    .reduce((s, m) => s + (m.item_count || 0), 0);
  const lastMenuUpdated = menus.reduce((latest, m) => {
    if (!m.updated_at) return latest;
    return !latest || new Date(m.updated_at) > new Date(latest) ? m.updated_at : latest;
  }, null);
  const hiddenItems      = restaurantSummary?.hidden_count      ?? null;
  const duplicateCount   = restaurantSummary?.duplicate_count   ?? null;
  const needsReviewItems = restaurantSummary?.needs_review_count ?? null;

  const isItemSearchActive = itemQ.trim().length >= 2 || itemFilter !== "all";
  const totalPages = Math.ceil(searchTotal / SEARCH_LIMIT);
  const itemTotalPages = Math.ceil(itemTotal / ITEM_SEARCH_LIMIT);

  // ══════════════════════════════════════════════════════════════
  // SEARCH VIEW
  // ══════════════════════════════════════════════════════════════
  if (!selectedRestaurant) {
    return (
      <div>
        {/* Search bar */}
        <PageCard style={{ padding: "14px 18px", marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: OWNER_COLORS.muted, pointerEvents: "none",
            }}>🔍</span>
            <input
              type="text"
              value={searchQ}
              onChange={handleSearchChange}
              placeholder="Search by name, city, state, menu name, item name, or ID…"
              style={{ ...inputStyle, paddingLeft: 42, fontSize: 14 }}
              autoComplete="off"
              autoFocus
            />
            {searching && (
              <span style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 12, color: OWNER_COLORS.muted,
              }}>Searching…</span>
            )}
          </div>
          {searchErr && <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>{searchErr}</div>}
        </PageCard>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {FILTER_CHIPS.map((fc) => {
            const active = searchFilter === fc.key;
            return (
              <button
                key={fc.key}
                type="button"
                onClick={() => handleFilterChange(fc.key)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
                  border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                  background: active ? OWNER_COLORS.accentSoft : "#fff",
                  color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                  cursor: "pointer",
                }}
              >
                {fc.label}
              </button>
            );
          })}
        </div>

        {/* Continue Working — most recently opened restaurant */}
        {searchResults === null && recentRestaurants.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: OWNER_COLORS.muted, marginBottom: 10,
            }}>Continue Working</div>
            <div style={{
              padding: "14px 18px", borderRadius: 12,
              border: `1px solid ${OWNER_COLORS.accent}`,
              background: OWNER_COLORS.accentSoft,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink }}>
                  {recentRestaurants[0].name}
                </div>
                <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
                  {[recentRestaurants[0].city, recentRestaurants[0].state].filter(Boolean).join(", ")}
                  {recentRestaurants[0].lastViewed ? ` · ${formatDate(recentRestaurants[0].lastViewed)}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => selectRestaurant(recentRestaurants[0])}
                style={{
                  padding: "8px 18px", borderRadius: 9, flexShrink: 0,
                  background: OWNER_COLORS.accent, color: "#fff",
                  border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                Resume →
              </button>
            </div>
          </div>
        )}

        {/* Recent restaurants (all but the first, already shown in Continue Working) */}
        {searchResults === null && recentRestaurants.length > 1 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: OWNER_COLORS.muted, marginBottom: 10,
            }}>Recent</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {recentRestaurants.slice(1).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRestaurant(r)}
                  style={{
                    padding: "10px 16px", borderRadius: 10,
                    border: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: OWNER_COLORS.ink }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 2 }}>
                    {[r.city, r.state].filter(Boolean).join(", ")}
                    {r.lastViewed ? ` · ${formatDate(r.lastViewed)}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Idle empty state */}
        {searchResults === null && recentRestaurants.length === 0 && (
          <PageCard style={{ padding: 48 }}>
            <EmptyState>Search for a restaurant above to start managing menus.</EmptyState>
          </PageCard>
        )}

        {/* Search results grid */}
        {searchResults !== null && (
          <div>
            <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginBottom: 14 }}>
              {searching
                ? "Searching…"
                : searchTotal === 0
                  ? "No restaurants found."
                  : `${searchTotal.toLocaleString()} result${searchTotal !== 1 ? "s" : ""}`}
            </div>

            {searchResults.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                gap: 14, marginBottom: 20,
              }}>
                {searchResults.map((r) => (
                  <RestaurantCard key={r.id} restaurant={r} onSelect={() => selectRestaurant(r)} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <SearchPagination page={searchPage} total={searchTotal} limit={SEARCH_LIMIT} onPage={handlePage} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RESTAURANT VIEW
  // ══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Back to search */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "none", border: "none",
            cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13, padding: 0,
          }}
        >
          ← Menu Manager
        </button>
      </div>

      {/* Restaurant summary panel */}
      <PageCard style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Restaurant Menu Detail
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: OWNER_COLORS.ink }}>
            {selectedRestaurant.name}
          </h2>
          <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginTop: 4 }}>
            {[selectedRestaurant.city, selectedRestaurant.state].filter(Boolean).join(", ")}
            {selectedRestaurant.email && ` · ${selectedRestaurant.email}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <StatBox label="ID"               value={`#${selectedRestaurant.id}`} />
          <StatBox label="Menus"            value={menus.length} />
          <StatBox label="Total Items"      value={totalItems.toLocaleString()} />
          <StatBox label="Published Items"  value={publishedItems.toLocaleString()} />
          <StatBox label="Draft Items"      value={draftItems.toLocaleString()} />
          {needsReviewItems !== null && (
            <StatBox label="Needs Review"   value={needsReviewItems.toLocaleString()} warn={needsReviewItems > 0} />
          )}
          {hiddenItems !== null && (
            <StatBox label="Hidden Items"   value={hiddenItems.toLocaleString()} />
          )}
          {duplicateCount !== null && duplicateCount > 0 && (
            <StatBox label="Duplicates"     value={duplicateCount.toLocaleString()} warn />
          )}
          {selectedRestaurant.created_at && (
            <StatBox label="Restaurant Created" value={formatDate(selectedRestaurant.created_at)} />
          )}
          {selectedRestaurant.first_menu_date && (
            <StatBox label="First Upload"   value={formatDate(selectedRestaurant.first_menu_date)} />
          )}
          {lastMenuUpdated && (
            <StatBox label="Last Updated"   value={formatDate(lastMenuUpdated)} />
          )}
        </div>
      </PageCard>

      {/* ── Upload History ──────────────────────────────────────────────── */}
      <PageCard style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>Upload History</div>
          <NewUploadSection
            onSuccess={() => {
              getOwnerMenuUploads({ restaurant_id: selectedRestaurant.id, limit: 50 })
                .then((r) => setRecentUploads(r.uploads || []))
                .catch(() => {});
            }}
            initialRestaurant={selectedRestaurant}
            compact
          />
        </div>
        {recentUploads.length === 0 ? (
          <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>No uploads yet for this restaurant.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentUploads.map((u) => {
              const isReview = u.status === "needs_review";
              const isFailed = u.status === "failed";
              return (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, padding: "8px 12px", borderRadius: 8,
                  background: isReview ? OWNER_COLORS.accentSoft : "#f9fafb",
                  border: `1px solid ${isReview ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <StatusChip status={u.status} />
                      <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                        {u.session_meta?.upload_type || "upload"} · {formatDate(u.created_at)}
                      </span>
                      {(u.inserted_item_count > 0 || u.parsed_item_count > 0) && (
                        <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
                          {u.inserted_item_count} inserted / {u.parsed_item_count} parsed
                        </span>
                      )}
                      {u.human_review_items > 0 && (
                        <span style={{ fontSize: 11, color: OWNER_COLORS.accent, fontWeight: 700 }}>
                          {u.human_review_items} need review
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isReview && (
                      <Link
                        to={`/owner/menu-manager/uploads/${u.id}/review-items`}
                        style={{
                          padding: "6px 12px", borderRadius: 7, textDecoration: "none",
                          background: OWNER_COLORS.accent, color: "#fff",
                          fontSize: 12, fontWeight: 700,
                        }}
                      >
                        Review Items →
                      </Link>
                    )}
                    <Link
                      to={`/owner/menu-manager/uploads/${u.id}`}
                      style={{
                        padding: "6px 10px", borderRadius: 7, textDecoration: "none",
                        background: "#fff", color: isFailed ? "#991b1b" : OWNER_COLORS.ink,
                        border: `1px solid ${OWNER_COLORS.line}`, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>

      {/* ── Item search bar + filter chips ─────────────────────────────────── */}
      <PageCard style={{ padding: "14px 18px", marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 15, color: OWNER_COLORS.muted, pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            value={itemQ}
            onChange={handleItemQChange}
            placeholder="Search items by name, description, or section…"
            style={{ ...inputStyle, paddingLeft: 38, fontSize: 13 }}
            autoComplete="off"
          />
          {itemSearching && (
            <span style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 11, color: OWNER_COLORS.muted,
            }}>Searching…</span>
          )}
          {isItemSearchActive && !itemSearching && (
            <button
              type="button"
              onClick={resetItemSearch}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: OWNER_COLORS.muted, padding: "0 2px",
              }}
            >✕ Clear</button>
          )}
        </div>
        {itemSearchErr && <div style={{ marginTop: 6, fontSize: 12, color: "#991b1b" }}>{itemSearchErr}</div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {ITEM_FILTER_CHIPS.map((fc) => {
            const active = itemFilter === fc.key;
            return (
              <button
                key={fc.key}
                type="button"
                onClick={() => handleItemFilterChange(fc.key)}
                style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: active ? 700 : 500,
                  border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                  background: active ? OWNER_COLORS.accentSoft : "#fff",
                  color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                  cursor: "pointer",
                }}
              >
                {fc.label}
              </button>
            );
          })}
        </div>
      </PageCard>

      {/* ── Item search results (replaces tabs+editor when active) ─────────── */}
      {isItemSearchActive ? (
        <ItemSearchResults
          results={itemResults}
          total={itemTotal}
          page={itemPage}
          totalPages={itemTotalPages}
          searching={itemSearching}
          selectedIds={selectedItemIds}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          onPage={handleItemPage}
          menus={menus}
          bulkAction={bulkAction}
          setBulkAction={setBulkAction}
          bulkTargetMenuId={bulkTargetMenuId}
          setBulkTargetMenuId={setBulkTargetMenuId}
          bulkSectionInput={bulkSectionInput}
          setBulkSectionInput={setBulkSectionInput}
          bulkLoading={bulkLoading}
          bulkErr={bulkErr}
          onBulkOp={handleBulkOp}
          onOpenMenu={handleJumpToMenu}
          restaurantId={selectedRestaurant?.id}
          onSaved={() => runItemSearch(itemQ, itemPage, itemFilter)}
        />
      ) : (
      <>

      {/* Menu type tabs */}
      {menusLoading ? (
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted, padding: "10px 0", marginBottom: 12 }}>
          Loading menus…
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            {availableTypeTabs.map((tab) => {
              const tabMenus = tab.key === "__custom__"
                ? menus.filter((m) => !STANDARD_MENU_TYPES.has(m.menu_type))
                : menus.filter((m) => m.menu_type === tab.key);
              const tabItemCount = tabMenus.reduce((s, m) => s + (m.item_count || 0), 0);
              const tabLastUpdated = tabMenus.reduce((latest, m) => {
                if (!m.updated_at) return latest;
                return !latest || new Date(m.updated_at) > new Date(latest) ? m.updated_at : latest;
              }, null);
              const isActive = activeMenuType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleMenuTypeTab(tab.key)}
                  style={{
                    padding: "7px 14px", borderRadius: 10, textAlign: "left",
                    border: `1px solid ${isActive ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                    background: isActive ? OWNER_COLORS.accentSoft : "#fff",
                    color: isActive ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                    fontWeight: isActive ? 700 : 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {tab.label}
                  <span style={{ display: "block", fontSize: 10, opacity: 0.65, fontWeight: 500, marginTop: 1 }}>
                    {tabItemCount} item{tabItemCount !== 1 ? "s" : ""}
                    {tabLastUpdated ? ` · ${formatDate(tabLastUpdated)}` : ""}
                  </span>
                </button>
              );
            })}

            {/* Inline create-menu button sits at end of tab row */}
            <CreateMenuForm restaurantId={selectedRestaurant.id} onCreated={onMenuCreated} inline />
          </div>

          {/* Sub-nav when multiple menus share the same type */}
          {menusOfActiveType.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {menusOfActiveType.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => loadMenu(m.id)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    border: `1px solid ${selectedMenuId === m.id ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                    background: selectedMenuId === m.id ? OWNER_COLORS.accentSoft : "transparent",
                    color: selectedMenuId === m.id ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                    fontWeight: selectedMenuId === m.id ? 700 : 500, fontSize: 12, cursor: "pointer",
                  }}
                >
                  {m.display_name || m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu editor */}
      {!selectedMenuId ? (
        <PageCard style={{ padding: 40 }}>
          <EmptyState>
            {menus.length === 0
              ? "No menus yet — create one above."
              : "Select a menu tab above to view and edit it."}
          </EmptyState>
        </PageCard>
      ) : menuDetailLoading ? (
        <PageCard style={{ padding: 40, color: OWNER_COLORS.muted, fontSize: 14 }}>Loading menu…</PageCard>
      ) : menuDetailErr ? (
        <PageCard style={{ padding: 24 }}><ErrorBanner message={menuDetailErr} /></PageCard>
      ) : menuDetail ? (
        <MenuEditor
          restaurantId={selectedRestaurant.id}
          menuDetail={menuDetail}
          onMenuUpdated={onMenuUpdated}
          onMenuDeleted={onMenuDeleted}
          onReload={() => loadMenu(selectedMenuId)}
        />
      ) : null}

      </>
      )}
    </div>
  );
}

// ─── Item Search Results ──────────────────────────────────────────────────────

function ItemSearchResults({
  results, total, page, totalPages, searching,
  selectedIds, onSelectItem, onSelectAll, onPage,
  menus, bulkAction, setBulkAction,
  bulkTargetMenuId, setBulkTargetMenuId,
  bulkSectionInput, setBulkSectionInput,
  bulkLoading, bulkErr, onBulkOp, onOpenMenu,
  restaurantId, onSaved,
}) {
  const from = (page - 1) * 50 + 1;
  const to   = Math.min(page * 50, total);
  const allSelected = results && results.length > 0 && selectedIds.size === results.length;
  const hasSelection = selectedIds.size > 0;

  if (searching && !results) {
    return (
      <div style={{ padding: "20px 0", color: OWNER_COLORS.muted, fontSize: 13 }}>Searching items…</div>
    );
  }

  if (!results) return null;

  return (
    <div>
      {/* Count row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
          {searching
            ? "Searching…"
            : total === 0
              ? "No items found."
              : `${total.toLocaleString()} item${total !== 1 ? "s" : ""}${total > 1 ? ` (${from}–${to})` : ""}`}
        </div>
        {hasSelection && (
          <div style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent }}>
            {selectedIds.size} selected
          </div>
        )}
      </div>

      {/* Bulk toolbar */}
      {hasSelection && (
        <PageCard style={{ padding: "10px 16px", marginBottom: 12, background: OWNER_COLORS.accentSoft, border: `1px solid ${OWNER_COLORS.accent}` }}>
          {bulkErr && <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 8 }}>{bulkErr}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.ink }}>
              {selectedIds.size} selected:
            </span>
            <BulkBtn label="Move to…" disabled={bulkLoading}
              active={bulkAction === "move"}
              onClick={() => setBulkAction(bulkAction === "move" ? null : "move")} />
            <BulkBtn label="Change section…" disabled={bulkLoading}
              active={bulkAction === "change_section"}
              onClick={() => setBulkAction(bulkAction === "change_section" ? null : "change_section")} />
            <BulkBtn label="Remove" disabled={bulkLoading} danger
              onClick={() => {
                if (window.confirm(
                  `Remove ${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""}?\n\nItems will be soft-deleted (status = removed). They can be recovered by an admin if needed.`
                )) {
                  onBulkOp("delete");
                }
              }} />
          </div>

          {/* Move: select target menu, then confirm before executing */}
          {bulkAction === "move" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={bulkTargetMenuId}
                  onChange={(e) => setBulkTargetMenuId(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, width: "auto", minWidth: 200 }}
                >
                  <option value="">Select target menu…</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.name} ({m.menu_type} · {m.status})
                    </option>
                  ))}
                </select>
              </div>
              {bulkTargetMenuId && (
                <div style={{
                  marginTop: 10, padding: "10px 14px", borderRadius: 8,
                  border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: OWNER_COLORS.ink }}>Confirm move</div>
                  <div style={{ color: OWNER_COLORS.muted, marginBottom: 10 }}>
                    Move <strong>{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}</strong> to{" "}
                    <strong>{menus.find((m) => String(m.id) === String(bulkTargetMenuId))?.display_name || "selected menu"}</strong>?
                    This will update the menu assignment for all selected items.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={bulkLoading}
                      onClick={() => onBulkOp("move", { target_menu_id: Number(bulkTargetMenuId) })}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: OWNER_COLORS.accent, color: "#fff", border: "none",
                        cursor: !bulkLoading ? "pointer" : "not-allowed", opacity: !bulkLoading ? 1 : 0.5,
                      }}
                    >{bulkLoading ? "Moving…" : "Confirm Move"}</button>
                    <button
                      type="button"
                      onClick={() => { setBulkAction(null); setBulkTargetMenuId(""); }}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: "#fff", color: OWNER_COLORS.ink,
                        border: `1px solid ${OWNER_COLORS.line}`, cursor: "pointer",
                      }}
                    >Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section change input */}
          {bulkAction === "change_section" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
              <input
                type="text"
                value={bulkSectionInput}
                onChange={(e) => setBulkSectionInput(e.target.value)}
                placeholder="New section name (leave blank to clear)"
                style={{ ...inputStyle, fontSize: 12, width: "auto", minWidth: 220 }}
              />
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => onBulkOp("change_section", { section: bulkSectionInput })}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: OWNER_COLORS.accent, color: "#fff", border: "none",
                  cursor: !bulkLoading ? "pointer" : "not-allowed", opacity: !bulkLoading ? 1 : 0.5,
                }}
              >Apply</button>
            </div>
          )}
        </PageCard>
      )}

      {/* Results table */}
      {results.length > 0 ? (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          {/* Select-all row */}
          <div style={{
            padding: "8px 16px", borderBottom: `1px solid ${OWNER_COLORS.line}`,
            display: "flex", alignItems: "center", gap: 12,
            background: OWNER_COLORS.panel,
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: OWNER_COLORS.accent }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {allSelected ? "Deselect all" : "Select all on this page"}
            </span>
          </div>

          {results.map((item, idx) => (
            <ItemResultRow
              key={item.id}
              item={item}
              checked={selectedIds.has(item.id)}
              onCheck={() => onSelectItem(item.id)}
              onOpenMenu={() => onOpenMenu(item)}
              isLast={idx === results.length - 1}
              restaurantId={restaurantId}
              onSaved={onSaved}
            />
          ))}
        </PageCard>
      ) : (
        !searching && (
          <PageCard style={{ padding: 40 }}>
            <EmptyState>No items match the current search or filter.</EmptyState>
          </PageCard>
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <SearchPagination page={page} total={total} limit={50} onPage={onPage} />
      )}
    </div>
  );
}

function ItemResultRow({ item, checked, onCheck, onOpenMenu, isLast, restaurantId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  function startEdit() {
    setDraft({
      name: item.name || "",
      description: item.description || "",
      price: item.price != null ? String(item.price) : "",
      section: item.section || "",
    });
    setSaveErr("");
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.name.trim()) { setSaveErr("Name is required."); return; }
    setSaving(true);
    setSaveErr("");
    try {
      await updateMenuConsoleItem(restaurantId, item.menu_id, item.id, {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: draft.price === "" ? null : Number(draft.price),
        section: draft.section.trim() || null,
      });
      setEditing(false);
      if (onSaved) onSaved();
    } catch (err) {
      setSaveErr(err?.payload?.error || err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div style={{
        padding: "14px 16px",
        borderBottom: isLast ? "none" : `1px solid ${OWNER_COLORS.line}`,
        background: "#f8f7f4",
        borderLeft: `3px solid ${OWNER_COLORS.accent}`,
      }}>
        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle} placeholder="Item name" autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <input value={draft.price} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                style={inputStyle} placeholder="9.99" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                style={inputStyle} placeholder="Optional" />
            </div>
            <div>
              <label style={labelStyle}>Section</label>
              <input value={draft.section} onChange={(e) => setDraft((p) => ({ ...p, section: e.target.value }))}
                style={inputStyle} placeholder="e.g. Appetizers" />
            </div>
          </div>
          {saveErr && <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 8 }}>{saveErr}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{
              padding: "7px 16px", borderRadius: 8, background: OWNER_COLORS.accent,
              color: "#fff", border: "none", fontWeight: 700, fontSize: 12,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            }}>{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} style={{
              padding: "7px 12px", borderRadius: 8, background: "#fff",
              border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: isLast ? "none" : `1px solid ${OWNER_COLORS.line}`,
      display: "flex", alignItems: "flex-start", gap: 12,
      background: checked ? OWNER_COLORS.accentSoft : "#fff",
      transition: "background 0.1s",
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheck}
        style={{ marginTop: 3, width: 15, height: 15, cursor: "pointer", flexShrink: 0, accentColor: OWNER_COLORS.accent }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink, marginBottom: 2 }}>
          {item.name}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: OWNER_COLORS.muted }}>
          {item.section && <span>{item.section}</span>}
          <span style={{ fontStyle: "italic" }}>
            {item.menu_name || "Unnamed menu"}
            {item.menu_type ? ` · ${item.menu_type}` : ""}
          </span>
          {item.price != null && (
            <span style={{ fontWeight: 600, color: OWNER_COLORS.ink }}>
              ${Number(item.price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <StatusChip status={item.menu_status || "draft"} />
        <button
          type="button"
          onClick={startEdit}
          style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            border: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
            color: OWNER_COLORS.ink, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >Edit</button>
        <button
          type="button"
          onClick={onOpenMenu}
          style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            border: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
            color: OWNER_COLORS.accent, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >Open menu →</button>
      </div>
    </div>
  );
}

function BulkBtn({ label, onClick, disabled, danger, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: `1px solid ${danger ? "#ef4444" : active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
        background: active ? OWNER_COLORS.accent : danger ? "#fef2f2" : "#fff",
        color: active ? "#fff" : danger ? "#ef4444" : OWNER_COLORS.ink,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ─── Search result card ───────────────────────────────────────────────────────

function RestaurantCard({ restaurant: r, onSelect }) {
  return (
    <div style={{
      padding: "18px 20px", borderRadius: 14,
      border: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: OWNER_COLORS.ink, marginBottom: 3 }}>
        {r.name}
      </div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 12 }}>
        {[r.city, r.state].filter(Boolean).join(", ")} · ID #{r.id}
      </div>

      <div style={{ display: "flex", gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
        <StatBox label="Menus"     value={r.menu_count       ?? 0} small />
        <StatBox label="Items"     value={(r.item_count ?? 0).toLocaleString()} small />
        <StatBox label="Published" value={r.published_count  ?? 0} small />
        <StatBox label="Draft"     value={r.draft_count      ?? 0} small />
      </div>

      {r.last_menu_updated && (
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginBottom: 14 }}>
          Updated {formatDate(r.last_menu_updated)}
        </div>
      )}

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: "auto", padding: "9px 0", borderRadius: 9,
          background: OWNER_COLORS.accent, color: "#fff",
          border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}
      >
        Open Menu Manager
      </button>
    </div>
  );
}

function StatBox({ label, value, small, warn }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: small ? 15 : 18, color: warn ? "#b45309" : OWNER_COLORS.ink }}>{value}</div>
      <div style={{ fontSize: small ? 10 : 11, color: warn ? "#b45309" : OWNER_COLORS.muted }}>{label}</div>
    </div>
  );
}

function SearchPagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  const btn = (disabled) => ({
    padding: "7px 14px", borderRadius: 8,
    border: `1px solid ${OWNER_COLORS.line}`,
    background: disabled ? "#f3f4f6" : "#fff",
    color: disabled ? OWNER_COLORS.muted : OWNER_COLORS.ink,
    fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: "10px 0" }}>
      <button style={btn(page <= 1)} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
        {from}–{to} of {total.toLocaleString()} · Page {page} / {totalPages}
      </span>
      <button style={btn(page >= totalPages)} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </div>
  );
}

function MenuListItem({ menu, selected, onClick }) {
  const displayName = menu.display_name || menu.name || "Unnamed Menu";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "10px 12px", borderRadius: 10, border: "none",
        background: selected ? OWNER_COLORS.accentSoft : "transparent",
        cursor: "pointer", transition: "background 0.15s",
      }}
    >
      <div style={{ fontWeight: selected ? 700 : 600, fontSize: 13, color: OWNER_COLORS.ink }}>
        {displayName}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
        <StatusChip status={menu.status} />
        <span style={{ fontSize: 11, color: OWNER_COLORS.muted }}>{menu.item_count} items</span>
      </div>
    </button>
  );
}

function CreateMenuForm({ restaurantId, onCreated, inline }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [menuType, setMenuType] = useState("main");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr("Menu name is required."); return; }
    setSubmitting(true);
    setErr("");
    try {
      const data = await createMenuConsoleMenu(restaurantId, { display_name: name.trim(), menu_type: menuType });
      setName("");
      setMenuType("main");
      setOpen(false);
      onCreated(data.menu);
    } catch (ex) {
      setErr(ex?.payload?.error || ex?.message || "Could not create menu.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={inline
          ? { padding: "8px 14px", borderRadius: 10, background: "#fff", border: `1px dashed ${OWNER_COLORS.line}`, color: OWNER_COLORS.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }
          : { marginBottom: 12, padding: "8px 14px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, color: OWNER_COLORS.ink, fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }
        }
      >
        + New Menu
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 14, padding: "14px 14px", borderRadius: 12, background: "#f8f7f4", border: `1px solid ${OWNER_COLORS.line}` }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Menu name (e.g. Dinner, Lunch)"
            style={{ ...inputStyle, marginBottom: 6 }}
            autoFocus
          />
          <select
            value={menuType}
            onChange={(e) => setMenuType(e.target.value)}
            style={inputStyle}
          >
            <option value="main">Main</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="kids">Kids</option>
            <option value="specials">Specials</option>
            <option value="catering">Catering</option>
            <option value="happy_hour">Happy Hour</option>
          </select>
        </div>
        {err && <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 6 }}>{err}</div>}
        <div style={{ display: "flex", gap: 6 }}>
          <button type="submit" disabled={submitting} style={{ flex: 1, padding: "8px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={() => { setOpen(false); setErr(""); }} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Menu Editor ──────────────────────────────────────────────────────────────

function MenuEditor({ restaurantId, menuDetail, onMenuUpdated, onMenuDeleted, onReload }) {
  const { menu, sections: initialSections, item_count } = menuDetail;
  const [sections, setSections] = useState(initialSections || []);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgOk, setSaveMsgOk] = useState(true);

  // Pending edits: { itemId: { name, description, price, section } }
  const [pendingEdits, setPendingEdits] = useState({});
  const [editingItemId, setEditingItemId] = useState(null);

  // New item form state per section
  const [newItemSection, setNewItemSection] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", section: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [addItemErr, setAddItemErr] = useState("");

  // Menu name edit
  const [editingMenuName, setEditingMenuName] = useState(false);
  const [menuNameDraft, setMenuNameDraft] = useState(menu.display_name || menu.name || "");
  const [menuNameSaving, setMenuNameSaving] = useState(false);

  // New section name
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    setSections(menuDetail.sections || []);
    setUnsaved(false);
    setPendingEdits({});
    setEditingItemId(null);
    setSaveMsg("");
    setMenuNameDraft(menuDetail.menu?.display_name || menuDetail.menu?.name || "");
  }, [menuDetail]);

  function startEditItem(itemId) {
    const allItems = sections.flatMap((s) => s.items);
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;
    setPendingEdits((prev) => ({
      ...prev,
      [itemId]: prev[itemId] || {
        name: item.name || "",
        description: item.description || "",
        price: item.price != null ? String(item.price) : "",
        section: item.section || "",
      },
    }));
    setEditingItemId(itemId);
  }

  function updatePendingEdit(itemId, field, value) {
    setPendingEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
    setUnsaved(true);
  }

  function cancelEditItem(itemId) {
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setEditingItemId(null);
  }

  async function saveEditItem(itemId) {
    const edits = pendingEdits[itemId];
    if (!edits) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body = {};
      if (edits.name !== undefined) body.name = edits.name;
      if (edits.description !== undefined) body.description = edits.description;
      if (edits.price !== undefined) body.price = edits.price === "" ? null : Number(edits.price);
      if (edits.section !== undefined) body.section = edits.section || null;

      const data = await updateMenuConsoleItem(restaurantId, menu.id, itemId, body);

      if (data.ok) {
        setSaveMsg("Saved.");
        setSaveMsgOk(true);
        setPendingEdits((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
        setEditingItemId(null);
        onReload();
      }
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Save failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleDeleteItem(itemId) {
    if (!window.confirm("Delete this item?")) return;
    setSaving(true);
    try {
      await deleteMenuConsoleItem(restaurantId, menu.id, itemId);
      setSaveMsg("Item deleted.");
      setSaveMsgOk(true);
      onReload();
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Delete failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  function openAddItem(sectionName) {
    setNewItemSection(sectionName);
    setNewItem({ name: "", description: "", price: "", section: sectionName || "" });
    setAddItemErr("");
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItem.name.trim()) { setAddItemErr("Item name is required."); return; }
    setAddingItem(true);
    setAddItemErr("");
    try {
      await addMenuConsoleItem(restaurantId, menu.id, {
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price: newItem.price === "" ? null : Number(newItem.price),
        section: newItem.section.trim() || null,
      });
      setSaveMsg("Item added.");
      setSaveMsgOk(true);
      setNewItemSection(null);
      onReload();
    } catch (err) {
      setAddItemErr(err?.payload?.error || err?.message || "Could not add item.");
    } finally {
      setAddingItem(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    // Add the first item in that section to create it
    setAddingSection(true);
    setNewItemSection(newSectionName.trim());
    setNewItem({ name: "", description: "", price: "", section: newSectionName.trim() });
    setNewSectionName("");
    setAddingSection(false);
  }

  async function handlePublish() {
    setSaving(true);
    setSaveMsg("");
    try {
      const data = menu.status === "published"
        ? await unpublishMenuConsoleMenu(restaurantId, menu.id)
        : await publishMenuConsoleMenu(restaurantId, menu.id);
      setSaveMsg(menu.status === "published" ? "Menu set to draft." : "Menu published.");
      setSaveMsgOk(true);
      onMenuUpdated(data.menu);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Action failed.");
      setSaveMsgOk(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 4000);
    }
  }

  async function handleDeleteMenu() {
    if (!window.confirm(`Delete the menu "${menu.display_name || menu.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteMenuConsoleMenu(restaurantId, menu.id);
      onMenuDeleted(menu.id);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Delete failed.");
      setSaveMsgOk(false);
      setSaving(false);
    }
  }

  async function saveMenuName() {
    if (!menuNameDraft.trim()) return;
    setMenuNameSaving(true);
    try {
      const data = await updateMenuConsoleMenu(restaurantId, menu.id, { display_name: menuNameDraft.trim() });
      setEditingMenuName(false);
      onMenuUpdated(data.menu);
      setSaveMsg("Menu name saved.");
      setSaveMsgOk(true);
    } catch (err) {
      setSaveMsg(err?.payload?.error || err?.message || "Save failed.");
      setSaveMsgOk(false);
    } finally {
      setMenuNameSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  const isPublished = menu.status === "published";

  return (
    <PageCard style={{ padding: 22 }}>
      {/* Menu header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          {editingMenuName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={menuNameDraft}
                onChange={(e) => setMenuNameDraft(e.target.value)}
                style={{ ...inputStyle, fontSize: 18, fontWeight: 700, padding: "6px 10px" }}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveMenuName(); if (e.key === "Escape") setEditingMenuName(false); }}
              />
              <button onClick={saveMenuName} disabled={menuNameSaving} style={{ padding: "7px 14px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {menuNameSaving ? "…" : "Save"}
              </button>
              <button onClick={() => setEditingMenuName(false)} style={{ padding: "7px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: OWNER_COLORS.ink }}>
                {menu.display_name || menu.name}
              </h2>
              <button onClick={() => setEditingMenuName(true)} style={{ background: "none", border: "none", cursor: "pointer", color: OWNER_COLORS.muted, fontSize: 12, padding: "2px 6px" }}>
                ✏️ Rename
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
            <StatusChip status={menu.status} />
            <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{item_count} items</span>
            {menu.menu_type && <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{menu.menu_type}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: "9px 16px", borderRadius: 10,
              background: isPublished ? "#fff" : "#15803d",
              color: isPublished ? OWNER_COLORS.ink : "#fff",
              border: isPublished ? `1px solid ${OWNER_COLORS.line}` : "none",
              fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {isPublished ? "Set to Draft" : "Publish Menu"}
          </button>
          {!menu.is_primary && (
            <button
              onClick={handleDeleteMenu}
              disabled={saving}
              style={{ padding: "9px 14px", borderRadius: 10, background: "#fff", color: "#991b1b", border: "1px solid #fca5a5", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}
            >
              Delete Menu
            </button>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: saveMsgOk ? "#f0fdf4" : "#fff1ef", color: saveMsgOk ? "#15803d" : "#8b2e1a", fontWeight: 700, fontSize: 13 }}>
          {saveMsg}
        </div>
      )}

      {unsaved && (
        <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fffbeb", color: "#92400e", fontWeight: 600, fontSize: 13, border: "1px solid #fde68a" }}>
          You have unsaved changes — save each edited item individually using the Save button next to it.
        </div>
      )}

      {/* Add section */}
      <div style={{ marginBottom: 18 }}>
        <form onSubmit={handleAddSection} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="New section name (e.g. Appetizers)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" disabled={!newSectionName.trim() || addingSection} style={{ padding: "9px 14px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Add Section
          </button>
        </form>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <EmptyState>No items yet. Add a section above, then add items below.</EmptyState>
      ) : (
        sections.map((section) => (
          <SectionEditor
            key={section.name}
            section={section}
            editingItemId={editingItemId}
            pendingEdits={pendingEdits}
            saving={saving}
            onStartEdit={startEditItem}
            onCancelEdit={cancelEditItem}
            onUpdateEdit={updatePendingEdit}
            onSaveEdit={saveEditItem}
            onDeleteItem={handleDeleteItem}
            newItemSection={newItemSection}
            newItem={newItem}
            onSetNewItem={setNewItem}
            addItemErr={addItemErr}
            addingItem={addingItem}
            onOpenAddItem={openAddItem}
            onAddItem={handleAddItem}
            onCancelAdd={() => setNewItemSection(null)}
          />
        ))
      )}

      {/* Add item to "no section" */}
      {newItemSection === "" && (
        <AddItemForm
          sectionName=""
          newItem={newItem}
          onSetNewItem={setNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={handleAddItem}
          onCancel={() => setNewItemSection(null)}
        />
      )}

      <div style={{ marginTop: 16, borderTop: `1px solid ${OWNER_COLORS.line}`, paddingTop: 14 }}>
        <button
          type="button"
          onClick={() => openAddItem("")}
          style={{ padding: "9px 16px", borderRadius: 10, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + Add Item (No Section)
        </button>
      </div>
    </PageCard>
  );
}

function SectionEditor({ section, editingItemId, pendingEdits, saving, onStartEdit, onCancelEdit, onUpdateEdit, onSaveEdit, onDeleteItem, newItemSection, newItem, onSetNewItem, addItemErr, addingItem, onOpenAddItem, onAddItem, onCancelAdd }) {
  const isAddingHere = newItemSection === section.name;

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: OWNER_COLORS.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {section.name}
        </h3>
        <button
          type="button"
          onClick={() => onOpenAddItem(section.name)}
          style={{ padding: "5px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          + Add Item
        </button>
      </div>

      {section.items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          isEditing={editingItemId === item.id}
          pendingEdit={pendingEdits[item.id]}
          saving={saving}
          onStartEdit={() => onStartEdit(item.id)}
          onCancelEdit={() => onCancelEdit(item.id)}
          onUpdateEdit={(field, value) => onUpdateEdit(item.id, field, value)}
          onSaveEdit={() => onSaveEdit(item.id)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}

      {isAddingHere && (
        <AddItemForm
          sectionName={section.name}
          newItem={newItem}
          onSetNewItem={onSetNewItem}
          addItemErr={addItemErr}
          addingItem={addingItem}
          onSubmit={onAddItem}
          onCancel={onCancelAdd}
        />
      )}
    </div>
  );
}

function ItemRow({ item, isEditing, pendingEdit, saving, onStartEdit, onCancelEdit, onUpdateEdit, onSaveEdit, onDelete }) {
  if (isEditing && pendingEdit) {
    return (
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f8f7f4", border: `1px solid ${OWNER_COLORS.accent}`, marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input value={pendingEdit.name} onChange={(e) => onUpdateEdit("name", e.target.value)} style={inputStyle} placeholder="Item name" />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input value={pendingEdit.price} onChange={(e) => onUpdateEdit("price", e.target.value)} style={inputStyle} placeholder="9.99" type="number" step="0.01" min="0" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={pendingEdit.description} onChange={(e) => onUpdateEdit("description", e.target.value)} style={{ ...inputStyle, resize: "vertical", minHeight: 56, lineHeight: 1.5 }} placeholder="Optional description" rows={2} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Section / Category</label>
          <input value={pendingEdit.section} onChange={(e) => onUpdateEdit("section", e.target.value)} style={inputStyle} placeholder="e.g. Appetizers" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onSaveEdit} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, background: OWNER_COLORS.accent, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save Item"}
          </button>
          <button onClick={onCancelEdit} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, marginBottom: 6, background: "#fff", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
        {item.description && <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2, whiteSpace: "pre-wrap" }}>{item.description}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>
          {item.price != null && <span style={{ fontWeight: 600, color: OWNER_COLORS.ink }}>${Number(item.price).toFixed(2)}</span>}
          {item.section && <span>{item.section}</span>}
          {item.item_number && <span style={{ opacity: 0.6 }}>{item.item_number}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onStartEdit} style={{ padding: "5px 10px", borderRadius: 7, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
          Edit
        </button>
        <button onClick={onDelete} style={{ padding: "5px 10px", borderRadius: 7, background: "#fff", border: "1px solid #fca5a5", color: "#991b1b", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AddItemForm({ sectionName, newItem, onSetNewItem, addItemErr, addingItem, onSubmit, onCancel }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#15803d", marginBottom: 10 }}>
        New item{sectionName ? ` in "${sectionName}"` : ""}
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={newItem.name} onChange={(e) => onSetNewItem((p) => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Item name" autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Price</label>
            <input value={newItem.price} onChange={(e) => onSetNewItem((p) => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="9.99" type="number" step="0.01" min="0" />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description</label>
          <input value={newItem.description} onChange={(e) => onSetNewItem((p) => ({ ...p, description: e.target.value }))} style={inputStyle} placeholder="Optional" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Section</label>
          <input value={newItem.section} onChange={(e) => onSetNewItem((p) => ({ ...p, section: e.target.value }))} style={inputStyle} placeholder={sectionName || "e.g. Entrees"} />
        </div>
        {addItemErr && <div style={{ marginBottom: 8, fontSize: 12, color: "#991b1b" }}>{addItemErr}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={addingItem} style={{ padding: "8px 16px", borderRadius: 8, background: "#15803d", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: addingItem ? "not-allowed" : "pointer" }}>
            {addingItem ? "Adding…" : "Add Item"}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}`, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// ─── Upload helpers (preserved from original) ──────────────────────────────────

function NewUploadSection({ onSuccess, initialRestaurant, compact }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("text");
  const [restaurantQuery, setRestaurantQuery] = useState(
    initialRestaurant
      ? initialRestaurant.name + (initialRestaurant.city ? ` — ${initialRestaurant.city}, ${initialRestaurant.state}` : "")
      : ""
  );
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(initialRestaurant || null);
  const [menuText, setMenuText] = useState("");
  const [file, setFile] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const searchTimeout = useRef(null);

  function handleQueryChange(e) {
    const q = e.target.value;
    setRestaurantQuery(q);
    setSelectedRestaurant(null);
    clearTimeout(searchTimeout.current);
    if (q.length < 2) { setRestaurantResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchOwnerRestaurantsForUpload(q);
        setRestaurantResults(data.restaurants || []);
      } catch { setRestaurantResults([]); }
      finally { setSearching(false); }
    }, 300);
  }

  function selectRestaurant(r) {
    setSelectedRestaurant(r);
    setRestaurantQuery(r.name + (r.city ? ` — ${r.city}, ${r.state}` : ""));
    setRestaurantResults([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    if (!selectedRestaurant) { setResult({ ok: false, message: "Please select a restaurant." }); return; }
    if (mode === "text") {
      if (!menuText.trim()) { setResult({ ok: false, message: "Please paste menu text." }); return; }
      setSubmitting(true);
      try {
        const res = await submitOwnerMenuTextIngest(selectedRestaurant.id, menuText);
        setResult({ ok: true, message: `Submitted. ${res.inserted_item_count} item${res.inserted_item_count !== 1 ? "s" : ""} inserted from ${res.parsed_item_count} parsed.` });
        setMenuText(""); setSelectedRestaurant(null); setRestaurantQuery("");
        onSuccess();
      } catch (err) { setResult({ ok: false, message: err?.payload?.error || err?.message || "Submission failed." }); }
      finally { setSubmitting(false); }
    } else {
      if (!file) { setResult({ ok: false, message: "Please choose a file." }); return; }
      setSubmitting(true);
      try {
        const json = await submitOwnerMenuFilePdf(selectedRestaurant.id, file);
        const inserted = (json.inserted_items || json.inserted || 0) + (json.updated_items || json.updated || 0);
        const reviewCount = json.review_count || 0;
        const reviewNote = reviewCount > 0 ? ` (${reviewCount} sent to review queue)` : "";
        setResult({ ok: true, message: `File processed. ${inserted} item${inserted !== 1 ? "s" : ""} inserted${reviewNote}. Check Upload History below to review extracted content.` });
        setFile(null); if (fileRef.current) fileRef.current.value = "";
        setSelectedRestaurant(null); setRestaurantQuery("");
        onSuccess();
      } catch (err) { setResult({ ok: false, message: err?.payload?.error || err?.message || "File upload failed." }); }
      finally { setSubmitting(false); }
    }
  }

  if (compact) {
    return (
      <div>
        <button
          onClick={() => { setOpen((v) => !v); setResult(null); }}
          style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${open ? OWNER_COLORS.accent : OWNER_COLORS.line}`, background: open ? OWNER_COLORS.accent : "#fff", color: open ? "#fff" : OWNER_COLORS.ink, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
        >
          {open ? "Cancel" : "+ New Upload"}
        </button>
        {open && (
          <div style={{ marginTop: 12 }}>
            <form onSubmit={handleSubmit}>
              {!initialRestaurant && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Restaurant</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" value={restaurantQuery} onChange={handleQueryChange} placeholder="Type restaurant name…" style={inputStyle} autoComplete="off" />
                    {searching && <div style={{ position: "absolute", right: 12, top: 10, color: OWNER_COLORS.muted, fontSize: 12 }}>Searching…</div>}
                  </div>
                  {restaurantResults.length > 0 && (
                    <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, background: "#fff", marginTop: 4, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                      {restaurantResults.map((r) => (
                        <button key={r.id} type="button" onClick={() => { setSelectedRestaurant(r); setRestaurantQuery(r.name); setRestaurantResults([]); }} style={{ display: "block", width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                          <span style={{ fontWeight: 600 }}>{r.name}</span>
                          {r.city && <span style={{ color: OWNER_COLORS.muted, marginLeft: 8, fontSize: 12 }}>{r.city}, {r.state}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Upload Method</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ key: "text", label: "Paste Menu Text" }, { key: "file", label: "Upload PDF / Image" }].map((m) => (
                    <button key={m.key} type="button" onClick={() => { setMode(m.key); setResult(null); }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.line}`, background: mode === m.key ? OWNER_COLORS.accentSoft : "#fff", color: mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.ink, fontWeight: mode === m.key ? 700 : 600, fontSize: 12, cursor: "pointer" }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "text" && (
                <div style={{ marginBottom: 14 }}>
                  <textarea value={menuText} onChange={(e) => setMenuText(e.target.value)} placeholder={"APPETIZERS\nSpring Rolls  $8.99\n\nMAINS\nGrilled Salmon  $24"} rows={8} style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical", lineHeight: 1.6 }} />
                </div>
              )}
              {mode === "file" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ marginBottom: 6, fontSize: 12, color: OWNER_COLORS.muted }}>Accepted: PDF, JPEG, PNG, WebP. Max 20 MB.</div>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: "10px 12px" }} />
                  {file && <div style={{ marginTop: 4, fontSize: 12, color: OWNER_COLORS.muted }}>Selected: <strong style={{ color: OWNER_COLORS.ink }}>{file.name}</strong></div>}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="submit" disabled={submitting} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: submitting ? OWNER_COLORS.muted : OWNER_COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Submitting…" : "Submit Upload"}
                </button>
                {result && (
                  <div style={{ flex: 1, padding: "8px 12px", borderRadius: 9, background: result.ok ? "#f0fdf4" : "#fff1ef", color: result.ok ? "#15803d" : "#8b2e1a", fontWeight: 700, fontSize: 12 }}>
                    {result.message}
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 16 : 0 }}>
        <SectionTitle title="New Upload" subtitle="Submit a menu on behalf of a restaurant." />
        <button
          onClick={() => { setOpen((v) => !v); setResult(null); }}
          style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${open ? OWNER_COLORS.accent : OWNER_COLORS.line}`, background: open ? OWNER_COLORS.accent : "#fff", color: open ? "#fff" : OWNER_COLORS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
        >
          {open ? "Cancel" : "+ New Upload"}
        </button>
      </div>

      {open && (
        <PageCard style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Restaurant</label>
              <div style={{ position: "relative" }}>
                <input type="text" value={restaurantQuery} onChange={handleQueryChange} placeholder="Type restaurant name…" style={inputStyle} autoComplete="off" />
                {searching && <div style={{ position: "absolute", right: 12, top: 10, color: OWNER_COLORS.muted, fontSize: 12 }}>Searching…</div>}
              </div>
              {restaurantResults.length > 0 && (
                <div style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, background: "#fff", marginTop: 4, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  {restaurantResults.map((r) => (
                    <button key={r.id} type="button" onClick={() => selectRestaurant(r)} style={{ display: "block", width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      {r.city && <span style={{ color: OWNER_COLORS.muted, marginLeft: 8, fontSize: 12 }}>{r.city}, {r.state}</span>}
                      <span style={{ color: OWNER_COLORS.muted, marginLeft: 8, fontSize: 11 }}>#{r.id}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedRestaurant && (
                <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
                  Selected: <strong style={{ color: OWNER_COLORS.ink }}>#{selectedRestaurant.id} — {selectedRestaurant.name}</strong>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Upload Method</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ key: "text", label: "Paste Menu Text" }, { key: "file", label: "Upload PDF / Image" }].map((m) => (
                  <button key={m.key} type="button" onClick={() => { setMode(m.key); setResult(null); }} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.line}`, background: mode === m.key ? OWNER_COLORS.accentSoft : "#fff", color: mode === m.key ? OWNER_COLORS.accent : OWNER_COLORS.ink, fontWeight: mode === m.key ? 700 : 600, fontSize: 13, cursor: "pointer" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "text" && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Menu Text</label>
                <div style={{ marginBottom: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.6 }}>
                  Paste the menu below. Format each item as <code>Item Name  $Price</code>. Use ALL CAPS lines as section headers.
                </div>
                <textarea value={menuText} onChange={(e) => setMenuText(e.target.value)} placeholder={"APPETIZERS\nSpring Rolls  $8.99\n\nMAINS\nGrilled Salmon  $24"} rows={12} style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical", lineHeight: 1.6 }} />
              </div>
            )}

            {mode === "file" && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>PDF or Image File</label>
                <div style={{ marginBottom: 8, fontSize: 12, color: OWNER_COLORS.muted, lineHeight: 1.6 }}>Accepted: PDF, JPEG, PNG, WebP. Max 20 MB.</div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: "10px 12px" }} />
                {file && <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>Selected: <strong style={{ color: OWNER_COLORS.ink }}>{file.name}</strong> ({(file.size / 1024).toFixed(0)} KB)</div>}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button type="submit" disabled={submitting} style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: submitting ? OWNER_COLORS.muted : OWNER_COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting…" : "Submit Upload"}
              </button>
              {result && (
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: result.ok ? "#f0fdf4" : "#fff1ef", color: result.ok ? "#15803d" : "#8b2e1a", fontWeight: 700, fontSize: 13 }}>
                  {result.message}
                </div>
              )}
            </div>
          </form>
        </PageCard>
      )}
    </div>
  );
}

function UploadRow({ upload }) {
  const badge = STATUS_BADGE[upload.display_status] || STATUS_BADGE.pending;
  const hasItems = upload.parsed_item_count > 0 || upload.inserted_item_count > 0;
  const location = upload.city && upload.state ? `${upload.city}, ${upload.state}` : null;
  return (
    <tr style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
      <td style={{ padding: "11px 14px" }}>
        <div style={{ fontWeight: 600 }}>{upload.restaurant_name || <em style={{ color: OWNER_COLORS.muted }}>Unknown</em>}</div>
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted, marginTop: 2 }}>#{upload.restaurant_id}</div>
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upload.email}</td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted }}>{upload.upload_type || "pdf"}</td>
      <td style={{ padding: "11px 14px" }}>
        <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, ...badge }}>{upload.display_status}</span>
        {upload.failure_reason && <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upload.failure_reason}</div>}
      </td>
      <td style={{ padding: "11px 14px", textAlign: "center" }}>
        {hasItems ? <span style={{ fontWeight: 600 }}>{upload.inserted_item_count} / {upload.parsed_item_count}</span> : <span style={{ color: OWNER_COLORS.muted }}>—</span>}
        {upload.human_review_items > 0 && <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>{upload.human_review_items} to review</div>}
      </td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12, whiteSpace: "nowrap" }}>{formatDate(upload.created_at)}</td>
      <td style={{ padding: "11px 14px", color: OWNER_COLORS.muted, fontSize: 12 }}>{location || "—"}</td>
      <td style={{ padding: "11px 14px" }}>
        <Link to={`/owner/menu-manager/uploads/${upload.id}`} style={{ color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>View →</Link>
      </td>
    </tr>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
      {message}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return "—"; }
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function OwnerMenuUploads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  return (
    <OwnerLayout title="Menu Manager">
      <MenuManagerTab
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
      />
    </OwnerLayout>
  );
}
