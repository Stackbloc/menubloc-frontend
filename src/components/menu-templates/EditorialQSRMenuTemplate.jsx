import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getMenuSectionImageUrl } from "./menuImageUtils.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";
import { useIsTabletRange, getRestaurantInitials, MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import MapPinIcon from "./MapPinIcon.jsx";
import MenuRestaurantDistanceLine from "./MenuRestaurantDistanceLine.jsx";
import RestaurantProfileLogoLink from "./RestaurantProfileLogoLink.jsx";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import MenuHeaderNameWithActions from "./MenuHeaderIconRail.jsx";

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
// Bright, punchy palette for quick-service / fast-casual concepts — bold
// orange-red accent on section headers/logo/tabs, bolder type weight
// throughout for a quick-scan feel. Price stays neutral ink, same as every
// other scheme (price never competes with the item name). Same layout
// system as v1.
const BG = "#FFFBF5";
const INK = "#1A1A1A";
const SUBTLE = "#767676";
const HAIRLINE = "#ECECEC";
const PUNCH = "#FF5A36";

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
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        flexShrink: 0,
        background: "#FFF0EA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: PUNCH,
      }}
    >
      {getRestaurantInitials(restaurantName)}
    </div>
  );
}

/**
 * V14 QSR / Fast Casual — bright, bold, quick-scan palette for counter-service
 * concepts (bowls, tacos, sandwiches, coffee). Same Apple-inspired layout
 * system as the default (v1); the differentiator is a punchy orange-red
 * accent (section headers, logo, selected tab) plus bolder type weight for a
 * faster, more energetic read. Price stays neutral, same as every scheme.
 *
 * Isolated: does not touch v1/v12/v13. Uses PublicMenuItemCard's
 * `editorialRefresh` + `editorialColorScheme="qsr"`.
 */
export default function EditorialQSRMenuTemplate(ctx) {
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
    distanceMiles,
    showDistanceBelowAddress,
    menuStatus,
    profileTier,
    listingStatus,
    planSlug,
    isPro,
    isPaidSubscriber,
    tone,
    claimStatus,
    subscriptionPlan,
    orderAcceptanceStatus,
    menuLastVerifiedAt,
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
  const edgeBleed = isMobile ? -12 : -20;
  const accent = brand?.accent ?? PUNCH;

  return (
    <div style={{ fontFamily: FONT_STACK, background: BG, marginLeft: edgeBleed, marginRight: edgeBleed }}>
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
          background: "rgba(255,251,245,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: isTablet ? "20px 16px" : isMobile ? "18px 16px" : "28px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
          {showLogo ? (
            <RestaurantProfileLogoLink profileHref={restaurantProfileHref} restaurantName={restaurantName}>
              <RestaurantLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />
            </RestaurantProfileLogoLink>
          ) : null}
          <div style={{ minWidth: 0, flex: 1 }}>
            <MenuHeaderNameWithActions
              tone={tone}
              claimStatus={claimStatus}
              subscriptionPlan={subscriptionPlan}
              menuStatus={menuStatus}
              profileTier={profileTier}
              listingStatus={listingStatus}
              planSlug={planSlug}
              isPro={isPro}
              isPaidSubscriber={isPaidSubscriber}
              orderAcceptanceStatus={orderAcceptanceStatus}
              nameSlot={
                restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    title={`Open ${restaurantName} profile`}
                    style={{
                      fontSize: isTablet ? 24 : isMobile ? 22 : 28,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      color: INK,
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {restaurantName}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: isTablet ? 24 : isMobile ? 22 : 28,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {restaurantName}
                  </div>
                )
              }
              onActionsClick={(e) => e.stopPropagation()}
              actions={
                <>
                  <FollowRestaurantButton restaurantId={currentRestaurantId} restaurantName={restaurantName} size={MENU_ROW_ICON_SIZE} />
                  <ShareButton
                    variant="menu"
                    iconOnly={true}
                    tone="ghost"
                    shareData={shareData}
                    analyticsContext={shareAnalyticsContext}
                  />
                </>
              }
            />

            {addressLine ? (
              directionsHref ? (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Get directions to ${restaurantName}`}
                  style={{
                    fontSize: 14,
                    color: SUBTLE,
                    fontWeight: 400,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 5,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <MapPinIcon size={13} stroke={SUBTLE} />
                  <span>
                    {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
                  </span>
                </a>
              ) : (
                <div style={{ fontSize: 14, color: SUBTLE, fontWeight: 400, marginTop: 4, display: "flex", alignItems: "flex-start", gap: 5 }}>
                  <MapPinIcon size={13} stroke={SUBTLE} />
                  <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
                </div>
              )
            ) : null}

            {showDistanceBelowAddress ? (
              <MenuRestaurantDistanceLine miles={distanceMiles} color={SUBTLE} />
            ) : null}

            {(scheduledActiveMenuLabel || menuTypeLabel) ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: SUBTLE }}>
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
                        border: isSelected ? `1px solid ${PUNCH}` : `1px solid ${HAIRLINE}`,
                        background: isSelected ? PUNCH : "transparent",
                        color: isSelected ? "#FFFFFF" : SUBTLE,
                        fontWeight: 700,
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
                  <Link to="/account" style={{ color: accent, fontWeight: 700, fontSize: 15, textDecoration: "underline" }}>
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
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: PUNCH,
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
                        editorialColorScheme="qsr"
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
