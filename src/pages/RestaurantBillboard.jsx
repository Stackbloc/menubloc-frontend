import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { trackBillboardView } from "../lib/analytics.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

function formatStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Current";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPostTypeLabel(postType) {
  const raw = String(postType || "").trim();
  if (!raw) return "";
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateRange(startsAt, endsAt) {
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

function statusColors(status) {
  if (status === "upcoming") {
    return {
      border: "1px solid rgba(250, 204, 21, 0.35)",
      background: "rgba(250, 204, 21, 0.12)",
      color: "#FDE68A",
    };
  }

  if (status === "past") {
    return {
      border: "1px solid rgba(148, 163, 184, 0.25)",
      background: "rgba(148, 163, 184, 0.10)",
      color: "#CBD5E1",
    };
  }

  return {
    border: "1px solid rgba(34, 197, 94, 0.35)",
    background: "rgba(34, 197, 94, 0.12)",
    color: "#86EFAC",
  };
}

function buildMenuHref(restaurant) {
  const slugOrId = restaurant?.slug || restaurant?.id;
  return `/restaurants/${encodeURIComponent(String(slugOrId))}/menu`;
}

function groupPosts(posts) {
  return {
    current: posts.filter((post) => post.status === "current"),
    upcoming: posts.filter((post) => post.status === "upcoming"),
    past: posts.filter((post) => post.status === "past"),
  };
}

function BillboardCard({ post }) {
  const dateRange = formatDateRange(post.starts_at, post.ends_at);
  const badgeStyle = statusColors(post.status);
  const typeLabel = formatPostTypeLabel(post.post_type);

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(34,197,94,0.16)",
        background: "linear-gradient(180deg, rgba(18,26,20,0.98) 0%, rgba(11,15,12,0.98) 100%)",
        padding: 18,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", lineHeight: 1.2 }}>
            {post.title}
          </div>
          {typeLabel ? (
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#4ADE80", textTransform: "uppercase" }}>
              {typeLabel}
            </div>
          ) : null}
        </div>
        <span
          style={{
            ...badgeStyle,
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 800,
            alignSelf: "flex-start",
            whiteSpace: "nowrap",
          }}
        >
          {formatStatusLabel(post.status)}
        </span>
      </div>

      {post.body ? (
        <div style={{ fontSize: 15, lineHeight: 1.6, color: "#D1D5DB" }}>
          {post.body}
        </div>
      ) : null}

      {dateRange ? (
        <div style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>
          {dateRange}
        </div>
      ) : null}
    </div>
  );
}

function BillboardSection({ title, emptyCopy, posts }) {
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4ADE80" }}>
        {title}
      </div>
      {posts.length > 0 ? (
        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((post) => <BillboardCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: "1px dashed rgba(148,163,184,0.25)",
            background: "rgba(15,23,42,0.24)",
            padding: 18,
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          {emptyCopy}
        </div>
      )}
    </section>
  );
}

export default function RestaurantBillboard() {
  const { t } = useLanguage();
  const { slugOrId } = useParams();
  const trackedBillboardViewRef = useRef(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    fetch(`${API}/public/restaurants/${encodeURIComponent(slugOrId)}/billboard`)
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json?.ok) {
          throw new Error(json?.error || "Unable to load billboard.");
        }
        return json;
      })
      .then((json) => {
        if (!alive) return;
        setData(json);
      })
      .catch((err) => {
        if (alive) setError(err.message || "Unable to load billboard.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slugOrId]);

  const restaurant = data?.restaurant || {};
  const posts = Array.isArray(data?.posts) ? data.posts : [];
  const grouped = useMemo(() => groupPosts(posts), [posts]);
  const location = [restaurant.city, restaurant.state].filter(Boolean).join(", ");
  const profileHref = `/restaurants/${encodeURIComponent(String(restaurant.slug || restaurant.id || slugOrId))}`;
  const menuHref = buildMenuHref(restaurant.slug || restaurant.id ? restaurant : { id: slugOrId });

  useEffect(() => {
    if (loading || error || !restaurant?.id) return;
    const currentPost = grouped.current[0] || posts[0] || null;
    const key = `${restaurant.id}:${currentPost?.id || "none"}`;
    if (trackedBillboardViewRef.current.has(key)) return;
    trackedBillboardViewRef.current.add(key);
    trackBillboardView({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name || "",
      billboardId: currentPost?.id || null,
    });
  }, [loading, error, restaurant?.id, restaurant?.name, grouped.current, posts]);

  return (
    <>
      <StickyPageHeader title="Billboard" />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--gb-color-page)",
          color: "var(--gb-color-ink)",
          padding: "0 0 calc(80px + env(safe-area-inset-bottom, 0px))",
          fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 0" }}>
          <div
            style={{
              borderRadius: 24,
              border: "1px solid rgba(34,197,94,0.16)",
              background: "linear-gradient(180deg, rgba(18,26,20,0.98) 0%, rgba(11,15,12,0.98) 100%)",
              padding: 22,
              display: "grid",
              gap: 18,
              boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", color: "#4ADE80" }}>
                Billboard
              </div>
              <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
                {restaurant.name || "Restaurant Billboard"}
              </h1>
              {location ? (
                <div style={{ fontSize: 15, color: "#9CA3AF" }}>{location}</div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to={profileHref} style={actionSecondary}>
                Restaurant Profile
              </Link>
              <Link to={menuHref} style={actionPrimary}>
                View Menu
              </Link>
            </div>

            {loading ? (
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>Loading billboard…</div>
            ) : error ? (
              <div style={{ color: "#FCA5A5", fontSize: 14 }}>{error}</div>
            ) : (
              <div style={{ display: "grid", gap: 24 }}>
                <BillboardSection
                  title="Current Updates"
                  emptyCopy="No billboard updates yet."
                  posts={grouped.current}
                />
                <BillboardSection
                  title="Upcoming"
                  emptyCopy="No upcoming billboard updates."
                  posts={grouped.upcoming}
                />
                <BillboardSection
                  title="Recent / Past Updates"
                  emptyCopy="No recent billboard updates."
                  posts={grouped.past}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

const actionBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "0 16px",
  borderRadius: 12,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 800,
};

const actionPrimary = {
  ...actionBase,
  background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
  color: "#0B0F0C",
};

const actionSecondary = {
  ...actionBase,
  background: "#121A14",
  border: "1px solid #1F2937",
  color: "#F8FAFC",
};
