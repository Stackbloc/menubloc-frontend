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

const CATEGORY_CHIPS = [
  { id: "pizza", label: "Pizza", q: "pizza" },
  { id: "chicken", label: "Chicken", q: "chicken" },
  { id: "burgers", label: "Burgers", q: "burger" },
  { id: "mexican", label: "Mexican", q: "taco" },
  { id: "drinks", label: "Drinks", q: "beer" },
  { id: "desserts", label: "Desserts", q: "dessert" },
  { id: "snacks", label: "Snacks", q: "snack" },
];

const css = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(180deg, #0f1a24 0%, #152535 40%, #1a2a38 100%)",
    color: "#f2f5f7",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    paddingBottom: 88,
  },
  sticky: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(15, 26, 36, 0.96)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 16px 14px",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "rgba(242,245,247,0.65)",
  },
  prompt: {
    margin: "10px 0 0",
    fontSize: 15,
    fontWeight: 600,
    color: "rgba(242,245,247,0.88)",
  },
  searchWrap: { marginTop: 10 },
  search: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 17,
    padding: "14px 16px",
    outline: "none",
  },
  tabs: { display: "flex", gap: 8, marginTop: 12 },
  tab: (active) => ({
    flex: 1,
    border: "none",
    borderRadius: 999,
    padding: "11px 12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 44,
    background: active ? "#3dd68c" : "rgba(255,255,255,0.08)",
    color: active ? "#0b1a12" : "rgba(242,245,247,0.85)",
  }),
  body: { padding: "12px 16px 24px" },
  chipRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 4,
    WebkitOverflowScrolling: "touch",
  },
  chip: (active) => ({
    flex: "0 0 auto",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: active ? "rgba(61,214,140,0.22)" : "transparent",
    color: active ? "#3dd68c" : "rgba(242,245,247,0.85)",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    minHeight: 40,
  }),
  filterLabel: {
    margin: "10px 0 6px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "rgba(242,245,247,0.45)",
  },
  card: {
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 14px 12px",
    marginBottom: 10,
  },
  itemName: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    textTransform: "uppercase",
  },
  meta: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "rgba(242,245,247,0.72)",
    lineHeight: 1.35,
  },
  price: { margin: 0, fontSize: 16, fontWeight: 800, color: "#3dd68c" },
  priceMissing: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(242,245,247,0.45)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 12,
    border: "none",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 800,
    background: "#3dd68c",
    color: "#0b1a12",
    textDecoration: "none",
    cursor: "pointer",
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 700,
    background: "transparent",
    color: "rgba(242,245,247,0.9)",
    textDecoration: "none",
    cursor: "pointer",
  },
  orderBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
    borderRadius: 14,
    border: "none",
    marginTop: 16,
    fontSize: 16,
    fontWeight: 800,
    background: "#3dd68c",
    color: "#0b1a12",
    cursor: "pointer",
  },
  cartChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 40,
    borderRadius: 999,
    padding: "0 12px",
    marginLeft: 8,
    background: "rgba(61,214,140,0.18)",
    color: "#3dd68c",
    fontWeight: 800,
    fontSize: 13,
    textDecoration: "none",
  },
  empty: {
    textAlign: "center",
    padding: "36px 12px",
    color: "rgba(242,245,247,0.55)",
    fontSize: 15,
  },
  locPill: {
    display: "inline-block",
    marginTop: 8,
    marginRight: 6,
    padding: "7px 11px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(61,214,140,0.12)",
    color: "rgba(242,245,247,0.92)",
  },
  locMissing: {
    display: "inline-block",
    marginTop: 8,
    padding: "7px 11px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(255,255,255,0.06)",
    color: "rgba(242,245,247,0.45)",
  },
  availableLabel: {
    margin: "10px 0 0",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "rgba(242,245,247,0.45)",
  },
};

function locationLabel(loc) {
  if (!loc) return null;
  return loc.label || loc.location_description || (loc.section ? `Section ${loc.section}` : null);
}

function LocationBlock({ locations, locationsAvailable }) {
  const known =
    locationsAvailable === false
      ? []
      : (locations || []).filter((l) => locationLabel(l));
  if (!known.length) {
    return <span style={css.locMissing}>Location unavailable</span>;
  }
  return (
    <>
      <p style={css.availableLabel}>Available</p>
      {known.map((loc) => (
        <span key={loc.id || locationLabel(loc)} style={css.locPill}>
          {locationLabel(loc)}
        </span>
      ))}
    </>
  );
}

function PriceLine({ price, priceAvailable }) {
  const label = formatStadiumPrice(price, priceAvailable);
  if (label) return <p style={css.price}>{label}</p>;
  return <p style={css.priceMissing}>Price unavailable</p>;
}

