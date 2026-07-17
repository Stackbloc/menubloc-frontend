/**
 * Option A — large editorial public restaurant profile (claimed / owner view).
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

export default function RestaurantPublicEditorial({
  name,
  locationLine,
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
  tierLabel,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  menuHref,
  menuSearch,
  viewMenuLabel,
  menuPreviewItems,
  billboardPreview,
  billboardHref,
  dealItems,
  displayCluster,
  statusBanners,
  statusEventPresentations,
  isMobile,
  translateUi,
}) {
  const hasStatus =
    (Array.isArray(statusBanners) && statusBanners.length > 0) ||
    (Array.isArray(statusEventPresentations) && statusEventPresentations.length > 0);

  const metaBits = [cuisine, category].filter(Boolean);
  const hasDetails = Boolean(
    website || phone || cuisine || category || streetAddr || cityLine
  );

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
      {/* Full-bleed hero */}
      <header
        aria-label={bannerPhotoUrl ? `${name} banner` : `${name}`}
        style={{
          position: "relative",
          minHeight: isMobile ? 200 : 280,
          backgroundColor: "#e7e5e4",
          backgroundImage: bannerPhotoUrl
            ? `linear-gradient(to top, rgba(28,25,23,0.72) 0%, rgba(28,25,23,0.2) 45%, transparent 70%), url(${JSON.stringify(
                String(bannerPhotoUrl)
              )})`
            : "linear-gradient(160deg, #f5f5f4 0%, #e7e5e4 55%, #d6d3d1 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!bannerPhotoUrl ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              padding: isMobile ? 16 : "20px 28px",
              color: "#78716c",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Photo coming soon
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: isMobile ? "20px 16px 18px" : "28px 28px 24px",
            color: bannerPhotoUrl ? "#fafaf9" : "#1c1917",
          }}
        >
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  width={72}
                  height={72}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "2px solid #fafaf9",
                    background: "#fff",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: isMobile ? 28 : 40,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      wordBreak: "break-word",
                    }}
                  >
                    {name}
                  </h1>
                  {statusLightProps ? (
                    <RestaurantStatusLight {...statusLightProps} size={7} />
                  ) : null}
                  {tierLabel ? (
                    <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{tierLabel}</span>
                  ) : null}
                </div>
                {locationLine ? (
                  <p style={{ margin: "8px 0 0", fontSize: 15, opacity: bannerPhotoUrl ? 0.9 : 0.75 }}>
                    {locationLine}
                  </p>
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
                          border: bannerPhotoUrl
                            ? "1px solid rgba(250,250,249,0.35)"
                            : "1px solid #d6d3d1",
                          background: bannerPhotoUrl ? "rgba(28,25,23,0.25)" : "#fafaf9",
                        }}
                      >
                        {bit}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              {restaurantId || shareData ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: MENU_ROW_HEADER_ICON_GAP,
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
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: isMobile ? "24px 16px 0" : "32px 28px 0",
        }}
      >
        {/* Primary actions — quiet, not blue chrome */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
          {menuHref ? (
            <Link
              to={{ pathname: menuHref, search: menuSearch || "" }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                background: "#1c1917",
                color: "#fafaf9",
              }}
            >
              {viewMenuLabel || translateUi?.("common.viewMenu") || "View menu"}
            </Link>
          ) : null}
          {directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Get directions to ${name}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                background: "#ffffff",
                color: "#1c1917",
                border: "1px solid #d6d3d1",
              }}
            >
              Directions
            </a>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile || !(menuPreviewItems?.length && menuHref)
                ? "1fr"
                : "minmax(0, 1.55fr) minmax(240px, 0.85fr)",
            gap: isMobile ? 8 : 8,
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
                    {website ? (
                      <QuietLink href={website}>{websiteRaw || website} ↗</QuietLink>
                    ) : null}
                  </DetailLine>
                  <DetailLine label="Phone">
                    {phone ? (
                      <a href={`tel:${String(phone).replace(/\s+/g, "")}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {phone}
                      </a>
                    ) : null}
                  </DetailLine>
                  <DetailLine label="Cuisine">{cuisine || null}</DetailLine>
                  <DetailLine label="Category">{category || null}</DetailLine>
                  <DetailLine label="Address">
                    {streetAddr || cityLine ? (
                      directionsUrl && (streetAddr || cityLine) ? (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}
                        >
                          {streetAddr || cityLine}
                          {streetAddr && cityLine ? (
                            <span style={{ display: "block", marginTop: 4, color: "#57534e" }}>{cityLine}</span>
                          ) : null}
                        </a>
                      ) : (
                        <>
                          {streetAddr}
                          {streetAddr && cityLine ? (
                            <span style={{ display: "block", marginTop: 4, color: "#57534e" }}>{cityLine}</span>
                          ) : (
                            !streetAddr && cityLine
                          )}
                        </>
                      )
                    ) : null}
                  </DetailLine>
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
                  {displayCluster.cluster_type
                    ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}`
                    : ""}
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

            {isMobile && menuPreviewItems?.length && menuHref ? (
              <div style={{ marginTop: 8, marginBottom: 24 }}>
                <RestaurantProfileMenuPreview
                  items={menuPreviewItems}
                  menuHref={menuHref}
                  search={menuSearch}
                  viewMenuLabel={viewMenuLabel || "View full menu"}
                  isMobile
                />
              </div>
            ) : null}
          </div>

          {!isMobile && menuPreviewItems?.length && menuHref ? (
            <RestaurantProfileMenuPreview
              items={menuPreviewItems}
              menuHref={menuHref}
              search={menuSearch}
              viewMenuLabel={viewMenuLabel || "View full menu"}
              isMobile={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
