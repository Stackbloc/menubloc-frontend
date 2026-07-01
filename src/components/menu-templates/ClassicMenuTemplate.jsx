import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getMenuSectionImageUrl } from "./menuImageUtils.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";
import { useIsTabletRange } from "./menuPresentationUtils.js";

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const INK = "#1D1D1F";
const SUBTLE = "#6E6E73";
const HAIRLINE = "#E5E5EA";

function RestaurantLogoSlot({ logoUrl, restaurantName, size = 44 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      title={restaurantName}
      aria-hidden
      style={{ width: size, height: size, borderRadius: 10, flexShrink: 0, background: "#F5F5F7" }}
    />
  );
}

/**
 * V1 Classic (default) — Apple-inspired editorial redesign, adopted as the
 * default menu template. White space is the primary structural tool: no card
 * backgrounds, no borders, no colored badge fills, one restrained accent used
 * only where it carries meaning (price stays neutral; accent is reserved for
 * active/in-cart state). Hairline dividers separate rows instead of gaps
 * between boxes. Typography carries the hierarchy that color/chrome used to.
 *
 * Scope note: this covers the restaurant header through the item list only.
 * The surrounding site chrome (top nav, bottom tab bar) is shared across the
 * whole app and out of scope here — it stays as-is (still dark).
 *
 * Item-level styling lives behind PublicMenuItemCard's `editorialRefresh`
 * flag, which is additive-only and does not affect the boutique templates
 * (v2 ModernFastCasual, v5 FamilyDiner) that also use density="classic".
 */
export default function ClassicMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    menuTypeLabel,
    scheduledActiveMenuLabel,
    addressLine1,
    addressLine2,
    addressLine,
    directionsHref,
    logoUrl,
    logoPlacement = "top-left",
    heroImageUrl,
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    allergenBannerSlot,
    displaySections,
    displayableItemCount,
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
    menuThemeSettings = {},
  } = ctx;

  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  const showLogo = logoPlacement !== "hidden";
  const isTablet = useIsTabletRange();
  // Must exactly cancel the ancestor page container's horizontal padding
  // (PublicMenuPage.jsx uses the same isMobile 900px cutoff: 12px vs 20px).
  const edgeBleed = isMobile ? -12 : -20;
  const accent = brand?.accent ?? "#0071E3";
  // TEMPORARY, scoped experiment: share sits inline next to the name instead
  // of anchored to the trailing edge. Requested for Emmy Squared Pizza (id
  // 678) only, to compare against the default anchored-right placement
  // before deciding whether to change it platform-wide.
  const shareInlineExperiment = String(currentRestaurantId) === "678";

  return (
    <div style={{ fontFamily: FONT_STACK, background: "#FFFFFF", marginLeft: edgeBleed, marginRight: edgeBleed }}>
      {heroImageUrl ? (
        <div aria-hidden style={{ height: isTablet ? 140 : isMobile ? 120 : 180, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <img
            src={heroImageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "sticky",
          top: "var(--sph-h, 88px)",
          zIndex: 50,
          background: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: isTablet ? "20px 16px" : isMobile ? "18px 16px" : "28px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
          {showLogo && <RestaurantLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "nowrap" }}>
              <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                {restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    title={`Open ${restaurantName} profile`}
                    style={{
                      fontSize: isTablet ? 24 : isMobile ? 22 : 28,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      color: INK,
                      textDecoration: "none",
                      display: "block",
                      minWidth: 0,
                      flexShrink: shareInlineExperiment ? 1 : undefined,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {restaurantName}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: isTablet ? 24 : isMobile ? 22 : 28,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      color: INK,
                      minWidth: 0,
                      flexShrink: shareInlineExperiment ? 1 : undefined,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {restaurantName}
                  </div>
                )}

                {shareInlineExperiment ? (
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    <ShareButton
                      variant="menu"
                      iconOnly={true}
                      tone="inline"
                      shareData={shareData}
                      analyticsContext={shareAnalyticsContext}
                    />
                  </div>
                ) : null}
              </div>

              {!shareInlineExperiment ? (
                <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, marginTop: 4 }}>
                  <ShareButton
                    variant="menu"
                    iconOnly={true}
                    tone="inline"
                    shareData={shareData}
                    analyticsContext={shareAnalyticsContext}
                  />
                </div>
              ) : null}
            </div>

            {addressLine ? (
              <div style={{ fontSize: 14, color: SUBTLE, fontWeight: 400, marginTop: 4 }}>
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${restaurantName}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
                  </a>
                ) : (
                  <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
                )}
              </div>
            ) : null}

            {(scheduledActiveMenuLabel || menuTypeLabel) ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 400, color: SUBTLE }}>
                {scheduledActiveMenuLabel || menuTypeLabel}
              </div>
            ) : null}

            {franchiseSlot}
          </div>
        </div>
      </div>

      <div style={{ padding: isTablet ? "0 16px" : isMobile ? "0 16px" : "0 24px" }}>
        <main style={{ minWidth: 0, width: "100%" }}>
          {intakeBannerSlot}
          {allergenBannerSlot}

          {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
            <>
              <ChipRail style={{ paddingTop: 16, paddingBottom: 12 }}>
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
                        padding: "7px 16px",
                        borderRadius: 999,
                        border: isSelected ? `1px solid ${INK}` : `1px solid ${HAIRLINE}`,
                        background: isSelected ? INK : "transparent",
                        color: isSelected ? "#FFFFFF" : SUBTLE,
                        fontWeight: 500,
                        fontSize: 14,
                        cursor: tabLoading ? "wait" : "pointer",
                        opacity: tabLoading && !isSelected ? 0.5 : 1,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {menu.tab_label || menu.display_name || menu.name}
                        {isActiveBySchedule && !isSelected ? (
                          <span aria-hidden="true" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </ChipRail>
              {tabError ? (
                <div style={{ fontSize: 13, color: SUBTLE, marginBottom: 8 }}>{tabError}</div>
              ) : null}
            </>
          )}

          {displayableItemCount === 0 ? (
            <div style={{ fontSize: 15, color: SUBTLE, padding: "32px 0" }}>
              {filtersActive ? (
                <>
                  {t(
                    "publicMenu.noItemsAfterFilters",
                    "This restaurant has no items that match your saved dietary preferences."
                  )}{" "}
                  <Link to="/account" style={{ color: accent, fontWeight: 500, fontSize: 15, textDecoration: "underline" }}>
                    {t("common.managePreferences", "Manage preferences")}
                  </Link>
                </>
              ) : (
                t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
              )}
            </div>
          ) : (
            displaySections.map((sec, sIdx) => {
              const title = String(
                getLocalizedField(sec, "title", language) || sec?.title || t("publicMenu.menu")
              ).trim();
              const items = Array.isArray(sec?.items) ? sec.items : [];
              const sectionImage = getMenuSectionImageUrl(sec);

              return (
                <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 28 : 40 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: SUBTLE,
                      marginBottom: 4,
                    }}
                  >
                    {title}
                  </div>

                  {showSectionImages && sectionImage ? (
                    <div aria-hidden="true" style={{ margin: "12px 0", borderRadius: 12, overflow: "hidden" }}>
                      <img
                        src={sectionImage}
                        alt=""
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: isTablet ? 164 : isMobile ? 136 : 188,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : null}

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((it, iIdx) => (
                      <PublicMenuItemCard
                        key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                        density="classic"
                        editorialRefresh={true}
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
                        menuThemeSettings={menuThemeSettings}
                        showImage={showItemImages}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
