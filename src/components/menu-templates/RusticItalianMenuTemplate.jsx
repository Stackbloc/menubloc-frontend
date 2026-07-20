import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getMenuSectionImageUrl } from "./menuImageUtils.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";
import { MENU_ROW_HEADER_ICON_GAP, MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import { MenuDesignHeroSlot, MenuDesignSectionSlot, sectionPhotoSlotKey } from "./MenuDesignPhotoEditOverlay.jsx";

export default function RusticItalianMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantProfileHref,
    menuTypeLabel,
    logoUrl,
    logoPlacement = "top-left",
    shareData,
    shareAnalyticsContext,
    displaySections,
    displayableItemCount,
    filtersActive,
    data,
    dealMap,
    brand,
    fontStack,
    menuThemeSettings = {},
    currentRestaurantId,
    restaurantName: ctxRestaurantName,
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
  } = ctx;

  const accent = brand?.accent ?? "#b63c2f";
  const restaurantName = ctxRestaurantName || data?.restaurant_name || data?.name || "";
  const heroImage = data?.hero_image_url || data?.cover_image_url || null;
  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  const showLogo = logoPlacement !== "hidden";

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        padding: isMobile ? "18px 14px 48px" : "28px 24px 60px",
        background: "#f7efe3",
        color: "#241f1b",
        fontFamily: fontStack,
      }}
    >
      <header
        style={{
          maxWidth: 1080,
          margin: "0 auto 20px",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 44px rgba(15,23,42,0.08)",
          background: "#efe4d1",
          border: "1px solid rgba(0,0,0,0.08)",
          position: "relative",
          minHeight: isMobile ? 140 : 180,
        }}
      >
        <MenuDesignHeroSlot
          heroImageUrl={heroImage}
          isStock={Boolean(ctx?.designHeroIsStock)}
          style={{ position: "absolute", inset: 0 }}
          imgStyle={{ filter: "brightness(0.7)" }}
        />
        <div style={{ position: "relative", padding: isMobile ? "18px 18px 20px" : "30px 32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
              {showLogo && (logoUrl ? (
                <img src={logoUrl} alt="" width={54} height={54} style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }} />
              ) : (
                <div aria-hidden="true" style={{ width: 54, height: 54, borderRadius: 14, background: accent }} />
              ))}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#f3d6b8", fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
                  {menuTypeLabel || "Sample menu design"}
                </div>
                {restaurantProfileHref ? (
                  <Link to={restaurantProfileHref} style={{ color: "#fffaf0", textDecoration: "none", fontSize: isMobile ? 30 : 44, lineHeight: 1, fontWeight: 900 }}>
                    {restaurantName}
                  </Link>
                ) : (
                  <h1 style={{ margin: 0, color: "#fffaf0", fontSize: isMobile ? 30 : 44, lineHeight: 1, fontWeight: 900 }}>
                    {restaurantName}
                  </h1>
                )}
              </div>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", gap: MENU_ROW_HEADER_ICON_GAP, flexWrap: "wrap", alignItems: "center" }}
            >
              <FollowRestaurantButton restaurantId={currentRestaurantId} restaurantName={restaurantName} size={MENU_ROW_ICON_SIZE} />
              <ShareButton
                variant="menu"
                iconOnly={true}
                tone="ghost"
                shareData={shareData}
                analyticsContext={shareAnalyticsContext}
              />
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto" }}>
        {displayableItemCount === 0 ? (
          <div style={{ padding: 24, color: "#6b6259", fontSize: 16 }}>
            {filtersActive ? (
              <>
                This restaurant has no items that match your saved dietary preferences.{" "}
                <Link to="/account" style={{ color: accent, fontWeight: 850, fontSize: 16 }}>
                  Manage preferences
                </Link>
              </>
            ) : (
              "This restaurant does not currently have any displayable menu items."
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {displaySections.map((section, index) => {
              const title = String(getLocalizedField(section, "title", language) || section?.title || "Menu").trim();
              const sectionImage = getMenuSectionImageUrl(section);
              const items = Array.isArray(section?.items) ? section.items : [];
              return (
                <section
                  key={`${title}-${index}`}
                  style={{
                    background: "#fffaf3",
                    border: "1px solid rgba(36,31,27,0.08)",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ padding: "18px 20px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{ height: 1, flex: 1, background: "rgba(182,60,47,0.25)" }} />
                      <h2 style={{ margin: 0, color: accent, fontFamily: "Georgia, serif", fontSize: isMobile ? 24 : 34, fontWeight: 800 }}>
                        {title}
                      </h2>
                      <div style={{ height: 1, flex: 1, background: "rgba(182,60,47,0.25)" }} />
                    </div>
                    <div style={{ display: "grid", gap: 0 }}>
                      {items.map((it, iIdx) => (
                        <PublicMenuItemCard
                          key={String(it?.menu_item_id ?? it?.id ?? `${index}-${iIdx}`)}
                          density="classic"
                          editorialRefresh={true}
                          editorialColorScheme="light"
                          it={it}
                          sIdx={index}
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
                  {showSectionImages && sectionImage ? (
                    <div style={{ borderTop: "1px solid rgba(36,31,27,0.08)" }}>
                      <MenuDesignSectionSlot
                        slotKey={sectionPhotoSlotKey(section, index)}
                        imageUrl={sectionImage}
                        isStock={Boolean(ctx?.designSectionIsStock?.[sectionPhotoSlotKey(section, index)])}
                        height={isMobile ? 170 : 240}
                      />
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
