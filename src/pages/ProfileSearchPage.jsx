/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/ProfileSearchPage.jsx
 * Purpose:
 *   Step 2 of restaurant onboarding flow.
 *   Reached after /restaurant/signup with router location.state.
 *
 *   When restaurant_id is in state (came from POST /owner/profile in signup):
 *     - Show "Your Profile" card at top with a "Continue" button.
 *     - Also show search so owner can find a pre-existing profile to claim instead.
 *
 *   When no restaurant_id in state (direct navigation):
 *     - Show search + create form only.
 *
 *   After claim or continue → /restaurant/subscription
 *   (Business setup step — franchise / multi-location / tax — goes here
 *    when those pages are built.)
 *
 *   Router state forwarded to SubscriptionSelect:
 *     { restaurant_id, email, owner_token, ingestion_method }
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

/* ---- Styles ---- */

const GREEN = "#4caf50";

const ST = {
  outer: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#0B0F0C",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 16,
    lineHeight: 1.6,
    WebkitFontSmoothing: "antialiased",
  },
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "28px 24px 80px",
  },
  logoWrap: { marginBottom: 20 },

  sectionChip: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6B7280",
    background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4,
    padding: "3px 10px",
    marginBottom: 20,
  },

  /* Step trail */
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 28,
    fontSize: 12,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 6,
  },
  step: (active, done) => ({
    padding: "4px 12px",
    borderRadius: 999,
    background: done ? GREEN : active ? "#F9FAFB" : "transparent",
    color: done ? "#fff" : active ? "#0B0F0C" : "#9CA3AF",
    border: active ? `1.5px solid #0B0F0C` : done ? `1.5px solid ${GREEN}` : "1.5px solid transparent",
    whiteSpace: "nowrap",
  }),
  stepDivider: { flex: "0 0 14px", height: 1, background: "#E5E7EB", margin: "0 2px" },

  heading: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.3px", marginBottom: 6, color: "#0B0F0C" },
  subheading: { fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.55 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 10,
  },

  /* Your Profile card */
  yourProfileCard: {
    border: `1.5px solid ${GREEN}`,
    borderRadius: 10,
    padding: "16px 18px",
    marginBottom: 24,
    background: "rgba(76,175,80,0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  yourProfileBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 700,
    background: `rgba(76,175,80,0.12)`,
    color: GREEN,
    border: `1px solid rgba(76,175,80,0.3)`,
    borderRadius: 4,
    padding: "2px 8px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  yourProfileName:    { fontWeight: 700, fontSize: 15, marginBottom: 3, color: "#0B0F0C" },
  yourProfileAddress: { fontSize: 13, color: "#6B7280", lineHeight: 1.45 },
  continueBtn: {
    height: 36,
    padding: "0 18px",
    borderRadius: 10,
    border: 0,
    background: GREEN,
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },

  /* Search form */
  searchRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  input: {
    flex: "2 1 200px",
    height: 42,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    fontFamily: "inherit",
    outline: "none",
  },
  inputSm: {
    flex: "1 1 120px",
    height: 42,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    fontFamily: "inherit",
    outline: "none",
  },
  searchBtn: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: GREEN,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },

  /* Result cards */
  resultCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    background: "#F9FAFB",
  },
  cardName:    { fontWeight: 700, fontSize: 15, marginBottom: 3, color: "#0B0F0C" },
  cardAddress: { fontSize: 13, color: "#6B7280", lineHeight: 1.4 },
  cardMeta:    { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  claimBtn: {
    height: 36,
    padding: "0 16px",
    borderRadius: 10,
    border: `1.5px solid ${GREEN}`,
    background: "#fff",
    color: GREEN,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  claimBtnDoing: {
    height: 36,
    padding: "0 16px",
    borderRadius: 10,
    border: "1.5px solid #E5E7EB",
    background: "#F3F4F6",
    color: "#9CA3AF",
    fontWeight: 700,
    fontSize: 13,
    cursor: "not-allowed",
    whiteSpace: "nowrap",
    flexShrink: 0,
    fontFamily: "inherit",
  },

  /* Email prompt */
  emailRow: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
    padding: "12px 14px",
    background: "#F9FAFB",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
  },
  emailLabel: { fontSize: 13, color: "#6B7280", whiteSpace: "nowrap", fontWeight: 600 },
  emailInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    padding: "0 10px",
    fontSize: 13,
    background: "#fff",
    color: "#0B0F0C",
    fontFamily: "inherit",
    outline: "none",
  },

  divider: { margin: "24px 0 20px", display: "flex", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, background: "#E5E7EB" },
  dividerText: { fontSize: 13, color: "#9CA3AF", whiteSpace: "nowrap" },

  /* Create section */
  createSection: {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: "20px 20px",
    background: "#F9FAFB",
  },
  createHeading: { fontWeight: 800, fontSize: 16, marginBottom: 4, color: "#0B0F0C" },
  createSubtext: { fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.55 },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 16px",
    fontSize: 13,
    color: "#374151",
    marginBottom: 16,
  },
  previewLabel: { color: "#9CA3AF", fontWeight: 600 },
  createBtn: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: GREEN,
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  createBtnDisabled: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: "#F3F4F6",
    color: "#9CA3AF",
    fontWeight: 700,
    fontSize: 14,
    cursor: "not-allowed",
    fontFamily: "inherit",
  },

  miniForm: { display: "grid", gap: 10, marginBottom: 16 },

  error: {
    padding: "10px 14px",
    background: "#FFF0F0",
    border: "1px solid #FECACA",
    borderRadius: 10,
    fontSize: 13,
    color: "#DC2626",
    marginBottom: 12,
  },
  info: {
    padding: "10px 14px",
    background: "#F0F7FF",
    border: "1px solid #BFDBFE",
    borderRadius: 10,
    fontSize: 13,
    color: "#2563AB",
    marginBottom: 12,
  },
};

