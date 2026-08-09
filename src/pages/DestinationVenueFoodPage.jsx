import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  fetchDestinationVenueInventory,
  fetchDestinationVenueItemAvailability,
  fetchDestinationVenueVendor,
  formatStadiumPrice,
  searchDestinationVenueMenuItems,
} from "../lib/destinationVenueApi.js";
import {
  addStadiumCartItem,
  loadStadiumCart,
  stadiumCartItemCount,
} from "../lib/stadiumOrderCart.js";

/** Secondary shortcuts into search — not the primary IA (LA Live pattern). */
const CATEGORY_CHIPS = [
  { id: "pizza", label: "Pizza", q: "pizza" },
  { id: "chicken", label: "Chicken", q: "chicken" },
  { id: "burgers", label: "Burgers", q: "burger" },
  { id: "drinks", label: "Drinks", q: "beer" },
];

const PAGE = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "1.25rem 1rem 5rem",
  width: "100%",
  boxSizing: "border-box",
  minHeight: "100dvh",
  background: "#fff",
  color: "#111827",
  fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
};

const STICKY = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "#fff",
  marginLeft: "-1rem",
  marginRight: "-1rem",
  padding: "0.7rem 1rem 0.8rem",
  borderBottom: "1px solid #e5e7eb",
  display: "grid",
  gap: "0.65rem",
  minWidth: 0,
};

const DISH_ROW = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
  boxSizing: "border-box",
  padding: "0.7rem 0.75rem 0.7rem 0.7rem",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  borderLeft: "3px solid #16a34a",
  background: "#ffffff",
  color: "#111827",
  textAlign: "left",
  cursor: "pointer",
  overflowWrap: "anywhere",
};

const VENDOR_CARD = {
  display: "grid",
  gap: "0.35rem",
  padding: "0.9rem 1rem",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  marginBottom: 10,
};

function locationLabel(loc) {
  if (!loc) return null;
  return loc.label || loc.location_description || (loc.section ? `§${loc.section}` : null);
}

function locationsLine(locations, locationsAvailable) {
  if (locationsAvailable === false) return "Location unavailable";
  const labels = (locations || []).map(locationLabel).filter(Boolean);
  if (!labels.length) return "Location unavailable";
  return labels.join(" · ");
}

function PriceText({ price, priceAvailable }) {
  const label = formatStadiumPrice(price, priceAvailable);
  if (label) {
    return (
      <span style={{ flexShrink: 0, fontWeight: 650, fontSize: "0.9rem", color: "#111827" }}>
        {label}
      </span>
    );
  }
  return (
    <span style={{ flexShrink: 0, fontWeight: 500, fontSize: "0.8rem", color: "#9ca3af" }}>
      Price unavailable
    </span>
  );
}

function ViewToggle({ tab, onChange }) {
  const pill = (active) => ({
    padding: "0.35rem 0.85rem",
    borderRadius: 999,
    border: active ? "1px solid #111827" : "1px solid #d1d5db",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#374151",
    fontSize: "0.85rem",
    fontWeight: 650,
    cursor: "pointer",
    minHeight: 36,
  });
  return (
    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }} role="tablist">
      <button type="button" role="tab" aria-selected={tab === "search"} style={pill(tab === "search")} onClick={() => onChange("search")}>
        Food
      </button>
      <button type="button" role="tab" aria-selected={tab === "vendors"} style={pill(tab === "vendors")} onClick={() => onChange("vendors")}>
        Vendors
      </button>
    </div>
  );
}

