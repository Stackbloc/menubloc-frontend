import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { getFollowedRestaurants } from "../../lib/consumerApi.js";

function formatFollowedDate(value) {
  if (!value) return "Following";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Following";
  return `Following since ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatTierLabel(tier, status) {
  const raw = String(tier || status || "").trim();
  if (!raw) return "";
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFollowerCount(value) {
  const count = Number(value || 0);
  return count === 1 ? "1 follower" : `${count} followers`;
}

function buildRestaurantHref(item) {
  return item.slug
    ? `/restaurants/${encodeURIComponent(item.slug)}`
    : `/restaurants/${encodeURIComponent(String(item.restaurant_id))}`;
}

function buildMenuHref(item) {
  if (item.slug) return `/restaurants/${encodeURIComponent(item.slug)}/menu`;
  return `/public/restaurants/${encodeURIComponent(String(item.restaurant_id))}/menu`;
}

export default function ConsumerFollowing() {
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const loadFollowedRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFollowedRestaurants();
      setItems(Array.isArray(data?.restaurants) ? data.restaurants : []);
    } catch (err) {
      setError(err.message || "Failed to load followed restaurants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: { redirectTo: "/account/following" },
      });
      return;
    }
    loadFollowedRestaurants();
  }, [authLoading, isAuthenticated, loadFollowedRestaurants, navigate]);

  const headingCopy = useMemo(() => {
    const count = items.length;
    if (count === 1) return "1 restaurant followed";
    return `${count} restaurants followed`;
  }, [items.length]);

  if (authLoading || loading) {
    return (
      <>
      <StickyPageHeader title="Following" />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.helperText}>Loading your following feed…</p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  return (
    <>
    <StickyPageHeader title="Following" />
    <div style={styles.page}>
      <div style={styles.pageInner}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Following</h1>
            <p style={styles.pageSubtitle}>{headingCopy}</p>
          </div>
          <Link to="/browse-menus" style={styles.browseLink}>Browse restaurants</Link>
        </div>

        {error ? (
          <div style={styles.errorCard}>
            <p style={styles.errorText}>{error}</p>
            <button type="button" onClick={loadFollowedRestaurants} style={styles.retryBtn}>
              Retry
            </button>
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>You are not following any restaurants yet.</h2>
            <p style={styles.helperText}>
              Follow restaurants from their public page to keep them in one place.
            </p>
            <div style={styles.emptyActions}>
              <Link to="/" style={styles.secondaryLink}>Go to discovery</Link>
              <Link to="/browse-menus" style={styles.primaryLink}>Browse menus</Link>
            </div>
          </div>
        ) : null}

        {!error && items.length > 0 ? (
          <div style={styles.feedGrid}>
            {items.map((item) => {
              const location = [item.city, item.state].filter(Boolean).join(", ");
              const badge = formatTierLabel(item.profile_tier, item.listing_status);
              const restaurantHref = buildRestaurantHref(item);
              const menuHref = buildMenuHref(item);

              return (
                <div key={item.restaurant_id} style={styles.menuCard}>
                  <div style={styles.menuCardHeader}>
                    <div style={styles.rowMain}>
                      {item.logo_url ? (
                        <img
                          src={item.logo_url}
                          alt=""
                          aria-hidden="true"
                          style={styles.logo}
                        />
                      ) : (
                        <div style={styles.logoFallback} aria-hidden="true">
                          {(item.restaurant_name || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div style={styles.rowContent}>
                        <div style={styles.rowHeading}>
                          <Link to={restaurantHref} style={styles.restaurantLink}>
                            {item.restaurant_name || "Restaurant"}
                          </Link>
                          {badge ? <span style={styles.badge}>{badge}</span> : null}
                        </div>
                        {location ? <p style={styles.location}>{location}</p> : null}
                        <p style={styles.followedMeta}>{formatFollowedDate(item.followed_at)}</p>
                        {Number(item.follower_count || 0) > 0 ? (
                          <p style={styles.followerMeta}>{formatFollowerCount(item.follower_count)}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={styles.windowBody}>
                    <div style={styles.windowToolbar}>
                      <span style={styles.windowDot} />
                      <span style={styles.windowDot} />
                      <span style={styles.windowDot} />
                    </div>
                    <div style={styles.windowPanel}>
                      <div style={styles.windowLabel}>Menu Window</div>
                      <div style={styles.windowTitle}>{item.restaurant_name || "Restaurant"}</div>
                      <div style={styles.windowMeta}>
                        {location || "Location unavailable"}
                      </div>
                      <div style={styles.windowActions}>
                        <Link to={restaurantHref} style={styles.secondaryLink}>Restaurant</Link>
                        <Link to={menuHref} style={styles.primaryLink}>View Menu</Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
    <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f6f3",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "0 0 calc(80px + env(safe-area-inset-bottom, 0px))",
  },
  pageInner: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 16px",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 0",
    borderBottom: "1px solid #e8e8e4",
    marginBottom: "32px",
  },
  backLink: {
    color: "#1F4E3D",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#11211a",
  },
  pageSubtitle: {
    margin: "8px 0 0",
    color: "#667085",
    fontSize: "14px",
  },
  browseLink: {
    color: "#11211a",
    background: "#ffffff",
    border: "1px solid #d7ddd8",
    borderRadius: "999px",
    padding: "10px 16px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  card: {
    maxWidth: "520px",
    margin: "80px auto 0",
    padding: "28px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  helperText: {
    fontSize: "15px",
    color: "#555",
    lineHeight: 1.6,
  },
  errorCard: {
    background: "#fff5f3",
    border: "1px solid #f1c9c3",
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "20px",
  },
  errorText: {
    margin: "0 0 12px",
    color: "#a63d2f",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  retryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#1F4E3D",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyState: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "32px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  emptyTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#11211a",
  },
  emptyActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    background: "#1F4E3D",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #d7ddd8",
    color: "#11211a",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  feedGrid: {
    display: "grid",
    gap: "16px",
  },
  menuCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    display: "grid",
    gap: "14px",
  },
  menuCardHeader: {
    display: "flex",
    alignItems: "center",
  },
  rowMain: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    flex: "1 1 320px",
  },
  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "1px solid #e8e8e4",
    background: "#f8f8f5",
    flexShrink: 0,
  },
  logoFallback: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#dbe8e1",
    color: "#1F4E3D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 800,
    flexShrink: 0,
  },
  rowContent: {
    minWidth: 0,
    flex: 1,
  },
  rowHeading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  restaurantLink: {
    color: "#11211a",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: 700,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "24px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#eef4f0",
    color: "#1F4E3D",
    fontSize: "12px",
    fontWeight: 700,
  },
  location: {
    margin: "0 0 6px",
    color: "#4f5b57",
    fontSize: "14px",
  },
  followedMeta: {
    margin: 0,
    color: "#667085",
    fontSize: "13px",
  },
  followerMeta: {
    margin: "6px 0 0",
    color: "#4f5b57",
    fontSize: "13px",
    fontWeight: 600,
  },
  windowBody: {
    borderRadius: "16px",
    border: "1px solid #d7ddd8",
    overflow: "hidden",
    background: "#f9fafb",
  },
  windowToolbar: {
    height: "34px",
    background: "#eef2f1",
    borderBottom: "1px solid #d7ddd8",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 14px",
  },
  windowDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    background: "#c1c8c5",
    display: "inline-block",
  },
  windowPanel: {
    padding: "16px",
    display: "grid",
    gap: "8px",
    background: "linear-gradient(180deg, #ffffff 0%, #f6f8f7 100%)",
  },
  windowLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#667085",
  },
  windowTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#11211a",
    lineHeight: 1.2,
  },
  windowMeta: {
    fontSize: "14px",
    color: "#4f5b57",
    lineHeight: 1.5,
  },
  windowActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "6px",
  },
};
