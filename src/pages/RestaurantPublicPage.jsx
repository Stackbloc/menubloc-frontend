/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * File: RestaurantPublicPage.jsx
 * Date: 2026-03-10
 * Purpose:
 *   Grubbid public restaurant profile page. React route:
 *     /restaurants/:slugOrId
 *
 *   Primary destination for:
 *     - Search result restaurant name clicks
 *     - QR code scan landings (/qr/:token → /restaurants/:slugOrId)
 *
 *   Behavior:
 *     - Claimed restaurants render the normal public profile
 *     - Unclaimed / seeded restaurants render a stub sales page
 *     - Food trucks receive food-truck-aware unclaimed copy/labels
 *
 *   Tier-aware layout for claimed restaurants:
 *     Verified — name + "✓ Verified", address, phone, category/cuisine,
 *                distance, active deals, View Menu
 *     Pro      — everything above + logo (left of name), bio, featured
 *                dish, landmarks
 *
 *   Full menu is NOT shown here.
 *   "View Menu →" links to /public/restaurants/:id/menu (PublicMenuPage).
 *
 *   Profile tier values coded against: "pro" | "verified"
 *   Data source: GET /public/restaurants/:slugOrId
 * ============================================================
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HomeButton } from "../components/NavButton.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const THEME_KEY = "grubbid_theme";

/* ---- Theme persistence ---- */

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function saveTheme(t) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* ignore */
  }
}

/* ---- Helpers ---- */

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function normalizeTier(profileTier, listingStatus) {
  for (const v of [profileTier, listingStatus]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("pro")) return "pro";
    if (s.includes("verified")) return "verified";
  }
  return "";
}

function normalizeClaimStatus(v) {
  return String(v || "").trim().toLowerCase();
}

function isClaimedRestaurant(data) {
  return normalizeClaimStatus(data?.claim_status) === "claimed";
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

function humanizeLabel(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectFoodTruck(data) {
  const haystack = [
    data?.restaurant_name,
    data?.name,
    data?.category,
    data?.cuisine,
    data?.address,
    data?.address_line1,
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");

  return /\bfood truck\b|\btruck\b|\bmobile\b|\btrailer\b/.test(haystack);
}

function getTierTheme(tier, isDark) {
  if (tier === "pro") {
    return {
      accentBarColor: isDark ? "#2563eb" : "#1a4f95",
      cardBorder: isDark ? "2px solid rgba(59,130,246,0.40)" : "2px solid #b9d6fb",
      cardShadow: isDark ? "0 16px 50px rgba(0,0,0,0.45)" : "0 12px 40px rgba(26,79,149,0.14)",
      heroBg: isDark ? "#06101f" : "#eef5ff",
      heroBorderBottom: isDark ? "1px solid rgba(59,130,246,0.15)" : "1px solid #d1e4fb",
      nameSize: 30,
      nameWeight: 900,
      nameColor: isDark ? "#f0f6ff" : "#0f172a",
      badgeColor: isDark ? "#60a5fa" : "#1e40af",
      metaColor: isDark ? "rgba(147,197,253,0.75)" : "#3b5ea6",
      sectionColor: isDark ? "#60a5fa" : "#1e40af",
      dealDot: isDark ? "#3b82f6" : "#1d4ed8",
      featuredBg: isDark ? "rgba(59,130,246,0.08)" : "#eff6ff",
      featuredBorder: isDark ? "rgba(59,130,246,0.22)" : "#bfdbfe",
      viewMenuBg: "#1d4ed8",
      viewMenuColor: "#ffffff",
      viewMenuBorder: "none",
    };
  }

  if (tier === "verified") {
    return {
      accentBarColor: null,
      cardBorder: isDark ? "2px solid rgba(74,222,128,0.28)" : "2px solid #86efac",
      cardShadow: isDark ? "0 12px 40px rgba(0,0,0,0.38)" : "0 10px 32px rgba(22,101,52,0.10)",
      heroBg: isDark ? "#040f09" : "#f0fff7",
      heroBorderBottom: isDark ? "1px solid rgba(74,222,128,0.12)" : "1px solid #bbf7d0",
      nameSize: 26,
      nameWeight: 900,
      nameColor: isDark ? "#ecfdf5" : "#052e16",
      badgeColor: isDark ? "#4ade80" : "#15803d",
      metaColor: isDark ? "rgba(134,239,172,0.75)" : "#166534",
      sectionColor: isDark ? "#4ade80" : "#15803d",
      dealDot: isDark ? "#4ade80" : "#15803d",
      featuredBg: isDark ? "rgba(74,222,128,0.07)" : "#f0fff4",
      featuredBorder: isDark ? "rgba(74,222,128,0.20)" : "#bbf7d0",
      viewMenuBg: "#15803d",
      viewMenuColor: "#ffffff",
      viewMenuBorder: "none",
    };
  }

  return {
    accentBarColor: null,
    cardBorder: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e4e9f0",
    cardShadow: isDark ? "0 8px 24px rgba(0,0,0,0.30)" : "0 6px 18px rgba(16,24,40,0.06)",
    heroBg: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
    heroBorderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e9eef5",
    nameSize: 24,
    nameWeight: 800,
    nameColor: isDark ? "#f1f5f9" : "#0f172a",
    badgeColor: null,
    metaColor: isDark ? "rgba(255,255,255,0.50)" : "#64748b",
    sectionColor: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
    dealDot: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
    featuredBg: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
    featuredBorder: isDark ? "rgba(255,255,255,0.10)" : "#e4e9f0",
    viewMenuBg: "transparent",
    viewMenuColor: isDark ? "rgba(255,255,255,0.60)" : "#475569",
    viewMenuBorder: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
  };
}

function FieldRow({ label, value, placeholder, isDark }) {
  const hasValue = Boolean(String(value || "").trim());

  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #eef2f7",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: isDark ? "rgba(255,255,255,0.42)" : "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: hasValue
            ? isDark
              ? "#e2e8f0"
              : "#0f172a"
            : isDark
            ? "rgba(255,255,255,0.55)"
            : "#64748b",
          fontStyle: hasValue ? "normal" : "italic",
        }}
      >
        {hasValue ? value : placeholder}
      </div>
    </div>
  );
}

