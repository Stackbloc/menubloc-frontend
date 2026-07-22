/**
 * Option A — editorial public restaurant profile (claimed / owner view).
 * Consumer presentation only. Not a form. Not the Claim Screen.
 */
import { Link } from "react-router-dom";
import RestaurantBillboardStrip from "../RestaurantBillboardStrip.jsx";
import RestaurantStatusBannerStrip from "./RestaurantStatusBannerStrip.jsx";
import RestaurantProfileMenuPreview from "./RestaurantProfileMenuPreview.jsx";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import RestaurantStatusLight from "../RestaurantStatusLight.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../menu-templates/menuPresentationUtils.js";
import { clusterTypeLabel } from "../../lib/clusterUrl.js";

function Section({ title, children }) {
  if (children == null || children === false || children === "") return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: "#78716c",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.65, color: "#1c1917" }}>{children}</div>
    </section>
  );
}

function QuietLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#166534", textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

function DetailLine({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "8px 0" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#1c1917", lineHeight: 1.5, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function IdentityBlock({
  name,
  cityLine,
  streetAddr,
  directionsUrl,
  logoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  metaBits,
  onPhoto = false,
  isMobile,
}) {
  const ink = onPhoto ? "#fafaf9" : "#1c1917";
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : "#57534e";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            objectFit: "cover",
            borderRadius: 12,
            border: onPhoto ? "2px solid #fafaf9" : "1px solid #e7e5e4",
            background: "#fff",
            flexShrink: 0,
          }}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + like/share on one row — same pattern as public menu headers */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            {statusLightProps ? <RestaurantStatusLight {...statusLightProps} size={7} /> : null}
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 24 : 32,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </h1>
          </div>
          {restaurantId || shareData ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: MENU_ROW_HEADER_ICON_GAP,
                flexShrink: 0,
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

        {/* City / state directly under the name, same left edge */}
        {cityLine || streetAddr ? (
          directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Get directions to ${name}`}
              style={{
                margin: "6px 0 0",
                display: "block",
                fontSize: 14,
                lineHeight: 1.4,
                color: muted,
                textDecoration: "none",
              }}
            >
              {streetAddr ? <span style={{ display: "block" }}>{streetAddr}</span> : null}
              {cityLine ? <span style={{ display: "block" }}>{cityLine}</span> : null}
            </a>
          ) : (
            <div style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.4, color: muted }}>
              {streetAddr ? <div>{streetAddr}</div> : null}
              {cityLine ? <div>{cityLine}</div> : null}
            </div>
          )
        ) : null}

        {metaBits.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {metaBits.map((bit) => (
              <span
                key={bit}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: onPhoto ? "1px solid rgba(250,250,249,0.35)" : "1px solid #d6d3d1",
                  background: onPhoto ? "rgba(28,25,23,0.25)" : "#fff",
                  color: ink,
                }}
              >
                {bit}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RestaurantPublicEditorial({
  name,
  streetAddr,
  cityLine,
  directionsUrl,
  website,
  websiteRaw,
  phone,
  cuisine,
  category,
  aboutText,
  featuredText,
  landmarks,
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  menuPreviewItems,
  billboardPreview,
  billboardHref,
  dealItems,
  displayCluster,
  statusBanners,
  statusEventPresentations,
  isMobile,
}) {
  const hasStatus =
    (Array.isArray(statusBanners) && statusBanners.length > 0) ||
    (Array.isArray(statusEventPresentations) && statusEventPresentations.length > 0);

  const metaBits = [cuisine, category].filter(Boolean);
  // Address lives only in IdentityBlock (header / sticky strip). Do not repeat it under details.
  const hasDetails = Boolean(website || phone || cuisine || category);
  const hasMenuPreview = Array.isArray(menuPreviewItems) && menuPreviewItems.length > 0;

  const identityProps = {
    name,
    cityLine,
    streetAddr,
    directionsUrl,
    logoUrl,
    statusLightProps,
    restaurantId,
    shareData,
    shareAnalytics,
    metaBits,
    isMobile,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf9",
        color: "#1c1917",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        paddingBottom: 88,
      }}
    >
      {bannerPhotoUrl ? (
        <header
          aria-label={`${name} banner`}
          style={{
            position: "relative",
            minHeight: isMobile ? 180 : 240,
            backgroundColor: "#e7e5e4",
            backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.72) 0%, rgba(28,25,23,0.2) 45%, transparent 70%), url(${JSON.stringify(
              String(bannerPhotoUrl)
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: isMobile ? "20px 16px 18px" : "28px 28px 24px",
            }}
          >
            <div style={{ maxWidth: 1040, margin: "0 auto" }}>
              <IdentityBlock {...identityProps} onPhoto />
            </div>
          </div>
        </header>
      ) : (
        <header
          aria-label={name}
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: isMobile ? "24px 16px 8px" : "32px 28px 8px",
          }}
        >
          <IdentityBlock {...identityProps} onPhoto={false} />
        </header>
      )}

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: isMobile ? "20px 16px 0" : "28px 28px 0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile || !hasMenuPreview ? "1fr" : "minmax(0, 1.55fr) minmax(240px, 0.85fr)",
            gap: 8,
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0, paddingRight: isMobile ? 0 : 8 }}>
            <Section title="About">{aboutText || null}</Section>
            <Section title="Featured dish">{featuredText || null}</Section>

            {hasDetails ? (
              <Section title="Restaurant details">
                <div style={{ borderTop: "1px solid #e7e5e4" }}>
                  <DetailLine label="Website">
                    {website ? <QuietLink href={website}>{websiteRaw || website} ↗</QuietLink> : null}
                  </DetailLine>
                  <DetailLine label="Phone">
                    {phone ? (
                      <a
                        href={`tel:${String(phone).replace(/\s+/g, "")}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {phone}
                      </a>
                    ) : null}
                  </DetailLine>
                  <DetailLine label="Cuisine">{cuisine || null}</DetailLine>
                  <DetailLine label="Category">{category || null}</DetailLine>
                </div>
              </Section>
            ) : null}

            <Section title="Nearby">{landmarks || null}</Section>

            {displayCluster?.name && displayCluster?.public_url ? (
              <Section title="Cluster">
                <Link
                  to={displayCluster.public_url}
                  style={{ color: "#166534", textDecoration: "none", fontWeight: 600 }}
                >
                  {displayCluster.name}
                  {displayCluster.cluster_type ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}` : ""}
                </Link>
              </Section>
            ) : null}

            {Array.isArray(dealItems) && dealItems.length ? (
              <Section title="Active deals">
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {dealItems.map((deal, idx) => (
                    <li key={deal.id ?? `deal-${idx}`} style={{ padding: "6px 0" }}>
                      <span style={{ fontWeight: 600 }}>{deal.name}</span>
                      {deal.price ? (
                        <span style={{ marginLeft: 8, color: "#78716c", fontSize: 13 }}>{deal.price}</span>
                      ) : null}
                      {deal.description ? (
                        <div style={{ fontSize: 13, color: "#78716c", marginTop: 2 }}>{deal.description}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {Array.isArray(billboardPreview) && billboardPreview.length ? (
              <Section title="Billboard">
                <RestaurantBillboardStrip
                  posts={billboardPreview}
                  isDark={false}
                  isMobile={isMobile}
                  muted="#78716c"
                />
                {billboardHref ? (
                  <div style={{ marginTop: 12 }}>
                    <Link
                      to={billboardHref}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 36,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "1px solid #d6d3d1",
                        background: "#fff",
                        color: "#1c1917",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      View full billboard
                    </Link>
                  </div>
                ) : null}
              </Section>
            ) : null}

            {hasStatus ? (
              <Section title="Announcements">
                <RestaurantStatusBannerStrip
                  variant="aside"
                  statusBanners={statusBanners}
                  statusEventPresentations={statusEventPresentations}
                />
              </Section>
            ) : null}

            {isMobile && hasMenuPreview ? (
              <div style={{ marginTop: 8, marginBottom: 24 }}>
                <RestaurantProfileMenuPreview items={menuPreviewItems} isMobile />
              </div>
            ) : null}
          </div>

          {!isMobile && hasMenuPreview ? (
            <RestaurantProfileMenuPreview items={menuPreviewItems} isMobile={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