function StadiumSearchForm({
  searchInput,
  onSearchInputChange,
  searchActive,
  onSubmit,
  onClear,
  venueName,
}) {
  const placeholder = venueName ? `Search ${venueName}…` : "Search the stadium…";
  return (
    <form
      data-testid="stadium-sticky-search-form"
      onSubmit={onSubmit}
      style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}
    >
      <div style={{ flex: "1 1 220px", minWidth: 0, display: "grid", gap: "0.3rem" }}>
        <input
          type="search"
          value={searchInput}
          onChange={onSearchInputChange}
          placeholder={placeholder}
          aria-label={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "0.65rem 0.75rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: "1rem",
          }}
        />
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.35 }}>
          e.g. pizza, chicken sandwich, burger, beer
        </p>
      </div>
      <button
        type="submit"
        disabled={!searchInput.trim()}
        style={{
          padding: "0.65rem 1rem",
          borderRadius: 8,
          border: "none",
          background: searchInput.trim() ? "#111827" : "#9ca3af",
          color: "#fff",
          cursor: searchInput.trim() ? "pointer" : "not-allowed",
          alignSelf: "flex-start",
        }}
      >
        Search
      </button>
      {searchActive ? (
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}

export default function DestinationVenueFoodPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vendorSlugParam = searchParams.get("vendor") || "";
  const itemIdParam = searchParams.get("item") || "";
  const tab = searchParams.get("tab") === "vendors" ? "vendors" : "search";
  const activeQ = (searchParams.get("q") || "").trim();

  const [inventory, setInventory] = useState(null);
  const [cartCount, setCartCount] = useState(() =>
    stadiumCartItemCount(loadStadiumCart(slug))
  );
  const [orderMsg, setOrderMsg] = useState("");
  const [searchInput, setSearchInput] = useState(activeQ);
  const [items, setItems] = useState([]);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [vendorFilter, setVendorFilter] = useState(searchParams.get("vendorFilter") || "");
  const [sectionFilter, setSectionFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchInput(activeQ);
  }, [activeQ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchDestinationVenueInventory(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok) throw new Error(data?.error || "Failed to load stadium");
        setInventory(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load stadium");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const searchActive = Boolean(activeQ) || Boolean(vendorFilter);

  useEffect(() => {
    if (!slug || tab !== "search") return;
    if (!searchActive) {
      setItems([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchDestinationVenueMenuItems(slug, {
      q: activeQ,
      vendor: vendorFilter || null,
      limit: 60,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data?.items || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, activeQ, vendorFilter, tab, searchActive]);

  useEffect(() => {
    if (!vendorSlugParam) {
      setVendorDetail(null);
      return;
    }
    let cancelled = false;
    fetchDestinationVenueVendor(slug, vendorSlugParam)
      .then((data) => {
        if (!cancelled) setVendorDetail(data?.ok ? data : null);
      })
      .catch(() => {
        if (!cancelled) setVendorDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, vendorSlugParam]);

  useEffect(() => {
    if (!itemIdParam) {
      setItemDetail(null);
      return;
    }
    let cancelled = false;
    const fromSearch = items.find(
      (i) => String(i.ck_menu_item_id) === String(itemIdParam)
    );
    fetchDestinationVenueItemAvailability(slug, itemIdParam)
      .then((data) => {
        if (cancelled) return;
        const availability = data?.ok ? data.availability : null;
        setItemDetail({
          ...(fromSearch || {}),
          ...(availability || {}),
          ck_menu_item_id: itemIdParam,
          vendor_name:
            availability?.vendors?.[0]?.name || fromSearch?.vendor_name || null,
          vendor_slug:
            availability?.vendors?.[0]?.slug || fromSearch?.vendor_slug || null,
          vendor_id:
            availability?.vendors?.[0]?.id || fromSearch?.vendor_id || null,
          locations: availability?.locations || fromSearch?.locations || [],
          locations_available:
            availability?.locations_available ??
            fromSearch?.locations_available ??
            false,
          price: availability?.price ?? fromSearch?.price ?? null,
          price_available:
            availability?.price_available ?? fromSearch?.price_available ?? false,
          item_name: availability?.item_name || fromSearch?.item_name || "Item",
          description: fromSearch?.description || null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setItemDetail(
            fromSearch
              ? { ...fromSearch }
              : { ck_menu_item_id: itemIdParam, item_name: "Item", locations: [] }
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, itemIdParam, items]);

  const venue = inventory?.venue;
  const vendors = inventory?.vendors || [];
  const vendorsWithMenus = useMemo(
    () => vendors.filter((v) => v.has_menu),
    [vendors]
  );

  const sectionOptions = useMemo(() => {
    const set = new Set();
    for (const item of items) {
      for (const loc of item.locations || []) {
        if (loc.section) set.add(String(loc.section));
        else if (loc.label) set.add(loc.label);
      }
    }
    return [...set].sort();
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (priceFilter === "available" && !item.price_available) return false;
      if (priceFilter === "unavailable" && item.price_available) return false;
      if (sectionFilter) {
        const match = (item.locations || []).some(
          (l) =>
            String(l.section || "") === sectionFilter ||
            String(l.label || "") === sectionFilter
        );
        if (!match) return false;
      }
      return true;
    });
  }, [items, priceFilter, sectionFilter]);

  function patchParams(mutator, { replace = true } = {}) {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next, { replace });
  }

  function setTab(next) {
    patchParams((p) => {
      if (next === "vendors") p.set("tab", "vendors");
      else p.delete("tab");
      p.delete("vendor");
      p.delete("item");
    });
  }

  function openVendor(vendorSlug) {
    patchParams((p) => {
      p.set("vendor", vendorSlug);
      p.delete("item");
      p.delete("tab");
    }, { replace: false });
  }

  function openItem(ckId) {
    patchParams((p) => {
      p.set("item", String(ckId));
      p.delete("vendor");
    }, { replace: false });
  }

  function clearVendor() {
    patchParams((p) => p.delete("vendor"));
  }

  function clearItem() {
    patchParams((p) => p.delete("item"));
  }

  function commitSearch(raw) {
    const value = String(raw || "").trim();
    setActiveCategory("");
    patchParams((p) => {
      if (value) p.set("q", value);
      else p.delete("q");
      p.delete("tab");
      p.delete("item");
      p.delete("vendor");
    });
  }

  function onSearchSubmit(e) {
    e.preventDefault();
    commitSearch(searchInput);
  }

  function onClearSearch() {
    setSearchInput("");
    setActiveCategory("");
    setVendorFilter("");
    setSectionFilter("");
    setPriceFilter("all");
    setShowFilters(false);
    patchParams((p) => {
      p.delete("q");
      p.delete("vendorFilter");
    });
  }

  function applyCategory(chip) {
    if (activeCategory === chip.id && activeQ === chip.q) {
      setActiveCategory("");
      setSearchInput("");
      commitSearch("");
      return;
    }
    setActiveCategory(chip.id);
    setSearchInput(chip.q);
    commitSearch(chip.q);
  }

  function addItemToOrder(item) {
    setOrderMsg("");
    const result = addStadiumCartItem(slug, {
      item,
      vendor: {
        id: item.vendor_id,
        slug: item.vendor_slug,
        name: item.vendor_name,
      },
      quantity: 1,
    });
    if (!result.ok) {
      setOrderMsg(result.error || "Could not add item");
      return;
    }
    setCartCount(stadiumCartItemCount(result.cart));
    navigate(`/destination-venues/${encodeURIComponent(slug)}/order?step=cart`);
  }

  useEffect(() => {
    setCartCount(stadiumCartItemCount(loadStadiumCart(slug)));
  }, [slug]);

  const backLink = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Link
        to={`/destination-venues/${encodeURIComponent(slug)}`}
        style={{ color: "#374151", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}
      >
        ← {venue?.name || "Stadium"}
      </Link>
      {cartCount > 0 ? (
        <Link
          to={`/destination-venues/${encodeURIComponent(slug)}/order`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 32,
            borderRadius: 999,
            padding: "0 10px",
            background: "#ecfdf5",
            color: "#047857",
            fontWeight: 700,
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          Order · {cartCount}
        </Link>
      ) : null}
    </div>
  );

  if (loading) {
    return (
      <div style={PAGE}>
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading stadium food…</div>
        <BottomNav />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={PAGE}>
        <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>{error || "Stadium not found"}</div>
        <BottomNav />
      </div>
    );
  }

  if (itemDetail && itemIdParam) {
    const locLine = locationsLine(itemDetail.locations, itemDetail.locations_available);
    return (
      <div style={PAGE}>
        <header style={{ marginBottom: "0.85rem", display: "grid", gap: "0.65rem" }}>
          <button
            type="button"
            onClick={clearItem}
            style={{
              alignSelf: "flex-start",
              border: "1px solid #d1d5db",
              background: "#fff",
              borderRadius: 8,
              padding: "0.45rem 0.75rem",
              cursor: "pointer",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            ← Results
          </button>
          <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {itemDetail.item_name}
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
            {itemDetail.vendor_name || "Vendor"}
          </p>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.85rem" }}>{locLine}</p>
        </header>
        <div style={{ ...VENDOR_CARD, gap: "0.75rem" }}>
          <PriceText price={itemDetail.price} priceAvailable={itemDetail.price_available} />
          {itemDetail.description ? (
            <p style={{ margin: 0, color: "#4b5563", fontSize: "0.92rem", lineHeight: 1.45 }}>
              {itemDetail.description}
            </p>
          ) : null}
          {itemDetail.vendor_slug ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => openVendor(itemDetail.vendor_slug)}
                style={{
                  minHeight: 40,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  padding: "0 12px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                View menu
              </button>
              {itemDetail.ck_menu_item_id ? (
                <Link
                  to={`/menu-items/${itemDetail.ck_menu_item_id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 40,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    padding: "0 12px",
                    fontWeight: 650,
                    textDecoration: "none",
                    color: "#111827",
                  }}
                >
                  Nutrition & details
                </Link>
              ) : null}
            </div>
          ) : null}
          {orderMsg ? (
            <p style={{ margin: 0, color: "#b91c1c", fontSize: "0.9rem" }}>{orderMsg}</p>
          ) : null}
          <button
            type="button"
            onClick={() => addItemToOrder(itemDetail)}
            style={{
              minHeight: 48,
              width: "100%",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Add to order
          </button>
          <p style={{ margin: 0, textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
            Demo seat delivery — no payment collected
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (vendorDetail?.vendor) {
    const v = vendorDetail.vendor;
    const locLine = locationsLine(v.locations, (v.locations || []).length > 0);
    return (
      <div style={PAGE}>
        <header style={{ marginBottom: "0.85rem", display: "grid", gap: "0.55rem" }}>
          <button
            type="button"
            onClick={clearVendor}
            style={{
              alignSelf: "flex-start",
              border: "1px solid #d1d5db",
              background: "#fff",
              borderRadius: 8,
              padding: "0.45rem 0.75rem",
              cursor: "pointer",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            ← Stadium food
          </button>
          <h1 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 700 }}>{v.name}</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
            {locLine}
            {v.items?.length ? ` · ${v.items.length} menu items` : ""}
          </p>
        </header>
        <div style={{ display: "grid", gap: 8 }}>
          {!v.items?.length ? (
            <div style={{ textAlign: "center", padding: 36, color: "#6b7280" }}>
              No menu items listed for this vendor yet.
            </div>
          ) : (
            v.items.map((item) => (
              <button
                key={item.ck_menu_item_id}
                type="button"
                style={DISH_ROW}
                onClick={() => openItem(item.ck_menu_item_id)}
              >
                <span style={{ display: "grid", gap: "0.15rem", minWidth: 0, flex: 1 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 650, fontSize: "0.95rem" }}>{item.item_name}</span>
                    <PriceText price={item.price} priceAvailable={item.price_available} />
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                    {locationsLine(
                      item.locations || v.locations,
                      item.locations_available ?? (v.locations || []).length > 0
                    )}
                  </span>
                </span>
                <span aria-hidden="true" style={{ color: "#9ca3af" }}>→</span>
              </button>
            ))
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <header style={{ marginBottom: "0.85rem", display: "grid", gap: "0.75rem" }}>
        {backLink}
        <h1
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "1.85rem",
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {venue.name} Food & Drink
        </h1>
        <p style={{ margin: 0, color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.45, maxWidth: 520 }}>
          Search the stadium for what you want — then see the vendor and where to get it.
        </p>
      </header>

      <div data-testid="stadium-sticky-chrome" style={STICKY}>
        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: "1.2rem",
            lineHeight: 1.2,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {venue.name}
        </h2>
        <ViewToggle tab={tab} onChange={setTab} />
        {tab === "search" ? (
          <StadiumSearchForm
            searchInput={searchInput}
            onSearchInputChange={(e) => setSearchInput(e.target.value)}
            searchActive={searchActive}
            onSubmit={onSearchSubmit}
            onClear={onClearSearch}
            venueName={venue.name}
          />
        ) : null}
      </div>

      <main style={{ marginTop: "1rem" }}>
        {tab === "search" ? (
          <>
            <p style={{ margin: "0 0 0.45rem", fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>
              Popular searches
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 8,
                marginBottom: searchActive ? 8 : 4,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {CATEGORY_CHIPS.map((chip) => {
                const active = activeCategory === chip.id || activeQ === chip.q;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => applyCategory(chip)}
                    style={{
                      flex: "0 0 auto",
                      borderRadius: 999,
                      border: active ? "1px solid #111827" : "1px solid #d1d5db",
                      background: active ? "#111827" : "#fff",
                      color: active ? "#fff" : "#374151",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.85rem",
                      fontWeight: 650,
                      cursor: "pointer",
                      minHeight: 36,
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {!searchActive ? (
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "1.5rem 1rem",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#4b5563",
                  fontSize: "0.95rem",
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontWeight: 650, color: "#111827" }}>What are you looking for?</p>
                <p style={{ margin: "0.5rem 0 0" }}>
                  Type above or tap a shortcut — pizza, chicken, burgers, drinks, and more.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "0.5rem 0 0.75rem" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
                    {searching
                      ? "Searching…"
                      : `${visibleItems.length} result${visibleItems.length === 1 ? "" : "s"}${
                          activeQ ? ` for “${activeQ}”` : ""
                        }`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontWeight: 650,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {showFilters ? "Hide filters" : "Filters"}
                  </button>
                </div>

                {showFilters ? (
                  <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                        Vendor
                      </p>
                      <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <button
                          type="button"
                          onClick={() => setVendorFilter("")}
                          style={{
                            flex: "0 0 auto",
                            borderRadius: 999,
                            border: !vendorFilter ? "1px solid #111827" : "1px solid #d1d5db",
                            background: !vendorFilter ? "#111827" : "#fff",
                            color: !vendorFilter ? "#fff" : "#374151",
                            padding: "0.4rem 0.75rem",
                            fontSize: "0.8rem",
                            fontWeight: 650,
                            cursor: "pointer",
                          }}
                        >
                          All
                        </button>
                        {vendorsWithMenus.slice(0, 14).map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() =>
                              setVendorFilter((cur) => (cur === v.slug ? "" : v.slug))
                            }
                            style={{
                              flex: "0 0 auto",
                              borderRadius: 999,
                              border: vendorFilter === v.slug ? "1px solid #111827" : "1px solid #d1d5db",
                              background: vendorFilter === v.slug ? "#111827" : "#fff",
                              color: vendorFilter === v.slug ? "#fff" : "#374151",
                              padding: "0.4rem 0.75rem",
                              fontSize: "0.8rem",
                              fontWeight: 650,
                              cursor: "pointer",
                            }}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    {sectionOptions.length > 0 ? (
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                          Section
                        </p>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                          <button
                            type="button"
                            onClick={() => setSectionFilter("")}
                            style={{
                              flex: "0 0 auto",
                              borderRadius: 999,
                              border: !sectionFilter ? "1px solid #111827" : "1px solid #d1d5db",
                              background: !sectionFilter ? "#111827" : "#fff",
                              color: !sectionFilter ? "#fff" : "#374151",
                              padding: "0.4rem 0.75rem",
                              fontSize: "0.8rem",
                              fontWeight: 650,
                              cursor: "pointer",
                            }}
                          >
                            All
                          </button>
                          {sectionOptions.slice(0, 16).map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() =>
                                setSectionFilter((cur) => (cur === sec ? "" : sec))
                              }
                              style={{
                                flex: "0 0 auto",
                                borderRadius: 999,
                                border: sectionFilter === sec ? "1px solid #111827" : "1px solid #d1d5db",
                                background: sectionFilter === sec ? "#111827" : "#fff",
                                color: sectionFilter === sec ? "#fff" : "#374151",
                                padding: "0.4rem 0.75rem",
                                fontSize: "0.8rem",
                                fontWeight: 650,
                                cursor: "pointer",
                              }}
                            >
                              {/^§|section\b/i.test(sec) ? sec : `§${sec}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div>
                      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                        Price
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { id: "all", label: "All" },
                          { id: "available", label: "Priced" },
                          { id: "unavailable", label: "Price unavailable" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPriceFilter(opt.id)}
                            style={{
                              borderRadius: 999,
                              border: priceFilter === opt.id ? "1px solid #111827" : "1px solid #d1d5db",
                              background: priceFilter === opt.id ? "#111827" : "#fff",
                              color: priceFilter === opt.id ? "#fff" : "#374151",
                              padding: "0.4rem 0.75rem",
                              fontSize: "0.8rem",
                              fontWeight: 650,
                              cursor: "pointer",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {!searching && visibleItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#6b7280" }}>
                    No items match “{activeQ || "your filters"}”.
                  </div>
                ) : null}

                <div style={{ display: "grid", gap: 8 }}>
                  {!searching
                    ? visibleItems.map((item) => {
                        const locLine = locationsLine(
                          item.locations,
                          item.locations_available
                        );
                        return (
                          <button
                            key={`${item.ck_menu_item_id}-${item.vendor_id}`}
                            type="button"
                            style={DISH_ROW}
                            onClick={() => openItem(item.ck_menu_item_id)}
                          >
                            <span style={{ display: "grid", gap: "0.15rem", minWidth: 0, flex: 1 }}>
                              <span style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                                <span style={{ fontWeight: 650, fontSize: "0.95rem" }}>
                                  {item.item_name}
                                </span>
                                <PriceText
                                  price={item.price}
                                  priceAvailable={item.price_available}
                                />
                              </span>
                              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                {item.vendor_name}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{locLine}</span>
                            </span>
                            <span aria-hidden="true" style={{ color: "#9ca3af" }}>→</span>
                          </button>
                        );
                      })
                    : null}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {vendors.map((v) => {
              const locLine = locationsLine(v.locations, (v.locations || []).length > 0);
              return (
                <article key={v.id} style={VENDOR_CARD}>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>{v.name}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.88rem" }}>
                    {v.has_menu
                      ? `${v.item_count} items`
                      : "Menu not listed yet"}
                    {v.location_count
                      ? ` · ${v.location_count} location${v.location_count === 1 ? "" : "s"}`
                      : ""}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "0.82rem" }}>{locLine}</div>
                  <button
                    type="button"
                    onClick={() => openVendor(v.slug)}
                    style={{
                      marginTop: 4,
                      alignSelf: "flex-start",
                      minHeight: 40,
                      borderRadius: 8,
                      border: "none",
                      background: "#111827",
                      color: "#fff",
                      padding: "0 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {v.has_menu ? "View menu" : "View vendor"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
