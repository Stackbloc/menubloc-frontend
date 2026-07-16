import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { shouldShowItemImages } from "./menuThemeSettings.js";
import { MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import MenuHeaderNameWithActions from "./MenuHeaderIconRail.jsx";

function DinerLogo({ logoUrl, restaurantName, accent }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" width={58} height={58} style={{ width: 58, height: 58, borderRadius: 12, objectFit: "cover" }} />;
  }
  return (
    <div
      aria-hidden="true"
      title={restaurantName}
      style={{ width: 58, height: 58, borderRadius: 12, background: accent, flexShrink: 0 }}
    />
  );
}

export default function FamilyDinerMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    menuTypeLabel,
    addressLine1,
    addressLine2,
    directionsHref,
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
    fontStack,
    menuThemeSettings = {},
    tone,
    claimStatus,
    subscriptionPlan,
    menuStatus,
    profileTier,
    listingStatus,
    planSlug,
    isPro,
    isPaidSubscriber,
    orderAcceptanceStatus,
  } = ctx;

  const accent = brand?.accent ?? "#2563eb";
  const soft = brand?.accentSoftBg ?? "rgba(37,99,235,0.12)";
  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showLogo = logoPlacement !== "hidden";

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        padding: isMobile ? "18px 14px 38px" : "26px 22px 52px",
        background: "#fffaf0",
        color: "#172033",
        fontFamily: fontStack,
      }}
    >
      <header
        style={{
          maxWidth: 940,
          margin: "0 auto 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: isMobile ? "16px" : "22px",
          borderRadius: 8,
          background: "#ffffff",
          border: "1px solid #eadfce",
          boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
          justifyContent: logoPlacement === "center" ? "center" : undefined,
          textAlign: logoPlacement === "center" ? "center" : undefined,
        }}
      >
        {showLogo && <DinerLogo logoUrl={logoUrl} restaurantName={restaurantName} accent={accent} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 850, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>
            {menuTypeLabel || "Sample menu design"}
          </div>
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
                <Link to={restaurantProfileHref} style={{ color: "#172033", textDecoration: "none", fontSize: isMobile ? 26 : 34, lineHeight: 1.05, fontWeight: 900 }}>
                  {restaurantName}
                </Link>
              ) : (
                <h1 style={{ margin: 0, color: "#172033", fontSize: isMobile ? 26 : 34, lineHeight: 1.05, fontWeight: 900 }}>
                  {restaurantName}
                </h1>
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
          {addressLine1 ? (
            <div style={{ marginTop: 7, color: "#667085", fontSize: 13, fontWeight: 650 }}>
              {directionsHref ? (
                <a href={directionsHref} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
                </a>
              ) : (
                <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <main style={{ maxWidth: 940, margin: "0 auto" }}>
        {franchiseSlot}
        {intakeBannerSlot}
        {allergenBannerSlot}

        {displayableItemCount === 0 ? (
          <div style={{ padding: 24, color: "#667085", fontSize: 16 }}>
            {filtersActive ? (
              <>
                This restaurant has no items that match your saved dietary preferences.{" "}
                <Link to="/account" style={{ color: accent, fontWeight: 850, fontSize: 16 }}>
                  Manage preferences
                </Link>
              </>
            ) : (
              t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
            )}
          </div>
        ) : (
          displaySections.map((section, sIdx) => {
            const title = String(getLocalizedField(section, "title", language) || section?.title || "Menu").trim();
            const items = Array.isArray(section?.items) ? section.items : [];
            return (
              <section key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                <h2
                  style={{
                    margin: "0 0 10px",
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: soft,
                    color: accent,
                    fontSize: 22,
                    lineHeight: 1.15,
                    fontWeight: 900,
                  }}
                >
                  {title}
                </h2>
                <div style={{ background: "#ffffff", border: "1px solid #eadfce", borderRadius: 8, padding: isMobile ? "2px 14px" : "4px 20px" }}>
                  {items.map((it, iIdx) => (
                    <PublicMenuItemCard
                      key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                      density="classic"
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
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
