/**
 * Consumer public restaurant profile hero — banner/logo, identity, actions.
 * Does not fetch; uses props resolved from the profile payload.
 */
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import RestaurantStatusLight from "../RestaurantStatusLight.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../menu-templates/menuPresentationUtils.js";

function HeroFallbackWash({ accentBarColor, metaColor, isMobile }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(145deg, #e8eef6 0%, #f4f7fb 48%, #dfe8f3 100%)",
      }}
    >
      {accentBarColor ? (
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 4,
            background: accentBarColor,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          padding: isMobile ? "12px 16px" : "14px 24px",
          color: metaColor || "#64748b",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {/* Quiet empty-state label — not a claim upsell */}
        Photo coming soon
      </div>
    </div>
  );
}

export default function RestaurantProfileHero({
  name,
  locationLine = "",
  cuisine = "",
  category = "",
  logoUrl = "",
  bannerPhotoUrl = null,
  tierLabel = "",
  tierBadgeColor = "#1e40af",
  accentBarColor = "",
  metaColor = "#64748b",
  nameColor = "#0f172a",
  isMobile = false,
  restaurantId = null,
  statusLightProps = null,
  shareData = null,
  shareAnalytics = null,
  primaryActions = null,
}) {
  const metaChips = [cuisine, category].filter(Boolean);

  return (
    <header
      style={{
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid #e4e9f0",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div
        aria-label={bannerPhotoUrl ? `${name} banner` : `${name} banner area`}
        style={{
          position: "relative",
          minHeight: isMobile ? 132 : 168,
          backgroundColor: bannerPhotoUrl ? "#0f172a" : "#eef2f7",
          backgroundImage: bannerPhotoUrl
            ? `linear-gradient(to top, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.12) 45%, transparent 70%), url(${JSON.stringify(
                String(bannerPhotoUrl)
              )})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!bannerPhotoUrl ? (
          <HeroFallbackWash
            accentBarColor={accentBarColor}
            metaColor={metaColor}
            isMobile={isMobile}
          />
        ) : accentBarColor ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 4,
              background: accentBarColor,
            }}
          />
        ) : null}

        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            width={72}
            height={72}
            style={{
              position: "absolute",
              left: isMobile ? 16 : 24,
              bottom: -28,
              width: 72,
              height: 72,
              objectFit: "cover",
              borderRadius: 14,
              border: "3px solid #ffffff",
              background: "#ffffff",
              boxShadow: "0 6px 18px rgba(15,23,42,0.18)",
              zIndex: 2,
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          padding: isMobile
            ? logoUrl
              ? "36px 16px 16px"
              : "16px 16px 16px"
            : logoUrl
              ? "40px 24px 18px"
              : "18px 24px 18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 24 : 30,
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: nameColor,
              wordBreak: "break-word",
            }}
          >
            {name}
          </h1>

          {statusLightProps ? (
            <RestaurantStatusLight {...statusLightProps} size={7} />
          ) : null}

          {tierLabel ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tierBadgeColor,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {tierLabel}
            </span>
          ) : null}

          {restaurantId || shareData ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: MENU_ROW_HEADER_ICON_GAP,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              {restaurantId ? (
                <FollowRestaurantButton
                  restaurantId={restaurantId}
                  restaurantName={name}
                  source="restaurant_profile"
                  size={MENU_ROW_ICON_SIZE}
                />
              ) : null}
              {shareData ? (
                <ShareButton
                  variant="menu"
                  iconOnly
                  tone="ghost"
                  shareData={shareData}
                  analyticsContext={shareAnalytics || undefined}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {locationLine ? (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: metaColor,
            }}
          >
            {locationLine}
          </p>
        ) : null}

        {metaChips.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            {metaChips.map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#334155",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {primaryActions ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 16,
            }}
          >
            {primaryActions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