/* ---- Address builder ---- */
function formatAddress(r) {
  const parts = [];
  if (r.address_line1) parts.push(r.address_line1);
  const cityState = [r.city, r.state].filter(Boolean).join(", ");
  if (cityState) parts.push(cityState);
  if (r.postal_code) parts.push(r.postal_code);
  return parts.join(" · ");
}

/* ---- Main component ---- */

export default function ProfileSearchPage() {
  const { t } = useLanguage();
  const nav      = useNavigate();
  const location = useLocation();

  // Data passed from RestaurantSignup via router state
  const signupState = location.state || {};
  const {
    restaurant_id: stateRestaurantId = null,
    email: stateEmail                = "",
    owner_token: stateOwnerToken     = "",
    restaurant_name: stateName       = "",
    city: stateCity                  = "",
    postal_code: stateZip            = "",
    address_line1: stateAddr         = "",
    state: stateStateVal             = "",
    phone: statePhone                = "",
    website_url: stateWebsite        = "",
    ingestion_method                 = "",
  } = signupState;

  // If we came from signup with a created restaurant, we already have a profile.
  const hasCreatedProfile = !!stateRestaurantId;

  /* ---- Search state ---- */
  const [q,           setQ]           = useState(stateName);
  const [cityFilter,  setCityFilter]  = useState(stateCity);
  const [zipFilter,   setZipFilter]   = useState(stateZip);
  const [results,     setResults]     = useState(null); // null = not searched yet
  const [searching,   setSearching]   = useState(false);
  const [searchErr,   setSearchErr]   = useState("");
  const [searched,    setSearched]    = useState(false);

  /* ---- Claim state ---- */
  const [email,      setEmail]      = useState(stateEmail);
  const [claimingId, setClaimingId] = useState(null);
  const [claimErr,   setClaimErr]   = useState("");

  /* ---- Create state (used when no profile was created in signup) ---- */
  const [createName,    setCreateName]    = useState(stateName);
  const [createCity,    setCreateCity]    = useState(stateCity);
  const [createState,   setCreateState]   = useState(stateStateVal);
  const [createZip,     setCreateZip]     = useState(stateZip);
  const [createPhone,   setCreatePhone]   = useState(statePhone);
  const [createWebsite, setCreateWebsite] = useState(stateWebsite);
  const [createAddr,    setCreateAddr]    = useState(stateAddr);
  const [creating,      setCreating]      = useState(false);
  const [createErr,     setCreateErr]     = useState("");

  const autoSearchedRef = useRef(false);

  // Auto-search once on mount if we came from signup
  useEffect(() => {
    if (autoSearchedRef.current) return;
    if (stateName.length >= 2) {
      autoSearchedRef.current = true;
      doSearch(stateName, stateCity, stateZip);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate forward to subscription (business setup step goes here when built)
  function proceedToSubscription({ restaurant_id, email: forwardEmail, owner_token }) {
    nav("/restaurant/subscription", {
      state: {
        restaurant_id,
        restaurant_name: stateName,
        email:           forwardEmail,
        owner_token,
        ingestion_method,
      },
    });
  }

  async function doSearch(searchQ, searchCity, searchZip) {
    const qVal = (searchQ || q).trim();
    if (qVal.length < 2) {
      setSearchErr("Enter at least 2 characters to search.");
      return;
    }
    setSearching(true);
    setSearchErr("");
    setClaimErr("");
    setResults(null);

    try {
      const params = new URLSearchParams({ q: qVal });
      if (searchCity || cityFilter) params.set("city", (searchCity || cityFilter).trim());
      if (searchZip  || zipFilter)  params.set("postal_code", (searchZip || zipFilter).trim());

      const res  = await fetch(`${API}/public/profile-search?${params}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `Search failed (${res.status})`);

      setResults(data.results || []);
      setSearched(true);
    } catch (e) {
      setSearchErr(e.message || "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    doSearch(q, cityFilter, zipFilter);
  }

  async function handleClaim(restaurantId) {
    const claimEmail = email.trim();
    if (!claimEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail)) {
      setClaimErr("Enter a valid email address to claim this profile.");
      return;
    }

    setClaimingId(restaurantId);
    setClaimErr("");

    try {
      const res  = await fetch(`${API}/restaurants/${restaurantId}/claim`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: claimEmail }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `Claim failed (${res.status})`);

      proceedToSubscription({
        restaurant_id: data.restaurant_id,
        email:         claimEmail,
        owner_token:   data.owner_token || stateOwnerToken,
      });
    } catch (e) {
      setClaimErr(e.message || "Claim failed. Please try again.");
      setClaimingId(null);
    }
  }

  // Create a new restaurant profile via POST /owner/profile.
  // Used when no existing profile was found and no profile was created during signup.
  async function handleCreate() {
    const name       = createName.trim();
    const claimEmail = email.trim();

    if (!name) {
      setCreateErr("Restaurant name is required.");
      return;
    }
    if (!claimEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail)) {
      setCreateErr("Enter a valid email address to create your profile.");
      return;
    }

    setCreating(true);
    setCreateErr("");

    try {
      const res  = await fetch(`${API}/owner/profile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          restaurant_name: name,
          email:           claimEmail,
          phone:           createPhone  || statePhone   || null,
          website_url:     createWebsite || stateWebsite || null,
          address_line1:   createAddr   || stateAddr    || null,
          city:            createCity   || stateCity    || null,
          state:           createState  || stateStateVal || null,
          postal_code:     createZip    || stateZip     || null,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) throw new Error(data?.error || `Create failed (${res.status})`);

      proceedToSubscription({
        restaurant_id: data.restaurant.id,
        email:         claimEmail,
        owner_token:   data.owner_token,
      });
    } catch (e) {
      setCreateErr(e.message || "Create failed. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const needsEmail = !stateEmail;

  return (
    <div style={ST.outer}>
      <div style={ST.page}>

        {/* Brand */}
        <div style={ST.logoWrap}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        </div>

        {/* Section chip */}
        <div style={ST.sectionChip}>For Restaurants</div>

        {/* Step trail */}
        <div style={ST.steps}>
          <div style={ST.step(false, true)}>1. Account</div>
          <div style={ST.stepDivider} />
          <div style={ST.step(true, false)}>2. Find your profile</div>
          <div style={ST.stepDivider} />
          <div style={ST.step(false, false)}>3. Choose plan</div>
          <div style={ST.stepDivider} />
          <div style={ST.step(false, false)}>4. Upload menu</div>
        </div>

        <div style={ST.heading}>Find your restaurant profile</div>
        <div style={ST.subheading}>
          Search for your restaurant below. If it already has a Menuply profile you can claim it.
          {hasCreatedProfile
            ? " Or continue with the profile we just created."
            : " If not, create a new profile."}
        </div>

        {/* Email prompt (only when not passed from signup) */}
        {needsEmail && (
          <div style={ST.emailRow}>
            <span style={ST.emailLabel}>Your email:</span>
            <input
              type="email"
              style={ST.emailInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}

        {/* ---- Your Profile card (created during signup) ---- */}
        {hasCreatedProfile && (
          <div>
            <div style={ST.sectionLabel}>Your profile</div>
            <div style={ST.yourProfileCard}>
              <div style={{ minWidth: 0 }}>
                <div style={ST.yourProfileBadge}>Just created</div>
                <div style={ST.yourProfileName}>{stateName}</div>
                {(stateAddr || stateCity) && (
                  <div style={ST.yourProfileAddress}>
                    {formatAddress({
                      address_line1: stateAddr,
                      city:          stateCity,
                      state:         stateStateVal,
                      postal_code:   stateZip,
                    })}
                  </div>
                )}
              </div>
              <button
                style={ST.continueBtn}
                onClick={() =>
                  proceedToSubscription({
                    restaurant_id: stateRestaurantId,
                    email:         stateEmail,
                    owner_token:   stateOwnerToken,
                  })
                }
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ---- Search for existing profiles ---- */}
        <div style={hasCreatedProfile ? { marginTop: 8 } : {}}>
          <div style={ST.sectionLabel}>
            {hasCreatedProfile
              ? "Or search to see if your restaurant already has a profile"
              : "Search for your restaurant"}
          </div>
          <form onSubmit={handleSearch}>
            <div style={ST.searchRow}>
              <input
                style={ST.input}
                type="text"
                placeholder="Restaurant name *"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <input
                style={ST.inputSm}
                type="text"
                placeholder="City"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
              <input
                style={ST.inputSm}
                type="text"
                placeholder="ZIP"
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
              />
              <button type="submit" style={ST.searchBtn} disabled={searching}>
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
          </form>
        </div>

        {searchErr && <div style={ST.error}>{searchErr}</div>}

        {/* Search results */}
        {results !== null && !searching && (
          <>
            {results.length === 0 ? (
              <div style={ST.info}>
                No claimable profiles found for &ldquo;{q}&rdquo;
                {cityFilter ? ` in ${cityFilter}` : ""}.
                {!hasCreatedProfile && " Create a new profile below."}
              </div>
            ) : (
              <>
                {claimErr && <div style={ST.error}>{claimErr}</div>}
                {results.map((r) => (
                  <div key={r.id} style={ST.resultCard}>
                    <div style={{ minWidth: 0 }}>
                      <div style={ST.cardName}>{r.restaurant_name}</div>
                      <div style={ST.cardAddress}>{formatAddress(r)}</div>
                      {(r.cuisine || r.category) && (
                        <div style={ST.cardMeta}>
                          {[r.category, r.cuisine].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <button
                      style={claimingId === r.id ? ST.claimBtnDoing : ST.claimBtn}
                      disabled={claimingId !== null}
                      onClick={() => handleClaim(r.id)}
                    >
                      {claimingId === r.id ? "Claiming…" : "Claim this profile"}
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Divider + Create section — only shown when no profile was created during signup */}
        {!hasCreatedProfile && (
          <>
            {searched && (
              <div style={ST.divider}>
                <div style={ST.dividerLine} />
                <div style={ST.dividerText}>
                  {results && results.length > 0
                    ? "Don't see your restaurant?"
                    : "Create a new profile"}
                </div>
                <div style={ST.dividerLine} />
              </div>
            )}

            {(searched || (!searching && results === null)) && (
              <div style={ST.createSection}>
                <div style={ST.createHeading}>
                  {!searched
                    ? `Create a profile for ${createName || "your restaurant"}`
                    : "Create a new restaurant profile"}
                </div>
                <div style={ST.createSubtext}>
                  {!searched
                    ? "Your restaurant isn't in our database yet. We'll create a new profile."
                    : "If your restaurant isn't above, add it here."}
                </div>

                {createErr && <div style={ST.error}>{createErr}</div>}

                {/* If we have signup state, show a data preview; otherwise show a mini form */}
                {stateName ? (
                  <div style={ST.previewGrid}>
                    {createName && (
                      <>
                        <span style={ST.previewLabel}>Name</span>
                        <span>{createName}</span>
                      </>
                    )}
                    {(createAddr || stateAddr) && (
                      <>
                        <span style={ST.previewLabel}>Address</span>
                        <span>{createAddr || stateAddr}</span>
                      </>
                    )}
                    {(createCity || stateCity) && (
                      <>
                        <span style={ST.previewLabel}>City</span>
                        <span>
                          {[createCity || stateCity, createState || stateStateVal]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                    {(createZip || stateZip) && (
                      <>
                        <span style={ST.previewLabel}>ZIP</span>
                        <span>{createZip || stateZip}</span>
                      </>
                    )}
                    {(createPhone || statePhone) && (
                      <>
                        <span style={ST.previewLabel}>Phone</span>
                        <span>{createPhone || statePhone}</span>
                      </>
                    )}
                  </div>
                ) : (
                  /* Mini form for direct navigation (no signup state) */
                  <div style={ST.miniForm}>
                    <input
                      style={ST.input}
                      type="text"
                      placeholder="Restaurant name *"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        style={{ ...ST.inputSm, flex: "2 1 160px" }}
                        type="text"
                        placeholder="Address"
                        value={createAddr}
                        onChange={(e) => setCreateAddr(e.target.value)}
                      />
                      <input
                        style={ST.inputSm}
                        type="text"
                        placeholder="City"
                        value={createCity}
                        onChange={(e) => setCreateCity(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        style={{ ...ST.inputSm, flex: "0 0 70px" }}
                        type="text"
                        placeholder="ST"
                        maxLength={2}
                        value={createState}
                        onChange={(e) => setCreateState(e.target.value)}
                      />
                      <input
                        style={ST.inputSm}
                        type="text"
                        placeholder="ZIP"
                        value={createZip}
                        onChange={(e) => setCreateZip(e.target.value)}
                      />
                      <input
                        style={ST.inputSm}
                        type="tel"
                        placeholder="Phone"
                        value={createPhone}
                        onChange={(e) => setCreatePhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  style={creating ? ST.createBtnDisabled : ST.createBtn}
                  disabled={creating}
                  onClick={handleCreate}
                >
                  {creating
                    ? "Creating profile…"
                    : stateName
                    ? `Create profile for ${createName || "my restaurant"}`
                    : "Create new profile"}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
