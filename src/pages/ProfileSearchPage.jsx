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
import { useLocation, useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

/* ---- Styles ---- */

const ST = {
  page: {
    maxWidth: 640,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand:    { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },

  /* Step trail */
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
    fontSize: 12,
    fontWeight: 600,
  },
  step: (active, done) => ({
    padding: "4px 12px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
  }),
  stepDivider: { flex: "0 0 16px", height: 1, background: "#e0e0e0", margin: "0 2px" },

  heading:    { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.5 },

  /* Your Profile card (created during signup) */
  yourProfileCard: {
    border: "2px solid #111",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 24,
    background: "#fafafa",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  yourProfileBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 800,
    background: "#111",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 8px",
    marginBottom: 4,
  },
  yourProfileName:    { fontWeight: 700, fontSize: 15, marginBottom: 3 },
  yourProfileAddress: { fontSize: 13, color: "#555", lineHeight: 1.4 },
  continueBtn: {
    height: 36,
    padding: "0 18px",
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  /* Search form */
  searchRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  input: {
    flex: "2 1 200px",
    height: 42,
    borderRadius: 10,
    border: "1px solid #e5e5e5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
  },
  inputSm: {
    flex: "1 1 120px",
    height: 42,
    borderRadius: 10,
    border: "1px solid #e5e5e5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
  },
  searchBtn: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  /* Result cards */
  resultCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    background: "#fff",
  },
  cardName:    { fontWeight: 700, fontSize: 15, marginBottom: 3 },
  cardAddress: { fontSize: 13, color: "#555", lineHeight: 1.4 },
  cardMeta:    { fontSize: 12, color: "#888", marginTop: 4 },
  claimBtn: {
    height: 36,
    padding: "0 16px",
    borderRadius: 10,
    border: "1.5px solid #111",
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  claimBtnDoing: {
    height: 36,
    padding: "0 16px",
    borderRadius: 10,
    border: "1.5px solid #ccc",
    background: "#f5f5f5",
    color: "#999",
    fontWeight: 700,
    fontSize: 13,
    cursor: "not-allowed",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  /* Email prompt */
  emailRow: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    alignItems: "center",
    padding: "12px 14px",
    background: "#fffbe6",
    borderRadius: 10,
    border: "1px solid #f0d060",
  },
  emailLabel: { fontSize: 13, color: "#666", whiteSpace: "nowrap" },
  emailInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: "1px solid #e5e5e5",
    padding: "0 10px",
    fontSize: 13,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 12,
  },

  divider: { margin: "28px 0 20px", display: "flex", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, background: "#e9e9e9" },
  dividerText: { fontSize: 13, color: "#999", whiteSpace: "nowrap" },

  /* Create section */
  createSection: {
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: "18px 18px",
    background: "#fafafa",
  },
  createHeading: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  createSubtext: { fontSize: 13, color: "#666", marginBottom: 14, lineHeight: 1.5 },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 16px",
    fontSize: 13,
    color: "#444",
    marginBottom: 14,
  },
  previewLabel: { color: "#888", fontWeight: 600 },
  createBtn: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  createBtnDisabled: {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: 0,
    background: "#ccc",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "not-allowed",
  },

  /* Mini form for direct navigation (no state) */
  miniForm: { display: "grid", gap: 10, marginBottom: 14 },

  error: {
    padding: "10px 14px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 12,
  },
  info: {
    padding: "10px 14px",
    background: "#f0f7ff",
    border: "1px solid #c2d9f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#2563a8",
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
    <div style={ST.page}>
      {/* Brand */}
      <div style={ST.brand}>Grubbid</div>
      <div style={ST.subbrand}>for Restaurants</div>

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
        Search for your restaurant below. If it already has a Grubbid profile you can claim it.
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
  );
}
