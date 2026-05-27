import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import FoodInterestButton from "../components/food-interests/FoodInterestButton.jsx";
import { useFoodInterests } from "../context/FoodInterestsContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";

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

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const { interests, suggestions, loading, error } = useFoodInterests();

  const interestGroups = useMemo(() => {
    const groups = {
      dish: [],
      cuisine: [],
      trait: [],
    };
    for (const interest of interests) {
      if (groups[interest.interest_type]) groups[interest.interest_type].push(interest);
    }
    return groups;
  }, [interests]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(34,197,94,0.14), transparent 32%), linear-gradient(180deg, #0B0F0C 0%, #101712 100%)",
        color: "#FFFFFF",
        paddingBottom: "calc(var(--bottom-nav-h, 72px) + 28px)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>
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
            Food Interests
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 30, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Mark dishes, cuisines, and food traits you are interested in.
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 15, color: "#CBD5E1", lineHeight: 1.55, maxWidth: 560 }}>
            Keep this lightweight. Mark what you are into, then come back for simple “New For You” updates.
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
                Your selections can work locally now. Sign in to save them to your Menuply account.
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
                Sign in
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
          <PanelSection
            title="Your Interests"
            subtitle="Your dish, cuisine, and food trait interests stay here."
          >
            {loading ? (
              <div style={{ fontSize: 14, color: "#9CA3AF" }}>Loading interests…</div>
            ) : interests.length === 0 ? (
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.5 }}>
                You have not marked any food interests yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {["dish", "cuisine", "trait"].map((type) => (
                  interestGroups[type].length > 0 ? (
                    <div key={type}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {type === "dish" ? "Dish Interests" : type === "cuisine" ? "Cuisine Interests" : "Food Traits"}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {interestGroups[type].map((interest) => (
                          <FoodInterestButton
                            key={`${interest.interest_type}:${interest.interest_key}`}
                            interest={interest}
                            activeLabel="✓ Interested"
                            inactiveLabel="Interested"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </PanelSection>

          <PanelSection
            title="Suggested Interests"
            subtitle="Start with simple cuisines and food traits."
          >
            <div style={{ display: "grid", gap: 18 }}>
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
                      { interest_key: "korean", display_label: "Korean" },
                      { interest_key: "mediterranean", display_label: "Mediterranean" },
                      { interest_key: "japanese", display_label: "Japanese" },
                      { interest_key: "mexican", display_label: "Mexican" },
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

          <PanelSection
            title="New For You"
            subtitle="Placeholder cards for now. A full recommendation engine is intentionally out of scope."
          >
            <div style={{ display: "grid", gap: 12 }}>
              {suggestions.new_for_you.map((card) => (
                <div
                  key={card.id}
                  style={{
                    borderRadius: 16,
                    padding: "14px 15px",
                    border: "1px solid rgba(34,197,94,0.14)",
                    background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB" }}>{card.title}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#9CA3AF", lineHeight: 1.45 }}>{card.body}</div>
                </div>
              ))}
            </div>
          </PanelSection>

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
