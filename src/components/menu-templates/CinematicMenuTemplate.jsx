import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { pickFeaturedMenuItems } from "./menuTemplateFeatured.js";

function RestaurantLogoSlot({ logoUrl, restaurantName, size = 56 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        }}
      />
    );
  }
  return (
    <div
      title={restaurantName}
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        flexShrink: 0,
        background: "rgba(0,0,0,0.35)",
        border: "2px solid rgba(255,255,255,0.2)",
      }}
    />
  );
}

/**
 * V2 Modern / Cinematic — hero, featured row, immersive sections.
 */
export default function CinematicMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    heroImageUrl,
    logoUrl,
    logoPlacement = "top-left",
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    allergenBannerSlot,
    displaySections,
    displayableItemCount,
    dealItems,
    filtersActive,
    data,
    currentRestaurantId,
    dealMap,
    activeCartItems,
    hoveredItemId,
    setHoveredItemId,
    removeItem,
    navigate,
    setItemSheet,
    setAddedConfirmation,
    commitMenuItemToBasket,
    fmtMoney,
    getConsumerDisplayPrice,
    brand,
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    menuPresentation = {},
  } = ctx;

  const gradientFallback = brand?.heroBackdrop ?? "linear-gradient(135deg, hsl(24, 42%, 12%) 0%, hsl(280, 35%, 8%) 100%)";
  const featured = pickFeaturedMenuItems(displaySections, dealItems, 6);
  const showLogo = logoPlacement !== "hidden";

  return (
    <>
      <div
        style={{
          position: "relative",
          marginLeft: isMobile ? -12 : -20,
          marginRight: isMobile ? -12 : -20,
          marginBottom: 20,
          borderRadius: isMobile ? 0 : 20,
          overflow: "hidden",
          minHeight: isMobile ? 200 : 240,
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: heroImageUrl ? `url(${heroImageUrl}) center/cover no-repeat` : gradientFallback,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(11,15,12,0.92) 100%)",
          }}
        />
        <div style={{ position: "relative", padding: isMobile ? "18px 14px 22px" : "28px 22px 26px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
            {showLogo && <RestaurantLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    style={{
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 900,
                      color: "#fff",
                      textDecoration: "none",
                      lineHeight: 1.15,
                      textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                    }}
                  >
                    {restaurantName}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1.15,
                      textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                    }}
                  >
                    {restaurantName}
                  </div>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton
                    variant="menu"
                    label="Share"
                    shareData={shareData}
                    analyticsContext={shareAnalyticsContext}
                    size="compact"
                    tone="subtle"
                  />
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "rgba(226,232,240,0.85)" }}>
                {t("menuTemplates.v2.tagline", "Featured picks & full menu below")}
              </div>
            </div>
          </div>
          {franchiseSlot ? <div style={{ marginTop: 14 }}>{franchiseSlot}</div> : null}
        </div>
      </div>

      {intakeBannerSlot}
      {allergenBannerSlot}

      {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
        <>
          <ChipRail style={{ paddingBottom: 12, marginBottom: 4 }}>
            {menus.map(menu => {
              const isSelected = menu.id === selectedMenuId;
              const scheduleDays = Array.isArray(menu.schedule_days) ? menu.schedule_days : [];
              const hasSchedule = !!(menu.start_time && menu.end_time && scheduleDays.length > 0 && scheduleDays.length < 7);
              const isActiveBySchedule = hasSchedule && menu.is_currently_active === true;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => onSelectMenu(menu.id)}
                  disabled={tabLoading}
                  style={{
                    flexShrink: 0,
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: isSelected ? "1.5px solid #22c55e" : "1px solid #374151",
                    background: isSelected ? "rgba(34,197,94,0.10)" : "#111827",
                    color: isSelected ? "#86efac" : "#9CA3AF",
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 13,
                    cursor: tabLoading ? "wait" : "pointer",
                    opacity: tabLoading && !isSelected ? 0.5 : 1,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {menu.tab_label || menu.display_name || menu.name}
                    {isActiveBySchedule && !isSelected ? (
                      <span aria-hidden="true" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </ChipRail>
          {tabError ? (
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
              {tabError}
            </div>
          ) : null}
        </>
      )}

      {displayableItemCount === 0 ? (
        <div style={{ fontSize: 14, color: "var(--muted, #5b6675)", padding: "24px 0" }}>
          {filtersActive ? (
            <>
              {t(
                "publicMenu.noItemsAfterFilters",
                "This restaurant has no items that match your saved dietary preferences."
              )}{" "}
              <Link
                to="/account"
                style={{
                  color: brand?.accent ?? "#22C55E",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                {t("common.managePreferences", "Manage preferences")}
              </Link>
            </>
          ) : (
            t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
          )}
        </div>
      ) : (
        <>
          {featured.length > 0 ? (
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(148,163,184,0.9)",
                  marginBottom: 10,
                }}
              >
                {t("menuTemplates.v2.featured", "Featured")}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 6,
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {featured.map((it, idx) => (
                  <div
                    key={String(it?.id ?? idx)}
                    style={{
                      flex: "0 0 min(280px, 82vw)",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <PublicMenuItemCard
                      density="cinematic"
                      it={it}
                      sIdx={0}
                      iIdx={idx}
                      language={language}
                      t={t}
                      data={data}
                      restaurantName={restaurantName}
                      currentRestaurantId={currentRestaurantId}
                      dealMap={dealMap}
                      activeCartItems={activeCartItems}
                      hoveredItemId={hoveredItemId}
                      setHoveredItemId={setHoveredItemId}
                      removeItem={removeItem}
                      navigate={navigate}
                      setItemSheet={setItemSheet}
                      setAddedConfirmation={setAddedConfirmation}
                      commitMenuItemToBasket={commitMenuItemToBasket}
                      fmtMoney={fmtMoney}
                      getConsumerDisplayPrice={getConsumerDisplayPrice}
                      brand={brand}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {displaySections.map((sec, sIdx) => {
            const title = String(
              getLocalizedField(sec, "title", language) || sec?.title || t("publicMenu.menu")
            ).trim();
            const items = Array.isArray(sec?.items) ? sec.items : [];

            return (
              <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 20 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(148,163,184,0.95)",
                    marginBottom: 10,
                  }}
                >
                  {title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((it, iIdx) => (
                    <PublicMenuItemCard
                      key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                      density="cinematic"
                      it={it}
                      sIdx={sIdx}
                      iIdx={iIdx}
                      language={language}
                      t={t}
                      data={data}
                      restaurantName={restaurantName}
                      currentRestaurantId={currentRestaurantId}
                      dealMap={dealMap}
                      activeCartItems={activeCartItems}
                      hoveredItemId={hoveredItemId}
                      setHoveredItemId={setHoveredItemId}
                      removeItem={removeItem}
                      navigate={navigate}
                      setItemSheet={setItemSheet}
                      setAddedConfirmation={setAddedConfirmation}
                      commitMenuItemToBasket={commitMenuItemToBasket}
                      fmtMoney={fmtMoney}
                      getConsumerDisplayPrice={getConsumerDisplayPrice}
                      brand={brand}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

    </>
  );
}
