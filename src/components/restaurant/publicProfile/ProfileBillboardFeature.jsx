/**
 * Signature billboard block — collapses entirely when empty.
 */
import { Link } from "react-router-dom";
import RestaurantBillboardStrip from "../../RestaurantBillboardStrip.jsx";
import { PROFILE_GREEN, PROFILE_INK, PROFILE_MUTED } from "./profilePrimitives.jsx";

export default function ProfileBillboardFeature({
  billboardPreview = [],
  billboardHref = null,
  isMobile = false,
}) {
  if (!Array.isArray(billboardPreview) || !billboardPreview.length) return null;

  return (
    <section
      data-testid="profile-billboard-feature"
      aria-label="Billboard"
      style={{
        marginBottom: 28,
        padding: isMobile ? "16px 14px" : "20px 20px",
        borderRadius: 16,
        background: "linear-gradient(160deg, #ecfdf5 0%, #ffffff 55%)",
        border: "1px solid #bbf7d0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: PROFILE_GREEN,
              marginBottom: 4,
            }}
          >
            Billboard
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: PROFILE_INK }}>
            What&apos;s happening now
          </div>
        </div>
        {billboardHref ? (
          <Link
            to={billboardHref}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: PROFILE_GREEN,
              textDecoration: "none",
            }}
          >
            View full billboard →
          </Link>
        ) : null}
      </div>
      <RestaurantBillboardStrip
        posts={billboardPreview}
        isDark={false}
        isMobile={isMobile}
        muted={PROFILE_MUTED}
      />
    </section>
  );
}
