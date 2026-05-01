import React, { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../BrandLogo.jsx";
import AppMenuSheet from "../grubbid/AppMenuSheet.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";

function parseSessionLocation(raw) {
  const parts = String(raw || "").split(",");
  return {
    city: parts[0]?.trim() || "",
    state: parts[1]?.trim().toUpperCase() || "",
  };
}

const shellStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 0 20px",
  borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
  marginBottom: 16,
};

const leftStyle = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  minWidth: 0,
  flex: "1 1 420px",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const navLinkBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "#1d4ed8",
};

const authLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "0 14px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 700,
  color: "#1d4ed8",
  border: "1px solid rgba(29, 78, 216, 0.18)",
  background: "#fff8f1",
};

const searchFormStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: "1 1 320px",
  minWidth: 260,
};

const searchInputStyle = {
  flex: 1,
  minWidth: 0,
  height: 44,
  borderRadius: 999,
  border: "1px solid rgba(15, 23, 42, 0.12)",
  padding: "0 16px",
  fontSize: 15,
  fontWeight: 500,
  color: "#0f172a",
  background: "#ffffff",
};

const searchButtonStyle = {
  height: 44,
  padding: "0 18px",
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(180deg, #ff9a2f 0%, #ff6b00 100%)",
  color: "#1638a0",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

function buildNavLinkStyle(isActive) {
  return {
    ...navLinkBaseStyle,
    color: isActive ? "#1638a0" : "#4963a6",
    background: isActive ? "rgba(255, 107, 0, 0.12)" : "transparent",
  };
}

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, profile, consumer } = useConsumer();
  const isAccountPage = location.pathname.startsWith("/account");
  const params = new URLSearchParams(location.search || "");
  const [query, setQuery] = useState(params.get("q") || "");
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const showDealsNav = location.pathname !== "/deals";

  const profileLabel =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    consumer?.email ||
    "Profile";

  function handleSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams(location.search || "");
    const trimmed = query.trim();

    if (trimmed) nextParams.set("q", trimmed);
    else nextParams.delete("q");

    // URL has no location context → read from session storage
    if (!nextParams.has("city") && !nextParams.has("lat") && typeof window !== "undefined") {
      try {
        const label = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
        if (label) {
          const loc = parseSessionLocation(label);
          if (loc.city) nextParams.set("city", loc.city);
          if (loc.state) nextParams.set("state", loc.state);
        }
        const rawGeo = window.sessionStorage.getItem(SESSION_GEO_KEY);
        if (rawGeo) {
          const geo = JSON.parse(rawGeo);
          if (Number.isFinite(geo?.lat) && Number.isFinite(geo?.lng)) {
            nextParams.set("lat", String(geo.lat));
            nextParams.set("lng", String(geo.lng));
            if (!nextParams.has("radius_miles")) nextParams.set("radius_miles", "8");
          }
        }
      } catch {}
    }

    navigate({
      pathname: "/search",
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    });
  }

  return (
    <>
      <AppMenuSheet open={appMenuOpen} onClose={() => setAppMenuOpen(false)} />
      <header style={shellStyle}>
        <div style={leftStyle}>
          <button
            type="button"
            onClick={() => setAppMenuOpen(true)}
            aria-label="Open menu"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              color: "#101828",
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          <Link to="/" aria-label="Go to home" style={{ display: "inline-flex", textDecoration: "none" }}>
            <BrandLogo width={92} height={58} radius={16} pageColor="#f7f6f1" />
          </Link>

          {showDealsNav ? (
            <nav aria-label="Primary" style={navStyle}>
              <NavLink to="/deals" style={({ isActive }) => buildNavLinkStyle(isActive)}>
                Deals
              </NavLink>
            </nav>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} role="search" style={searchFormStyle}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants or dishes"
            aria-label="Search restaurants or dishes"
            style={searchInputStyle}
          />
          <button type="submit" style={searchButtonStyle}>
            Search
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!loading ? (
            isAuthenticated ? (
              <Link to="/account" style={authLinkStyle}>
                {isAccountPage ? profileLabel : "Account"}
              </Link>
            ) : (
              <Link to="/account/login" style={authLinkStyle}>
                Sign in
              </Link>
            )
          ) : null}
        </div>
      </header>
    </>
  );
}
