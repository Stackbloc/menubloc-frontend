import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { fetchVenueProfile } from "../lib/venueProfileApi.js";

/**
 * Campus Venue profile — video billboard hero first.
 * Not a restaurant profile rename. Specials are informational only.
 */
export default function VenueProfilePage() {
  const { slug } = useParams();
  const videoRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setVideoFailed(false);
    fetchVenueProfile(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data?.ok || !data?.venue) {
          throw new Error(data?.error || "Venue not found");
        }
        setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Venue not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shell = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0b1020 0%, #121826 42%, #1a1520 100%)",
    color: "#f8fafc",
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    paddingBottom: "5rem",
  };

  if (loading) {
    return (
      <div style={shell}>
        <div style={{ padding: "3rem 1.25rem", textAlign: "center", opacity: 0.7 }}>
          Loading venue…
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !profile?.venue) {
    return (
      <div style={shell}>
        <div style={{ padding: "3rem 1.25rem", textAlign: "center", opacity: 0.75 }}>
          {error || "Venue not found"}
        </div>
        <BottomNav />
      </div>
    );
  }

  const venue = profile.venue;
  const billboard = profile.billboard || {};
  const events = Array.isArray(profile.upcoming_events) ? profile.upcoming_events : [];
  const specials = Array.isArray(profile.specials) ? profile.specials : [];
  const restaurants = Array.isArray(profile.restaurants) ? profile.restaurants : [];
  const hasVideo = Boolean(billboard.video_url) && !videoFailed;
  const locationLine = [venue.address_line_1, venue.city, venue.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={shell} data-testid="venue-profile-page">
      <section
        data-testid="venue-video-billboard"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "min(78vh, 720px)",
          maxHeight: "86vh",
          overflow: "hidden",
          background: "#05070f",
        }}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            key={billboard.video_url}
            src={billboard.video_url}
            poster={billboard.poster_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "min(78vh, 720px)",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              minHeight: "min(78vh, 720px)",
              background: billboard.poster_url
                ? `center top / cover no-repeat url(${billboard.poster_url})`
                : "radial-gradient(circle at 30% 20%, #3b1d4a, #0b1020 70%)",
              display: "grid",
              placeItems: "end start",
              padding: "1.5rem",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,7,15,0.15) 0%, rgba(5,7,15,0.25) 45%, rgba(5,7,15,0.92) 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "1.25rem 1.25rem 1.5rem",
            display: "grid",
            gap: "0.45rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            What’s happening
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.85rem, 6vw, 2.75rem)",
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            {venue.name}
          </h1>
          {billboard.title ? (
            <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, opacity: 0.95 }}>
              {billboard.title}
            </p>
          ) : null}
          {billboard.event?.slug ? (
            <Link
              to={`/events/${encodeURIComponent(billboard.event.slug)}`}
              style={{
                color: "#fde68a",
                fontWeight: 700,
                textDecoration: "none",
                width: "fit-content",
              }}
            >
              Featured event: {billboard.event.name} →
            </Link>
          ) : null}
          {locationLine ? (
            <p style={{ margin: "0.15rem 0 0", opacity: 0.8, fontSize: "0.92rem" }}>
              {locationLine}
            </p>
          ) : null}
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.25rem 1.15rem 2rem" }}>
        {venue.description ? (
          <section style={{ marginBottom: "1.75rem" }}>
            <h2 style={sectionTitle}>About</h2>
            <p style={{ margin: 0, lineHeight: 1.55, opacity: 0.9 }}>{venue.description}</p>
          </section>
        ) : null}

        {venue.student_info ? (
          <section style={{ marginBottom: "1.75rem" }}>
            <h2 style={sectionTitle}>Student & social</h2>
            <p style={{ margin: 0, lineHeight: 1.55, opacity: 0.9 }}>{venue.student_info}</p>
          </section>
        ) : null}

        <section style={{ marginBottom: "1.75rem" }} data-testid="venue-upcoming-events">
          <h2 style={sectionTitle}>Upcoming events</h2>
          {events.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.65 }}>No upcoming events posted yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem" }}>
              {events.map((ev) => (
                <li key={ev.id}>
                  <Link
                    to={`/events/${encodeURIComponent(ev.slug)}`}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                      border: "1px solid rgba(248,250,252,0.12)",
                      borderRadius: 14,
                      padding: "0.9rem 1rem",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{ev.name}</div>
                    <div style={{ opacity: 0.7, fontSize: "0.88rem", marginTop: 4 }}>
                      {[ev.starts_at || ev.event_date, ev.venue_label].filter(Boolean).join(" · ")}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ marginBottom: "1.75rem" }} data-testid="venue-specials">
          <h2 style={sectionTitle}>Food & drink info</h2>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", opacity: 0.65 }}>
            Informational only — not menu items, not for purchase on Menuply, not commissionable.
          </p>
          {specials.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.65 }}>No specials posted yet.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.7rem" }}>
              {specials.map((sp) => (
                <li
                  key={sp.id}
                  style={{
                    border: "1px solid rgba(248,250,252,0.1)",
                    borderRadius: 14,
                    padding: "0.85rem 1rem",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{sp.title}</div>
                  {sp.description ? (
                    <p style={{ margin: "0.35rem 0 0", opacity: 0.85, lineHeight: 1.45 }}>
                      {sp.description}
                    </p>
                  ) : null}
                  {sp.price_info ? (
                    <div style={{ marginTop: 6, fontWeight: 600, color: "#fde68a" }}>
                      {sp.price_info}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {restaurants.length > 0 ? (
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={sectionTitle}>Related restaurant</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.55rem" }}>
              {restaurants.map((r) => (
                <li key={r.id}>
                  {r.slug ? (
                    <Link
                      to={`/restaurants/${encodeURIComponent(r.slug)}`}
                      style={{ color: "#93c5fd", fontWeight: 600, textDecoration: "none" }}
                    >
                      {r.name} →
                    </Link>
                  ) : (
                    <span>{r.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <BottomNav />
    </div>
  );
}

const sectionTitle = {
  margin: "0 0 0.65rem",
  fontSize: "1.15rem",
  fontWeight: 800,
  letterSpacing: "-0.02em",
};
