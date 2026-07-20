import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getMenuSectionImageUrl } from "./menuImageUtils.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";
import { MENU_ROW_HEADER_ICON_GAP, MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import { MenuDesignHeroSlot, MenuDesignSectionSlot, sectionPhotoSlotKey } from "./MenuDesignPhotoEditOverlay.jsx";

export default function ModernAsianMenuTemplate(ctx) {
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

  const accent = brand?.accent ?? "#c9a35b";
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
        background: "#0f1317",
        color: "#fff",
        fontFamily: fontStack,
      }}
    >
      <header
        style={{
          maxWidth: 1120,
          margin: "0 auto 18px",
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 22px 56px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
          minHeight: isMobile ? 160 : 200,
          background: "linear-gradient(135deg, #0b0f14, #1d2530)",
        }}
      >
        <MenuDesignHeroSlot
          heroImageUrl={heroImage}
          isStock={Boolean(ctx?.designHeroIsStock)}
          style={{ position: "absolute", inset: 0 }}
          imgStyle={{ filter: "brightness(0.55)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,20,0.18), rgba(11,15,20,0.9))", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, padding: isMobile ? "18px 18px 20px" : "26px 28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
              {showLogo && (logoUrl ? (
                <img src={logoUrl} alt="" width={56} height={56} style={{ width: 56, height: 56, borderRadius: 18, objectFit: "cover", border: "2px solid rgba(255,255,255,0.45)" }} />
              ) : (
                <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 18, background: accent }} />
              ))}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "rgba(255,248,238,0.8)", fontSize: 11, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 4 }}>
                  {menuTypeLabel || "Sample menu design"}
                </div>
                {restaurantProfileHref ? (
                  <Link to={restaurantProfileHref} style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? 30 : 44, fontWeight: 900, lineHeight: 1 }}>
                    {restaurantName}
                  </Link>
                ) : (
                  <h1 style={{ margin: 0, color: "#fff", fontSize: isMobile ? 30 : 44, fontWeight: 900, lineHeight: 1 }}>
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

      <main style={{ maxWidth: 1120, margin: "0 auto" }}>
        {displayableItemCount === 0 ? (
          <div style={{ padding: 24, color: "rgba(255,255,255,0.62)", fontSize: 16 }}>
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
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 22,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "18px 18px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{ height: 1, flex: 1, background: "rgba(201,163,91,0.34)" }} />
                      <h2 style={{ margin: 0, color: accent, fontFamily: "Georgia, serif", fontSize: isMobile ? 24 : 34, fontWeight: 800 }}>
                        {title}
                      </h2>
                      <div style={{ height: 1, flex: 1, background: "rgba(201,163,91,0.34)" }} />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      {items.map((it, iIdx) => (
                        <PublicMenuItemCard
                          key={String(it?.menu_item_id ?? it?.id ?? `${index}-${iIdx}`)}
                          density="classic"
                          editorialRefresh={true}
                          editorialColorScheme="dark"
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
                    <MenuDesignSectionSlot
                      slotKey={sectionPhotoSlotKey(section, index)}
                      imageUrl={sectionImage}
                      isStock={Boolean(ctx?.designSectionIsStock?.[sectionPhotoSlotKey(section, index)])}
                      height={isMobile ? 180 : 240}
                    />
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
