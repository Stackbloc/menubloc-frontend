import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import FoodInterestButton from "../components/food-interests/FoodInterestButton.jsx";
import { useFoodInterests } from "../context/FoodInterestsContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";

// Parse "Los Angeles, CA" → { city: "Los Angeles", state: "CA" }
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

// Card type → accent color
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

      {/* Marketplace snapshot — bullet list */}
      {card.bullets && card.bullets.length > 0 && (
        <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px", listStyle: "disc" }}>
          {card.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{b}</li>
          ))}
        </ul>
      )}

      {/* Food spotlight / deal alert — single sentence */}
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

const SUGGESTED_FOODS = [
  { interest_key: "burger",           display_label: "Burger" },
  { interest_key: "pizza",            display_label: "Pizza" },
  { interest_key: "chicken_wings",    display_label: "Chicken Wings" },
  { interest_key: "chicken_sandwich", display_label: "Chicken Sandwich" },
  { interest_key: "tacos",            display_label: "Tacos" },
  { interest_key: "bbq",              display_label: "BBQ" },
  { interest_key: "seafood",          display_label: "Seafood" },
  { interest_key: "steak",            display_label: "Steak" },
  { interest_key: "salad",            display_label: "Salad" },
  { interest_key: "breakfast",        display_label: "Breakfast" },
  { interest_key: "coffee",           display_label: "Coffee" },
  { interest_key: "dessert",          display_label: "Desserts" },
];

export default function FoodInterestsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const { interests, suggestions, loading, error } = useFoodInterests();

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

  const interestGroups = useMemo(() => {
    const groups = { dish: [], cuisine: [], trait: [] };
    for (const interest of interests) {
      if (groups[interest.interest_type]) groups[interest.interest_type].push(interest);
    }
    return groups;
  }, [interests]);

  // Build a subheading for the briefing
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

          {/* ── Your Interests ── */}
          <PanelSection
            title={t("explore.yourInterests", "Your Interests")}
            subtitle={t("explore.subtitle", "Pick food interests to personalize discovery and search.")}
          >
            {loading ? (
              <div style={{ fontSize: 14, color: "#9CA3AF" }}>{t("explore.loadingInterests", "Loading interests…")}</div>
            ) : interests.length === 0 ? (
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.5 }}>
                {t("explore.noInterests", "You have not marked any food interests yet.")}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {["dish", "cuisine", "trait"].map((type) => (
                  interestGroups[type].length > 0 ? (
                    <div key={type}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {type === "dish"
                          ? t("explore.dishInterests", "Dish Interests")
                          : type === "cuisine"
                            ? t("explore.cuisineInterests", "Cuisine Interests")
                            : t("explore.foodTraits", "Food Traits")}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {interestGroups[type].map((interest) => (
                          <FoodInterestButton
                            key={`${interest.interest_type}:${interest.interest_key}`}
                            interest={interest}
                            activeLabel={t("explore.interestedActive", "✓ Interested")}
                            inactiveLabel={t("explore.interested", "Interested")}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </PanelSection>

          {/* ── Suggested Interests ── */}
          <PanelSection
            title={t("explore.suggestedInterests", "Suggested Interests")}
            subtitle={t("explore.suggestedSubtitle", "Start with simple cuisines, food traits, and foods.")}
          >
            <div style={{ display: "grid", gap: 18 }}>

              {/* Foods */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Foods
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {SUGGESTED_FOODS.map((food) => (
                    <FoodInterestButton
                      key={`food:${food.interest_key}`}
                      interest={{ ...food, interest_type: "dish" }}
                    />
                  ))}
                </div>
              </div>

              {/* Traits */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Traits
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {suggestions.traits.map((interest) => (
                    <FoodInterestButton
                      key={`trait:${interest.interest_key}`}
                      interest={{ ...interest, interest_type: "trait" }}
                    />
                  ))}
                </div>
              </div>

              {/* Cuisines */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Cuisines
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {suggestions.cuisines.length > 0 ? suggestions.cuisines.map((interest) => (
                    <FoodInterestButton
                      key={`cuisine:${interest.interest_key}`}
                      interest={{ ...interest, interest_type: "cuisine" }}
                    />
                  )) : (
                    [
                      { interest_key: "korean",        display_label: "Korean" },
                      { interest_key: "mediterranean",  display_label: "Mediterranean" },
                      { interest_key: "japanese",       display_label: "Japanese" },
                      { interest_key: "mexican",        display_label: "Mexican" },
                    ].map((interest) => (
                      <FoodInterestButton
                        key={`fallback-cuisine:${interest.interest_key}`}
                        interest={{ ...interest, interest_type: "cuisine" }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
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

          {error ? (
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(248,113,113,0.22)",
                background: "rgba(127,29,29,0.18)",
                color: "#FCA5A5",
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
