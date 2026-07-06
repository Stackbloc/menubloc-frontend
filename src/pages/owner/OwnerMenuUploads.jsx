import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  getUploadReviewItems,
  approveReviewItem,
  rejectReviewItem,
  bulkReviewItems,
  getOwnerMenuUpload,
  retryOwnerMenuUpload,
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
  const navigate = useNavigate();
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
  const [publishedMenuReloadToken, setPublishedMenuReloadToken] = useState(0);

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
    navigate(`/owner/restaurants/${selectedRestaurant.id}/menus/${newMenu.id}/edit`);
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
  // RESTAURANT VIEW — menu list only; editing happens on /owner/restaurants/:id/menus/:menuId/edit
  // ══════════════════════════════════════════════════════════════
  const publishedCount = menus.filter((m) => m.status === "published").length;
  const draftCount = menus.filter((m) => m.status !== "published").length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "none", border: "none",
            cursor: "pointer", color: OWNER_COLORS.accent, fontWeight: 700, fontSize: 13, padding: 0,
          }}
        >
          ← All Restaurants
        </button>
      </div>

      <PageCard style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: OWNER_COLORS.ink }}>
              {selectedRestaurant.name}
            </h2>
            <div style={{ fontSize: 13, color: OWNER_COLORS.muted, marginTop: 4 }}>
              {[selectedRestaurant.address_line1, selectedRestaurant.city, selectedRestaurant.state].filter(Boolean).join(", ")}
            </div>
          </div>
          <a
            href={`/public/restaurants/${selectedRestaurant.id}/menu`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
          >
            View public menu ↗
          </a>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
          <StatBox label="Published menus" value={publishedCount} />
          <StatBox label="Draft / review" value={draftCount} />
          <StatBox label="Total items" value={totalItems.toLocaleString()} small />
        </div>
      </PageCard>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <SectionTitle title="Menus" subtitle="Open a menu in the editor to upload, edit items, and publish." />
        <CreateMenuForm restaurantId={selectedRestaurant.id} onCreated={onMenuCreated} inline />
      </div>

      {menusLoading ? (
        <PageCard style={{ padding: 32, color: OWNER_COLORS.muted }}>Loading menus…</PageCard>
      ) : menus.length === 0 ? (
        <PageCard style={{ padding: 40 }}>
          <EmptyState>No menus yet. Create one above, then open it in the editor to add items or upload a PDF/photo.</EmptyState>
        </PageCard>
      ) : (
        <PageCard style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f7f4", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                {["Menu", "Type", "Status", "Items", "Last updated", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{m.display_name || m.name || "Unnamed"}</td>
                  <td style={{ padding: "12px 16px", color: OWNER_COLORS.muted }}>{m.menu_type || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><StatusChip status={m.status} /></td>
                  <td style={{ padding: "12px 16px" }}>{m.item_count ?? 0}</td>
                  <td style={{ padding: "12px 16px", color: OWNER_COLORS.muted }}>{formatDate(m.updated_at)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <Link
                      to={`/owner/restaurants/${selectedRestaurant.id}/menus/${m.id}/edit`}
                      style={{
                        display: "inline-block", padding: "7px 14px", borderRadius: 8,
                        background: OWNER_COLORS.accent, color: "#fff", fontWeight: 700,
                        fontSize: 12, textDecoration: "none",
                      }}
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>
      )}
    </div>
  );
}

// ─── Search result card ───────────────────────────────────────────────────────

function RestaurantCard({ restaurant: r, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left", padding: "16px 18px", borderRadius: 14,
        border: `1px solid ${OWNER_COLORS.line}`, background: "#fff",
        cursor: "pointer", width: "100%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink, marginBottom: 4 }}>{r.name}</div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 10 }}>
        {[r.city, r.state].filter(Boolean).join(", ")}
        {r.id ? ` · #${r.id}` : ""}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatBox label="Menus" value={r.menu_count ?? 0} small />
        <StatBox label="Items" value={r.item_count ?? 0} small />
        {(r.published_count ?? 0) > 0 && <StatBox label="Published" value={r.published_count} small />}
        {(r.draft_count ?? 0) > 0 && <StatBox label="Draft" value={r.draft_count} small />}
      </div>
    </button>
  );
}

function StatBox({ label, value, small, warn }) {
  return (
    <div style={{ minWidth: small ? 56 : 72 }}>
      <div style={{ fontSize: small ? 16 : 20, fontWeight: 800, color: warn ? "#b45309" : OWNER_COLORS.ink }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function SearchPagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
      <span style={{ fontSize: 13, color: OWNER_COLORS.muted, alignSelf: "center" }}>Page {page} of {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>Next →</button>
    </div>
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
  const activeTab = searchParams.get("tab") === "uploads" ? "uploads" : "restaurants";

  useEffect(() => {
    const rid = searchParams.get("restaurant");
    if (!rid || selectedRestaurant) return;
    const id = Number(rid);
    if (!Number.isFinite(id)) return;
    getMenuConsoleRestaurantMenus(id)
      .then((data) => {
        const r = data.restaurant || { id, name: `Restaurant #${id}` };
        setSelectedRestaurant({
          id: r.id,
          name: r.restaurant_name || r.name,
          city: r.city,
          state: r.state,
          address_line1: r.address_line1,
          email: r.email,
        });
      })
      .catch(() => {});
  }, [searchParams, selectedRestaurant]);

  function setTab(tab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "uploads") next.set("tab", "uploads");
      else next.delete("tab");
      return next;
    });
  }

  return (
    <OwnerLayout title="Menu Manager" subtitle="Find restaurants across the platform. Open a menu to edit, upload, and publish.">
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "restaurants", label: "Restaurants" },
          { key: "uploads", label: "Upload Activity" },
        ].map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 600,
                border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                background: active ? OWNER_COLORS.accentSoft : "#fff",
                color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "uploads" ? (
        <UploadActivityTab
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          restaurantFilter={selectedRestaurant}
        />
      ) : (
        <MenuManagerTab
          selectedRestaurant={selectedRestaurant}
          setSelectedRestaurant={setSelectedRestaurant}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
      )}
    </OwnerLayout>
  );
}
