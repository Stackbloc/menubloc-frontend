import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { API_BASE } from "../lib/api.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import { videoWatchPath } from "../lib/seo/jsonLdBuilders.js";

const VIDEO_KINDS = new Set([
  "ate",
  "want",
  "plan",
  "event",
  "deal",
  "managed",
  "cooking",
]);

function shellStyle() {
  return {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #111827 55%, #020617 100%)",
    color: "#f8fafc",
    padding: "1rem 1rem 5.5rem",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  };
}

export default function VideoWatchPage() {
  const { kind: kindParam, id: idParam } = useParams();
  const kind = String(kindParam || "").toLowerCase();
  const id = Number(idParam);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!VIDEO_KINDS.has(kind) || !Number.isInteger(id) || id <= 0) {
      setError("Video not found");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");
    fetch(`${API_BASE}/public/meta/videos/${encodeURIComponent(kind)}/${id}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Video not found");
        }
        return json.data;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Video not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  useEffect(() => {
    if (!data?.title) return undefined;
    const previous = document.title;
    document.title = `${data.title} | Menuply`;
    return () => {
      document.title = previous;
    };
  }, [data?.title]);

  if (loading) {
    return (
      <div style={shellStyle()}>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: "2rem", color: "#94a3b8" }}>
          Loading video…
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={shellStyle()}>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: "2rem", color: "#94a3b8" }}>
          {error || "Video not found"}
        </div>
        <BottomNav />
      </div>
    );
  }

  const restaurantHref = data.restaurant ? restaurantPath(data.restaurant) : null;
  const menuItemHref = data.menu_item?.id ? `/menu-items/${data.menu_item.id}` : null;
  const venueHref = data.destination_venue?.slug
    ? `/destination-venues/${encodeURIComponent(data.destination_venue.slug)}`
    : null;
  const clusterHref = data.cluster?.path || null;
  const watchPath = data.path || videoWatchPath(data.kind, data.id);

  return (
    <div style={shellStyle()}>
      <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: "#94a3b8" }}>
          <Link to="/feed" style={{ color: "#cbd5e1", textDecoration: "none" }}>
            ← Feed
          </Link>
          {watchPath ? (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>{watchPath}</span>
          ) : null}
        </p>

        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.25 }}>
          {data.title || "Menuply video"}
        </h1>

        {!data.indexable ? (
          <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: "#fbbf24" }}>
            This clip is not tagged to a restaurant, dish, or venue yet.
          </p>
        ) : null}

        {data.description ? (
          <p style={{ margin: "0 0 1rem", color: "#cbd5e1", lineHeight: 1.45 }}>{data.description}</p>
        ) : null}

        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "#000",
            border: "1px solid rgba(148,163,184,0.25)",
            marginBottom: "1rem",
          }}
        >
          {data.video_url ? (
            <video
              key={data.video_url}
              src={data.video_url}
              poster={data.photo_url || undefined}
              controls
              playsInline
              style={{ width: "100%", maxHeight: "70vh", display: "block", background: "#000" }}
            />
          ) : (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
              Video unavailable
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "0.55rem" }}>
          {restaurantHref ? (
            <Link to={restaurantHref} style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
              Restaurant: {data.restaurant.name || "View restaurant"}
            </Link>
          ) : null}
          {menuItemHref ? (
            <Link to={menuItemHref} style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
              Dish: {data.menu_item.name || "View dish"}
            </Link>
          ) : null}
          {venueHref ? (
            <Link to={venueHref} style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
              Venue: {data.destination_venue.name || data.destination_venue.official_name || "View venue"}
            </Link>
          ) : null}
          {clusterHref ? (
            <Link to={clusterHref} style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
              Area: {data.cluster.name || "View area"}
            </Link>
          ) : null}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