function UnclaimedRestaurantPage({ data, isDark, slugOrId }) {
  const isFoodTruck = detectFoodTruck(data);

  const name =
    firstNonEmpty(data?.restaurant_name, data?.name) || `Restaurant ${slugOrId}`;

  const addressLine1 = firstNonEmpty(data?.address, data?.address_line1);
  const city = firstNonEmpty(data?.city);
  const stateVal = firstNonEmpty(data?.state, data?.region);
  const postalCode = firstNonEmpty(data?.zip, data?.postal_code, data?.postcode);
  const phone = firstNonEmpty(data?.phone);
  const websiteRaw = firstNonEmpty(data?.website, data?.website_url);
  const website = normalizeUrl(websiteRaw);
  const cuisine = humanizeLabel(firstNonEmpty(data?.cuisine));
  const category = humanizeLabel(firstNonEmpty(data?.category));

  const pageBg = isDark ? "#0b0b0f" : "transparent";
  const pageColor = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "#64748b";
  const cardBg = isDark ? "#111218" : "#ffffff";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e4e9f0";
  const cardShadow = isDark ? "0 12px 40px rgba(0,0,0,0.34)" : "0 10px 30px rgba(15,23,42,0.07)";
  const heroBg = isDark ? "#10151d" : "#f8fbff";

  const verifiedMessage = isFoodTruck
    ? "Your information appears here with a free Verified subscription."
    : "Your information appears here with a free Verified subscription.";

  const proMessage = isFoodTruck
    ? "Your information appears here with Pro subscription."
    : "Your information appears here with Pro subscription.";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: pageColor,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        padding: "20px 16px 64px",
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <HomeButton />
      </div>

      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 1fr)",
          gap: 22,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: cardBorder,
            boxShadow: cardShadow,
            background: cardBg,
          }}
        >
          <div
            style={{
              padding: "24px 24px 22px",
              background: heroBg,
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e9eef5",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: muted,
                marginBottom: 8,
              }}
            >
              {isFoodTruck ? "Unclaimed Food Truck Profile" : "Unclaimed Restaurant Profile"}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.1,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              {name}
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                lineHeight: 1.65,
                color: muted,
                maxWidth: 680,
              }}
            >
              {isFoodTruck
                ? "This food truck does not yet have a completed Grubbid public profile. Core details can appear with a free Verified subscription, while richer brand presentation appears with Pro."
                : "This restaurant does not yet have a completed Grubbid public profile. Core details can appear with a free Verified subscription, while richer brand presentation appears with Pro."}
            </p>
          </div>

          <div style={{ padding: "8px 24px 24px" }}>
            <FieldRow label={isFoodTruck ? "Food Truck Name" : "Restaurant Name"} value={name} placeholder="" isDark={isDark} />

            <FieldRow
              label={isFoodTruck ? "Primary Service Area" : "Address"}
              value={addressLine1}
              placeholder={verifiedMessage}
              isDark={isDark}
            />

            <FieldRow
              label="City / Region / Postal Code"
              value={[city, stateVal].filter(Boolean).join(", ") + (postalCode ? ` ${postalCode}` : "")}
              placeholder={verifiedMessage}
              isDark={isDark}
            />

            <FieldRow label="Phone" value={phone} placeholder={verifiedMessage} isDark={isDark} />
            <FieldRow label="Website" value={websiteRaw || website} placeholder={verifiedMessage} isDark={isDark} />
            <FieldRow label="Cuisine" value={cuisine} placeholder={verifiedMessage} isDark={isDark} />
            <FieldRow
              label={isFoodTruck ? "Category / Format" : "Category"}
              value={category}
              placeholder={verifiedMessage}
              isDark={isDark}
            />

            <FieldRow
              label={isFoodTruck ? "Truck Story / About" : "Story / About"}
              value=""
              placeholder={proMessage}
              isDark={isDark}
            />

            <FieldRow
              label={isFoodTruck ? "Featured Menu Item" : "Featured Dish"}
              value=""
              placeholder={proMessage}
              isDark={isDark}
            />

            <FieldRow
              label={isFoodTruck ? "Regular Stops / Areas" : "Landmarks / Nearby"}
              value=""
              placeholder={proMessage}
              isDark={isDark}
            />

            <FieldRow
              label="Brand Presentation"
              value=""
              placeholder={proMessage}
              isDark={isDark}
            />
          </div>
        </div>

        <div
          style={{
            alignSelf: "start",
            borderRadius: 18,
            border: cardBorder,
            boxShadow: cardShadow,
            background: cardBg,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: isDark ? "#f8fafc" : "#0f172a",
              marginBottom: 14,
            }}
          >
            Claim This Profile
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              color: muted,
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                padding: 14,
                border: isDark ? "1px solid rgba(74,222,128,0.20)" : "1px solid #bbf7d0",
                background: isDark ? "rgba(74,222,128,0.05)" : "#f0fff4",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: isDark ? "#4ade80" : "#15803d",
                  marginBottom: 6,
                }}
              >
                Verified
              </div>
              <div>
                {isFoodTruck
                  ? "Show core food truck information on Grubbid with a free Verified subscription."
                  : "Show core restaurant information on Grubbid with a free Verified subscription."}
              </div>
            </div>

            <div
              style={{
                borderRadius: 12,
                padding: 14,
                border: isDark ? "1px solid rgba(59,130,246,0.20)" : "1px solid #bfdbfe",
                background: isDark ? "rgba(59,130,246,0.05)" : "#eff6ff",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: isDark ? "#60a5fa" : "#1d4ed8",
                  marginBottom: 6,
                }}
              >
                Pro
              </div>
              <div>
                {isFoodTruck
                  ? "Unlock richer truck presentation, profile storytelling, featured placement, and stronger merchandising."
                  : "Unlock richer restaurant presentation, profile storytelling, featured placement, and stronger merchandising."}
              </div>
            </div>

            <Link
              to="/profilesearch"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
                height: 44,
                padding: "0 18px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 800,
                background: "#111827",
                color: "#ffffff",
              }}
            >
              Claim or Upgrade This Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.9,
        textTransform: "uppercase",
        color,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Divider({ isDark }) {
  return (
    <div
      style={{
        borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f1f5f9",
        marginTop: 22,
        paddingTop: 22,
      }}
    />
  );
}

