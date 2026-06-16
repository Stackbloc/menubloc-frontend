import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return {
    city: str.slice(0, comma).trim(),
    state: str.slice(comma + 1).trim(),
  };
}

function sectionTitleStyle() {
  return {
    fontSize: 18,
    fontWeight: 800,
    color: "#F9FAFB",
    letterSpacing: "-0.01em",
  };
}

function PanelSection({ title, subtitle, children }) {
  return (
    <section
      style={{
        borderRadius: 20,
        border: "1px solid rgba(31,41,55,0.92)",
        background: "rgba(17,24,20,0.88)",
        padding: 18,
        boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
      }}
    >
      <div style={sectionTitleStyle()}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 4, fontSize: 13, color: "#9CA3AF", lineHeight: 1.45 }}>{subtitle}</div>
      ) : null}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

const CARD_COLORS = {
  marketplace_snapshot: "#86EFAC",
  food_spotlight:       "#60A5FA",
  deal_alert:           "#FBBF24",
  default:              "#9CA3AF",
};

function BriefingCard({ card }) {
  const accent = CARD_COLORS[card.type] || CARD_COLORS.default;
  return (
    <div style={{
      borderRadius: 16,
      padding: "14px 15px",
      border: `1px solid ${accent}22`,
      background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))",
    }}>
      {card.category_label && (
        <div style={{
          fontSize: 10, fontWeight: 800, color: accent,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
        }}>
          {card.category_label}
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>
        {card.headline}
      </div>

      {card.bullets && card.bullets.length > 0 && (
        <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px", listStyle: "disc" }}>
          {card.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{b}</li>
          ))}
        </ul>
      )}

      {card.summary && (
        <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginTop: 4 }}>
          {card.summary}
        </div>
      )}

      {card.link && (
        <Link
          to={card.link}
          style={{
            display: "inline-block",
            marginTop: 10,
            fontSize: 12,
            fontWeight: 800,
            color: accent,
            textDecoration: "none",
            borderBottom: `1px solid ${accent}44`,
            paddingBottom: 1,
          }}
        >
          {card.link_label || "View →"}
        </Link>
      )}
    </div>
  );
}

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    const raw = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
    setLocationLabel(raw);
    const { city, state } = parseSessionLocation(raw);
    if (!city || !state) {
      setBriefingLoading(false);
      return;
    }
    setBriefingLoading(true);
    fetchWaiterBriefing(city, state)
      .then((data) => {
        setBriefing(data?.ok ? data : null);
      })
      .catch(() => setBriefing(null))
      .finally(() => setBriefingLoading(false));
  }, []);

  const briefingSubheading = useMemo(() => {
    if (briefing?.city && briefing?.state_full) {
      return `Today's food highlights from ${briefing.city}, ${briefing.state_full}.`;
    }
    if (locationLabel) {
      return `Today's food highlights from ${locationLabel}.`;
    }
    return "Your local food market intelligence.";
  }, [briefing, locationLabel]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--gb-color-page)",
        color: "var(--gb-color-ink)",
        paddingBottom: "calc(var(--bottom-nav-h, 72px) + 28px)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>

        {/* ── Header ── */}
        <div
          style={{
            borderRadius: 24,
            padding: "18px 18px 20px",
            background: "linear-gradient(135deg, rgba(20,31,22,0.98), rgba(13,19,16,0.94))",
            border: "1px solid rgba(34,197,94,0.16)",
            boxShadow: "0 24px 54px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "#86EFAC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Waiter
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            {briefingSubheading}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#CBD5E1", lineHeight: 1.55, maxWidth: 540 }}>
            Food intelligence for your local market. Updated daily.
          </p>
          {!isAuthenticated && (
            <div
              style={{
                marginTop: 16,
                borderRadius: 16,
                border: "1px solid rgba(34,197,94,0.18)",
                background: "rgba(34,197,94,0.08)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, color: "#DCFCE7", lineHeight: 1.45 }}>
                Sign in to unlock personalized recommendations — follow foods, cuisines, and restaurants.
              </div>
              <button
                type="button"
                onClick={() => navigate("/account/login")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  background: "#22C55E",
                  color: "#0B0F0C",
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "10px 12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>

          {/* ── Today's Highlights ── */}
          <PanelSection
            title="Today's Highlights"
            subtitle={briefingLoading ? "Loading…" : briefingSubheading}
          >
            {briefingLoading ? (
              <div style={{ fontSize: 14, color: "#9CA3AF" }}>Loading briefing…</div>
            ) : briefing?.cards?.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {briefing.cards.map((card, i) => (
                  <BriefingCard key={`${card.type}-${i}`} card={card} />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>
                {locationLabel
                  ? `Set your location on the home screen to see local highlights for ${locationLabel}.`
                  : "Set your location on the home screen to see local food highlights."}
              </div>
            )}
          </PanelSection>

          {/* ── Sign-in prompt (unsigned only) ── */}
          {!isAuthenticated && (
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(34,197,94,0.16)",
                background: "rgba(17,24,20,0.88)",
                padding: 18,
                boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB", marginBottom: 10 }}>
                Get Personalized Recommendations
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 14, lineHeight: 1.55 }}>
                Sign in to unlock the full Waiter experience:
              </div>
              <ul style={{ margin: "0 0 14px", padding: "0 0 0 18px", listStyle: "disc" }}>
                {[
                  "Follow foods and receive relevant updates",
                  "Follow cuisines and discover nearby options",
                  "Follow restaurants and track menu changes",
                  "Receive personalized daily briefings",
                  "Track deals from your favorite restaurants",
                ].map((item) => (
                  <li key={item} style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7 }}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigate("/account/login")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  background: "#22C55E",
                  color: "#0B0F0C",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "12px 20px",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            </div>
          )}

          {/* ── Manage Interests link (signed-in only) ── */}
          {isAuthenticated && (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <Link
                to="/account/interests"
                style={{ fontSize: 13, color: "#6B7280", textDecoration: "none", borderBottom: "1px solid #374151", paddingBottom: 1 }}
              >
                Manage food interests →
              </Link>
            </div>
          )}

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
