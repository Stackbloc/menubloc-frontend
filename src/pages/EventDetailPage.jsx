/**
 * Public venue event detail page (Phase 4).
 * Shows age requirement as a real constraint; ticket purchase is config-only.
 */
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { apiGet } from "../lib/api.js";
import { restaurantPathFromRow } from "../lib/canonicalUrl.js";

function formatCents(cents) {
  if (!Number.isFinite(Number(cents))) return null;
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatWhen(event) {
  const parts = [];
  if (event?.date || event?.event_date) parts.push(event.date || event.event_date);
  if (event?.start_time) parts.push(event.start_time);
  else if (event?.starts_at) {
    try {
      parts.push(
        new Date(event.starts_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      );
    } catch {
      /* ignore */
    }
  }
  return parts.filter(Boolean).join(" · ");
}

export default function EventDetailPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [event, setEvent] = useState(null);
  const [purchaseMsg, setPurchaseMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/public/events/${encodeURIComponent(String(slug || ""))}`);
        if (cancelled) return;
        setEvent(data?.event || null);
        setPurchaseMsg(data?.purchase?.message || "");
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Event not found");
        setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const restaurantHref = event?.restaurant ? restaurantPathFromRow(event.restaurant) : null;

  return (
    <div data-testid="event-detail-page" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <StickyPageHeader title={event?.name || "Event"} />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 96px", display: "grid", gap: 14 }}>
        {loading ? <div style={{ color: "#5b6675" }}>Loading…</div> : null}
        {error ? (
          <div role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}

        {event ? (
          <>
            {event.age_requirement_label ? (
              <div
                data-testid="event-age-requirement"
                role="status"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#9a3412",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                Age requirement: {event.age_requirement_label}
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                  Entry and ticket purchase (when enabled) require meeting this age.
                </div>
              </div>
            ) : null}

            {event.cover_photo_url ? (
              <img
                src={event.cover_photo_url}
                alt=""
                style={{ width: "100%", borderRadius: 14, maxHeight: 280, objectFit: "cover" }}
              />
            ) : null}

            <div style={{ display: "grid", gap: 6 }}>
              <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.15 }}>{event.name}</h1>
              {formatWhen(event) ? (
                <div style={{ color: "#5b6675", fontSize: 14 }}>{formatWhen(event)}</div>
              ) : null}
              {event.venue_label || event.restaurant?.name ? (
                <div style={{ color: "#5b6675", fontSize: 14 }}>
                  {event.venue_label || event.restaurant?.name}
                  {restaurantHref ? (
                    <>
                      {" · "}
                      <Link to={restaurantHref} style={{ color: "#166534", fontWeight: 700 }}>
                        Venue profile
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            {event.description ? (
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#1c1917", whiteSpace: "pre-wrap" }}>
                {event.description}
              </p>
            ) : null}

            {(event.rules || event.refund_policy || event.capacity != null) ? (
              <section style={{ display: "grid", gap: 8, padding: 14, background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4" }}>
                {event.capacity != null ? (
                  <div style={{ fontSize: 14 }}>
                    <strong>Capacity:</strong> {event.capacity}
                  </div>
                ) : null}
                {event.rules ? (
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                    <strong>Rules:</strong> {event.rules}
                  </div>
                ) : null}
                {event.refund_policy ? (
                  <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
                    <strong>Refund policy:</strong> {event.refund_policy}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section style={{ display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Tickets</h2>
              {(event.ticket_types || []).length ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                  {event.ticket_types.map((t) => (
                    <li
                      key={t.id}
                      style={{
                        padding: "12px 14px",
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e7e5e4",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {t.name}{" "}
                        <span style={{ color: "#78716c", fontWeight: 600, fontSize: 12 }}>
                          ({String(t.ticket_kind || "").toUpperCase()})
                        </span>
                      </div>
                      {t.description ? (
                        <div style={{ fontSize: 13, color: "#5b6675", marginTop: 2 }}>{t.description}</div>
                      ) : null}
                      <div style={{ marginTop: 6, fontWeight: 800 }}>{formatCents(t.price_cents)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#5b6675", fontSize: 14 }}>Ticket types will appear here when configured.</div>
              )}
              <div
                data-testid="event-purchase-stub"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#f1f5f9",
                  color: "#475569",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {purchaseMsg ||
                  "Ticket purchase is not enabled yet. Configuration is ready; checkout will use Menuply commerce later."}
                <div style={{ marginTop: 8 }}>
                  <button type="button" disabled style={{ opacity: 0.55, fontWeight: 700 }}>
                    Buy tickets (coming soon)
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}
