import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { useIsTabletRange, getRestaurantInitials, MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import MapPinIcon from "./MapPinIcon.jsx";
import MenuRestaurantDistanceLine from "./MenuRestaurantDistanceLine.jsx";
import RestaurantProfileLogoLink from "./RestaurantProfileLogoLink.jsx";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import MenuHeaderNameWithActions from "./MenuHeaderIconRail.jsx";

/**
 * V17 Fine — black/white serif, text-forward public menu inspired by
 * classic print / tablm.com OCR menus. Own layout identity; does not alter Classic (v1).
 */
const FONT_STACK = '"Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';
const INK = "#000000";
const SUBTLE = "#3F3F46";
const HAIRLINE = "#E5E5EA";
const ACCENT_DEFAULT = "#000000";

function RestaurantLogoSlot({ logoUrl, restaurantName, size = 44 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: 0, objectFit: "cover", flexShrink: 0 }}
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
        borderRadius: 0,
        flexShrink: 0,
        background: "#FFFFFF",
        border: `1px solid ${HAIRLINE}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: INK,
        fontFamily: FONT_STACK,
      }}
    >
      {getRestaurantInitials(restaurantName)}
    </div>
  );
}

export default function FineMenuTemplate(ctx) {
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
    logoUrl,
    logoPlacement = "top-left",
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

  const showLogo = logoPlacement !== "hidden";
  const isTablet = useIsTabletRange();
  const edgeBleed = isMobile ? -12 : -20;
  const accent = brand?.accent ?? ACCENT_DEFAULT;

  return (
    <div style={{ fontFamily: FONT_STACK, background: "#FFFFFF", color: INK, marginLeft: edgeBleed, marginRight: edgeBleed }}>
      <div
        style={{
          position: "sticky",
          top: "var(--sph-h, 88px)",
          zIndex: 50,
          background: "rgba(255,255,255,0.94)",
          borderBottom: `1px solid ${HAIRLINE}`,
          padding: isTablet ? "22px 16px" : isMobile ? "20px 16px" : "32px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
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
                      fontSize: isTablet ? 26 : isMobile ? 24 : 32,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      lineHeight: 1.15,
                      color: INK,
                      textDecoration: "none",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      fontFamily: FONT_STACK,
                    }}
                  >
                    {restaurantName}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: isTablet ? 26 : isMobile ? 24 : 32,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      lineHeight: 1.15,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      fontFamily: FONT_STACK,
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
                    marginTop: 7,
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
                <div style={{ fontSize: 14, color: SUBTLE, fontWeight: 400, marginTop: 7, display: "flex", alignItems: "flex-start", gap: 5 }}>
                  <MapPinIcon size={13} stroke={SUBTLE} />
                  <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
                </div>
              )
            ) : null}

            {showDistanceBelowAddress ? (
              <MenuRestaurantDistanceLine miles={distanceMiles} color={SUBTLE} />
            ) : null}

            {(scheduledActiveMenuLabel || menuTypeLabel) ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 400, color: SUBTLE }}>
                {scheduledActiveMenuLabel || menuTypeLabel}
              </div>
            ) : null}

            {franchiseSlot}

            {intakeBannerSlot ? (
              <div style={{ marginTop: 12, paddingTop: 4, borderTop: `1px solid ${HAIRLINE}` }}>
                {intakeBannerSlot}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ padding: isTablet ? "0 16px" : isMobile ? "0 16px" : "0 24px" }}>
        <main style={{ minWidth: 0, width: "100%" }}>
          {allergenBannerSlot}

          {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
            <>
              <ChipRail style={{ paddingTop: 16, paddingBottom: 12 }}>
                {menus.map((menu) => {
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
                        borderRadius: 0,
                        border: isSelected ? `1px solid ${INK}` : `1px solid ${HAIRLINE}`,
                        background: isSelected ? INK : "transparent",
                        color: isSelected ? "#FFFFFF" : SUBTLE,
                        fontWeight: 500,
                        fontSize: 14,
                        fontFamily: FONT_STACK,
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

              return (
                <div
                  key={`${title}-${sIdx}`}
                  style={{
                    marginTop: sIdx === 0 ? 28 : 48,
                    paddingTop: sIdx === 0 ? 0 : 24,
                    borderTop: sIdx === 0 ? "none" : `1px solid ${HAIRLINE}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? 18 : 22,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: INK,
                      marginBottom: 6,
                      fontFamily: FONT_STACK,
                    }}
                  >
                    {title}
                  </div>
                  {sec?.subtitle || sec?.description ? (
                    <div style={{ fontSize: 14, color: SUBTLE, marginBottom: 14, fontWeight: 500 }}>
                      {sec.subtitle || sec.description}
                    </div>
                  ) : (
                    <div style={{ marginBottom: 14 }} />
                  )}

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
                        showImage={false}
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