function Skel({ w = 160, h = 14, isDark }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: isDark ? "rgba(255,255,255,0.08)" : "#e9eef5",
        flexShrink: 0,
      }}
    />
  );
}

export default function RestaurantPublicPage() {
  const { slugOrId } = useParams();

  const [theme, setTheme] = useState(readTheme);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const isDark = theme === "dark";
  const dataUrl = useMemo(
    () => `${API}/public/restaurants/${encodeURIComponent(slugOrId)}`,
    [slugOrId]
  );

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    setData(null);

    fetch(dataUrl)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (!json?.ok) throw new Error(json?.error || "Not found");
        setData(json?.restaurant || json);
      })
      .catch((e) => {
        if (alive) setErr(String(e?.message || e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const tier = normalizeTier(data?.profile_tier, data?.listing_status);
  const t = getTierTheme(tier, isDark);
  const isPro = tier === "pro";
  const isVerified = tier === "verified";

  const name = data?.restaurant_name || data?.name || `Restaurant ${slugOrId}`;
  const streetAddr = data?.address || data?.address_line1 || "";
  const city = data?.city || "";
  const stateVal = data?.state || data?.region || "";
  const zipVal = data?.zip || data?.postal_code || data?.postcode || "";
  const cityLine = [city, stateVal].filter(Boolean).join(", ") + (zipVal ? ` ${zipVal}` : "");
  const phone = data?.phone || "";
  const websiteRaw = data?.website || data?.website_url || "";
  const website = normalizeUrl(websiteRaw);
  const logoUrl = data?.logo_url || "";
  const distanceMi = data?.distance_miles;
  const distanceText = distanceMi != null ? `${Number(distanceMi).toFixed(1)} mi` : "";

  const cuisine = humanizeLabel(data?.cuisine || "");
  const category = humanizeLabel(data?.category || "");
  const cuisineLine = [category, cuisine].filter(Boolean).join(" • ");

  const bio = data?.bio || "";
  const landmarks = data?.landmarks || "";
  const featuredItem = data?.featured_item || null;
  const dealItems = Array.isArray(data?.deal_items) ? data.deal_items : [];

  const showLogo = isPro && !!logoUrl;
  const showBio = isPro && !!bio;
  const showFeatured = isPro && !!featuredItem;
  const showLandmarks = isPro && !!landmarks;
  const showDeals = dealItems.length > 0;

  const pageBg = isDark ? "#0b0b0f" : "transparent";
  const pageColor = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "#64748b";
  const linkColor = isDark ? "#93c5fd" : "#1d4ed8";

  const landmarkLines = landmarks
    ? landmarks.split(/\n/).map((l) => l.trim()).filter(Boolean)
    : [];

  if (!loading && !err && data && !isClaimedRestaurant(data)) {
    return <UnclaimedRestaurantPage data={data} isDark={isDark} slugOrId={slugOrId} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: pageColor,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        padding: "20px 16px 64px",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <HomeButton />

        <button
          type="button"
          onClick={() => setTheme((th) => (th === "dark" ? "light" : "dark"))}
          style={{
            height: 28,
            padding: "0 12px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 8,
            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
            background: "transparent",
            color: muted,
            cursor: "pointer",
            letterSpacing: 0.2,
          }}
          aria-label="Toggle theme"
        >
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          border: t.cardBorder,
          boxShadow: t.cardShadow,
          background: isDark ? "#111218" : "#ffffff",
        }}
      >
        <div
          style={{
            padding: "24px 24px 22px",
            background: t.heroBg,
            borderBottom: t.heroBorderBottom,
            position: "relative",
          }}
        >
          {t.accentBarColor ? (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "0 0 auto 0",
                height: 4,
                background: t.accentBarColor,
              }}
            />
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingTop: t.accentBarColor ? 10 : 0,
              marginBottom: 16,
            }}
          >
            {showLogo ? (
              <img
                src={logoUrl}
                alt={`${name} logo`}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  objectFit: "cover",
                  flexShrink: 0,
                  border: isDark
                    ? "1px solid rgba(59,130,246,0.25)"
                    : "1px solid #bfdbfe",
                  background: isDark ? "rgba(255,255,255,0.05)" : "#f0f4ff",
                }}
              />
            ) : null}

            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <Skel w={220} h={t.nameSize + 6} isDark={isDark} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h1
                    style={{
                      fontSize: t.nameSize,
                      fontWeight: t.nameWeight,
                      lineHeight: 1.1,
                      color: t.nameColor,
                      margin: 0,
                      letterSpacing: "-0.02em",
                      wordBreak: "break-word",
                    }}
                  >
                    {name}
                  </h1>

                  {isPro || isVerified ? (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.badgeColor,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        letterSpacing: 0.1,
                      }}
                    >
                      {isPro ? "◆ Pro" : "✓ Verified"}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 14,
              color: muted,
              lineHeight: 1.5,
            }}
          >
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skel w={200} h={13} isDark={isDark} />
                <Skel w={160} h={13} isDark={isDark} />
                <Skel w={130} h={13} isDark={isDark} />
              </div>
            ) : (
              <>
                {streetAddr ? <div>{streetAddr}</div> : null}
                {cityLine ? <div>{cityLine}</div> : null}

                {phone ? (
                  <div>
                    <a
                      href={`tel:${String(phone).replace(/[^\d+]/g, "")}`}
                      style={{ color: linkColor, textDecoration: "none", fontWeight: 500 }}
                    >
                      {phone}
                    </a>
                  </div>
                ) : null}

                {cuisineLine ? (
                  <div style={{ color: t.metaColor, fontWeight: 500 }}>{cuisineLine}</div>
                ) : null}

                {distanceText ? <div>{distanceText}</div> : null}

                {website ? (
                  <div>
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: linkColor,
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {websiteRaw || website} ↗
                    </a>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div style={{ padding: "4px 24px 28px" }}>
          {err && !loading ? (
            <div
              style={{
                marginTop: 20,
                padding: "12px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                background: isDark ? "rgba(248,113,113,0.07)" : "#fff5f5",
                border: isDark ? "1px solid rgba(248,113,113,0.25)" : "1px solid #fca5a5",
                color: isDark ? "#fca5a5" : "#b91c1c",
              }}
            >
              {err}
            </div>
          ) : null}

          {!loading && showBio ? (
            <>
              <Divider isDark={isDark} />
              <SectionLabel color={t.sectionColor}>About</SectionLabel>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: isDark ? "rgba(255,255,255,0.70)" : "#374151",
                }}
              >
                {bio}
              </p>
            </>
          ) : null}

          {!loading && showFeatured ? (
            <>
              <Divider isDark={isDark} />
              <SectionLabel color={t.sectionColor}>Featured Dish</SectionLabel>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: t.featuredBg,
                  border: `1px solid ${t.featuredBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: featuredItem.description ? 6 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: isDark ? "#e0f2fe" : "#0f172a",
                      lineHeight: 1.3,
                    }}
                  >
                    {featuredItem.name}
                  </div>
                  {featuredItem.price ? (
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: t.badgeColor || muted,
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {featuredItem.price}
                    </div>
                  ) : null}
                </div>

                {featuredItem.description ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: isDark ? "rgba(255,255,255,0.50)" : "#64748b",
                      lineHeight: 1.55,
                    }}
                  >
                    {featuredItem.description}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {!loading && showDeals ? (
            <>
              <Divider isDark={isDark} />
              <SectionLabel color={t.sectionColor}>Active Deals</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {dealItems.map((deal, idx) => (
                  <div
                    key={deal.id ?? `deal-${idx}`}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: t.dealDot,
                        flexShrink: 0,
                        marginTop: 7,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isDark ? "#e2e8f0" : "#0f172a",
                          lineHeight: 1.3,
                        }}
                      >
                        {deal.name}
                        {deal.price ? (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 12,
                              fontWeight: 500,
                              color: muted,
                            }}
                          >
                            {deal.price}
                          </span>
                        ) : null}
                      </div>

                      {deal.description ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: muted,
                            lineHeight: 1.45,
                            marginTop: 2,
                          }}
                        >
                          {deal.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {!loading && showLandmarks ? (
            <>
              <Divider isDark={isDark} />
              <SectionLabel color={t.sectionColor}>Nearby</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {landmarkLines.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: 14,
                      color: isDark ? "rgba(255,255,255,0.62)" : "#374151",
                      lineHeight: 1.45,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: isDark ? "rgba(255,255,255,0.22)" : "#cbd5e1",
                        flexShrink: 0,
                        marginTop: "0.5em",
                      }}
                    />
                    {line}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {!loading && !err && data?.id ? (
            <>
              <Divider isDark={isDark} />
              <Link
                to={`/public/restaurants/${data.id}/menu`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 40,
                  padding: "0 22px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  background: t.viewMenuBg,
                  color: t.viewMenuColor,
                  border: t.viewMenuBorder,
                  textDecoration: "none",
                  letterSpacing: 0.1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                View Menu →
              </Link>
            </>
          ) : null}

          {loading ? (
            <div style={{ paddingTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
              <Skel w="100%" h={13} isDark={isDark} />
              <Skel w="75%" h={13} isDark={isDark} />
              <Skel w="55%" h={13} isDark={isDark} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}