export default function DestinationVenueFoodPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const vendorSlugParam = searchParams.get("vendor") || "";
  const itemIdParam = searchParams.get("item") || "";
  const tab = searchParams.get("tab") === "vendors" ? "vendors" : "search";

  const [inventory, setInventory] = useState(null);
  const [cartCount, setCartCount] = useState(() =>
    stadiumCartItemCount(loadStadiumCart(slug))
  );
  const [orderMsg, setOrderMsg] = useState("");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [items, setItems] = useState([]);
  const [vendorDetail, setVendorDetail] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [vendorFilter, setVendorFilter] = useState(searchParams.get("vendorFilter") || "");
  const [sectionFilter, setSectionFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all"); // all | available | unavailable
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

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

  useEffect(() => {
    if (!slug || tab !== "search") return;
    let cancelled = false;
    setSearching(true);
    searchDestinationVenueMenuItems(slug, {
      q: debouncedQ,
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
  }, [slug, debouncedQ, vendorFilter, tab]);

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

  function onSearchChange(value) {
    setQ(value);
    setActiveCategory("");
    patchParams((p) => {
      if (value.trim()) p.set("q", value.trim());
      else p.delete("q");
    });
  }

  function applyCategory(chip) {
    if (activeCategory === chip.id) {
      setActiveCategory("");
      setQ("");
      patchParams((p) => p.delete("q"));
      return;
    }
    setActiveCategory(chip.id);
    setQ(chip.q);
    patchParams((p) => p.set("q", chip.q));
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

  if (loading) {
    return (
      <div style={css.page}>
        <div style={css.empty}>Loading stadium food…</div>
        <BottomNav />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={css.page}>
        <div style={css.empty}>{error || "Stadium not found"}</div>
        <BottomNav />
      </div>
    );
  }

  if (itemDetail && itemIdParam) {
    return (
      <div style={css.page}>
        <header style={css.sticky}>
          <button type="button" style={css.ghostBtn} onClick={clearItem}>
            ← Results
          </button>
          <h1 style={{ ...css.title, marginTop: 12, textTransform: "uppercase" }}>
            {itemDetail.item_name}
          </h1>
          <p style={css.subtitle}>{itemDetail.vendor_name || "Vendor"}</p>
        </header>
        <main style={css.body}>
          <div style={css.card}>
            <PriceLine
              price={itemDetail.price}
              priceAvailable={itemDetail.price_available}
            />
            {itemDetail.description ? (
              <p style={css.meta}>{itemDetail.description}</p>
            ) : null}
            <LocationBlock
              locations={itemDetail.locations}
              locationsAvailable={itemDetail.locations_available}
            />
            {itemDetail.vendor_slug ? (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={css.btn}
                  onClick={() => openVendor(itemDetail.vendor_slug)}
                >
                  View vendor
                </button>
                {itemDetail.ck_menu_item_id ? (
                  <Link
                    to={`/menu-items/${itemDetail.ck_menu_item_id}`}
                    style={css.ghostBtn}
                  >
                    Nutrition & details
                  </Link>
                ) : null}
              </div>
            ) : null}
            {orderMsg ? (
              <p style={{ ...css.meta, color: "#fecaca", marginTop: 12 }}>{orderMsg}</p>
            ) : null}
            <button
              type="button"
              style={css.orderBtn}
              onClick={() => addItemToOrder(itemDetail)}
            >
              Add to order
            </button>
            <p style={{ ...css.meta, marginTop: 8, textAlign: "center" }}>
              Demo seat delivery — no payment collected
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (vendorDetail?.vendor) {
    const v = vendorDetail.vendor;
    const locLabels = (v.locations || [])
      .map(locationLabel)
      .filter(Boolean);
    return (
      <div style={css.page}>
        <header style={css.sticky}>
          <button type="button" style={css.ghostBtn} onClick={clearVendor}>
            ← Stadium food
          </button>
          <h1 style={{ ...css.title, marginTop: 12 }}>{v.name}</h1>
          <p style={css.subtitle}>
            {locLabels.length
              ? locLabels.join(" · ")
              : "Location unavailable"}
            {v.items?.length ? ` · ${v.items.length} menu items` : ""}
          </p>
        </header>
        <main style={css.body}>
          {!v.items?.length ? (
            <div style={css.empty}>No menu items listed for this vendor yet.</div>
          ) : (
            v.items.map((item) => (
              <article key={item.ck_menu_item_id} style={css.card}>
                <div style={css.row}>
                  <div style={{ flex: 1 }}>
                    <h2 style={css.itemName}>{item.item_name}</h2>
                    {item.description ? (
                      <p style={css.meta}>{item.description}</p>
                    ) : null}
                    <LocationBlock
                      locations={item.locations || v.locations}
                      locationsAvailable={
                        item.locations_available ?? v.locations_available
                      }
                    />
                  </div>
                  <PriceLine price={item.price} priceAvailable={item.price_available} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    style={css.btn}
                    onClick={() => openItem(item.ck_menu_item_id)}
                  >
                    View item
                  </button>
                </div>
              </article>
            ))
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={css.page}>
      <header style={css.sticky}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <Link
            to={`/destination-venues/${encodeURIComponent(slug)}`}
            style={css.ghostBtn}
          >
            ← {venue.name}
          </Link>
          {cartCount > 0 ? (
            <Link
              to={`/destination-venues/${encodeURIComponent(slug)}/order`}
              style={css.cartChip}
            >
              Order · {cartCount}
            </Link>
          ) : null}
        </div>
        <h1 style={css.title}>{venue.name}</h1>
        <p style={css.prompt}>What are you looking for?</p>
        <div style={css.searchWrap}>
          <input
            style={css.search}
            type="search"
            enterKeyHint="search"
            placeholder="Search food & drink"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search stadium food and drink"
          />
        </div>
        <div style={css.tabs}>
          <button type="button" style={css.tab(tab === "search")} onClick={() => setTab("search")}>
            Search
          </button>
          <button
            type="button"
            style={css.tab(tab === "vendors")}
            onClick={() => setTab("vendors")}
          >
            Vendors
          </button>
        </div>
      </header>

      <main style={css.body}>
        {tab === "search" ? (
          <>
            <div style={css.chipRow}>
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  style={css.chip(activeCategory === chip.id || q === chip.q)}
                  onClick={() => applyCategory(chip)}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                style={css.chip(tab === "vendors")}
                onClick={() => setTab("vendors")}
              >
                More
              </button>
            </div>

            <p style={css.filterLabel}>Vendor</p>
            <div style={css.chipRow}>
              <button
                type="button"
                style={css.chip(!vendorFilter)}
                onClick={() => setVendorFilter("")}
              >
                All
              </button>
              {vendorsWithMenus.slice(0, 14).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  style={css.chip(vendorFilter === v.slug)}
                  onClick={() =>
                    setVendorFilter((cur) => (cur === v.slug ? "" : v.slug))
                  }
                >
                  {v.name}
                </button>
              ))}
            </div>

            {sectionOptions.length > 0 ? (
              <>
                <p style={css.filterLabel}>Section</p>
                <div style={css.chipRow}>
                  <button
                    type="button"
                    style={css.chip(!sectionFilter)}
                    onClick={() => setSectionFilter("")}
                  >
                    All
                  </button>
                  {sectionOptions.slice(0, 16).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      style={css.chip(sectionFilter === sec)}
                      onClick={() =>
                        setSectionFilter((cur) => (cur === sec ? "" : sec))
                      }
                    >
                      {/^section\b/i.test(sec) ? sec : `Section ${sec}`}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <p style={css.filterLabel}>Price</p>
            <div style={css.chipRow}>
              {[
                { id: "all", label: "All" },
                { id: "available", label: "Priced" },
                { id: "unavailable", label: "Price unavailable" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  style={css.chip(priceFilter === opt.id)}
                  onClick={() => setPriceFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {searching ? <div style={css.empty}>Searching…</div> : null}
            {!searching && visibleItems.length === 0 ? (
              <div style={css.empty}>
                {debouncedQ
                  ? `No items match “${debouncedQ}”.`
                  : "No menu items available yet. Browse Vendors for what’s known."}
              </div>
            ) : null}

            {!searching
              ? visibleItems.map((item) => (
                  <article
                    key={`${item.ck_menu_item_id}-${item.vendor_id}`}
                    style={css.card}
                  >
                    <div style={css.row}>
                      <div style={{ flex: 1 }}>
                        <h2 style={css.itemName}>{item.item_name}</h2>
                        <p style={css.meta}>{item.vendor_name}</p>
                        {item.description ? (
                          <p style={css.meta}>{item.description}</p>
                        ) : null}
                        <LocationBlock
                          locations={item.locations}
                          locationsAvailable={item.locations_available}
                        />
                      </div>
                      <PriceLine
                        price={item.price}
                        priceAvailable={item.price_available}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        style={css.btn}
                        onClick={() => openItem(item.ck_menu_item_id)}
                      >
                        View item
                      </button>
                      <button
                        type="button"
                        style={css.ghostBtn}
                        onClick={() => openVendor(item.vendor_slug)}
                      >
                        Vendor
                      </button>
                    </div>
                  </article>
                ))
              : null}
          </>
        ) : (
          <>
            {vendors.map((v) => (
              <article key={v.id} style={css.card}>
                <h2 style={{ ...css.itemName, textTransform: "none" }}>{v.name}</h2>
                <p style={css.meta}>
                  {v.has_menu
                    ? `${v.item_count} items`
                    : "Menu not listed yet"}
                  {v.location_count
                    ? ` · ${v.location_count} location${
                        v.location_count === 1 ? "" : "s"
                      }`
                    : ""}
                </p>
                <LocationBlock
                  locations={v.locations}
                  locationsAvailable={(v.locations || []).length > 0}
                />
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    style={css.btn}
                    onClick={() => openVendor(v.slug)}
                  >
                    {v.has_menu ? "View menu" : "View vendor"}
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
