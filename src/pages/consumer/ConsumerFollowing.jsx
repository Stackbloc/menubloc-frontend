import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import { getFollowedRestaurants } from "../../lib/consumerApi.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { restaurantPath, restaurantMenuPath } from "../../lib/canonicalUrl.js";

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
  return restaurantPath({ slug: item.slug, city: item.city, state: item.state })
    || `/restaurants/${encodeURIComponent(String(item.restaurant_id))}`;
}

function buildMenuHref(item) {
  return restaurantMenuPath({ slug: item.slug, city: item.city, state: item.state, id: item.restaurant_id });
}

function buildBillboardHref(item) {
  const base = restaurantPath({ slug: item.slug, city: item.city, state: item.state })
    || `/restaurants/${encodeURIComponent(String(item.restaurant_id))}`;
  return `${base}/billboard`;
}

function formatBillboardStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Current";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBillboardDateRange(startsAt, endsAt) {
  if (!startsAt && !endsAt) return "";

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const startText = startsAt ? formatter.format(new Date(startsAt)) : "";
  const endText = endsAt ? formatter.format(new Date(endsAt)) : "";

  if (startText && endText) return `${startText} - ${endText}`;
  return startText || endText;
}

export default function ConsumerFollowing() {
  const { t } = useLanguage();
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
      <StickyPageHeader title={t("consumer.following.title", "Following")} />
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
    <StickyPageHeader title={t("consumer.following.title", "Following")} />
    <div style={styles.page}>
      <div style={styles.pageInner}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>{t("consumer.following.title", "Following")}</h1>
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
              const billboardHref = buildBillboardHref(item);
              const billboardPreview = Array.isArray(item.billboard_preview) ? item.billboard_preview : [];

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
                      <div style={styles.windowLabel}>Restaurant Snapshot</div>
                      <div style={styles.windowTitle}>{item.restaurant_name || "Restaurant"}</div>
                      <div style={styles.windowMeta}>
                        {location || "Location unavailable"}
                      </div>
                      {billboardPreview.length > 0 ? (
                        <div style={styles.billboardPreview}>
                          <div style={styles.billboardPreviewLabel}>Billboard</div>
                          {billboardPreview.slice(0, 2).map((post) => {
                            const dateRange = formatBillboardDateRange(post.starts_at, post.ends_at);
                            return (
                              <div key={post.id} style={styles.billboardPreviewCard}>
                                <div style={styles.billboardPreviewTitleRow}>
                                  <div style={styles.billboardPreviewTitle}>{post.title}</div>
                                  <span style={styles.billboardPreviewStatus}>
                                    {formatBillboardStatusLabel(post.status)}
                                  </span>
                                </div>
                                {post.body ? (
                                  <div style={styles.billboardPreviewBody}>{post.body}</div>
                                ) : null}
                                {dateRange ? (
                                  <div style={styles.billboardPreviewMeta}>{dateRange}</div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={styles.billboardEmpty}>No billboard updates yet.</div>
                      )}
                      <div style={styles.windowActions}>
                        <Link to={billboardHref} style={styles.secondaryLink}>Billboard</Link>
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
    background: "var(--gb-color-page)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "0 0 calc(var(--bottom-nav-h, 72px) + 8px)",
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
    borderBottom: "1px solid #1F2937",
    marginBottom: "32px",
  },
  backLink: {
    color: "#22C55E",
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
    color: "#FFFFFF",
  },
  pageSubtitle: {
    margin: "8px 0 0",
    color: "#9CA3AF",
    fontSize: "14px",
  },
  browseLink: {
    color: "#FFFFFF",
    background: "#121A14",
    border: "1px solid #1F2937",
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
    background: "#121A14",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  helperText: {
    fontSize: "15px",
    color: "#9CA3AF",
    lineHeight: 1.6,
  },
  errorCard: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "14px",
    padding: "18px 20px",
    marginBottom: "20px",
  },
  errorText: {
    margin: "0 0 12px",
    color: "#F87171",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  retryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  emptyState: {
    background: "#121A14",
    borderRadius: "18px",
    padding: "32px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  emptyTitle: {
    margin: "0 0 10px",
    fontSize: "22px",
    color: "#FFFFFF",
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
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
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
    background: "#121A14",
    border: "1px solid #1F2937",
    color: "#FFFFFF",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  feedGrid: {
    display: "grid",
    gap: "16px",
  },
  menuCard: {
    background: "#121A14",
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
    border: "1px solid #1F2937",
    background: "#1A2419",
    flexShrink: 0,
  },
  logoFallback: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "#1A2419",
    color: "#22C55E",
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
    color: "#FFFFFF",
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
    background: "rgba(34,197,94,0.12)",
    color: "#22C55E",
    fontSize: "12px",
    fontWeight: 700,
  },
  location: {
    margin: "0 0 6px",
    color: "#9CA3AF",
    fontSize: "14px",
  },
  followedMeta: {
    margin: 0,
    color: "#9CA3AF",
    fontSize: "13px",
  },
  followerMeta: {
    margin: "6px 0 0",
    color: "#9CA3AF",
    fontSize: "13px",
    fontWeight: 600,
  },
  windowBody: {
    borderRadius: "16px",
    border: "1px solid #1F2937",
    overflow: "hidden",
    background: "#121A14",
  },
  windowToolbar: {
    height: "34px",
    background: "#1A2419",
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
    background: "#374151",
    display: "inline-block",
  },
  windowPanel: {
    padding: "16px",
    display: "grid",
    gap: "8px",
    background: "#121A14",
  },
  windowLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9CA3AF",
  },
  windowTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#FFFFFF",
    lineHeight: 1.2,
  },
  windowMeta: {
    fontSize: "14px",
    color: "#9CA3AF",
    lineHeight: 1.5,
  },
  billboardPreview: {
    display: "grid",
    gap: "10px",
    marginTop: "4px",
  },
  billboardPreviewLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#22C55E",
  },
  billboardPreviewCard: {
    display: "grid",
    gap: "6px",
    padding: "12px",
    borderRadius: "12px",
    background: "#162019",
    border: "1px solid #1F2937",
  },
  billboardPreviewTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  billboardPreviewTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#FFFFFF",
    lineHeight: 1.35,
  },
  billboardPreviewStatus: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "22px",
    padding: "0 8px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
    fontSize: "11px",
    fontWeight: 800,
  },
  billboardPreviewBody: {
    fontSize: "13px",
    color: "#D1D5DB",
    lineHeight: 1.5,
  },
  billboardPreviewMeta: {
    fontSize: "12px",
    color: "#9CA3AF",
    lineHeight: 1.4,
  },
  billboardEmpty: {
    fontSize: "13px",
    color: "#9CA3AF",
    lineHeight: 1.5,
    padding: "10px 0 2px",
  },
  windowActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "6px",
  },
};
