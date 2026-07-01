import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { shouldShowItemImages } from "./menuThemeSettings.js";

export default function ModernFastCasualMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    menuTypeLabel,
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
  } = ctx;

  const accent = brand?.accent ?? "#2f7d5b";
  const soft = brand?.accentSoftBg ?? "rgba(47,125,91,0.12)";
  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showLogo = logoPlacement !== "hidden";

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        padding: isMobile ? "18px 14px 40px" : "28px 24px 54px",
        background: "#f8faf7",
        color: "#111827",
        fontFamily: fontStack,
      }}
    >
      <header style={{ maxWidth: 980, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
          {showLogo && (logoUrl ? (
            <img src={logoUrl} alt="" width={54} height={54} style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover" }} />
          ) : (
            <div aria-hidden="true" style={{ width: 54, height: 54, borderRadius: 14, background: accent }} />
          ))}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              {menuTypeLabel || "Sample menu design"}
            </div>
            {restaurantProfileHref ? (
              <Link to={restaurantProfileHref} style={{ color: "#111827", textDecoration: "none", fontSize: isMobile ? 27 : 36, lineHeight: 1.02, fontWeight: 950 }}>
                {restaurantName}
              </Link>
            ) : (
              <h1 style={{ margin: 0, color: "#111827", fontSize: isMobile ? 27 : 36, lineHeight: 1.02, fontWeight: 950 }}>
                {restaurantName}
              </h1>
            )}
          </div>
          <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {displaySections.slice(0, 8).map((section, idx) => (
            <button
              key={String(section?.id ?? idx)}
              type="button"
              onClick={() => document.getElementById(`modern-fast-section-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: idx === 0 ? `2px solid ${accent}` : "1px solid #d6ded6",
                background: idx === 0 ? soft : "#ffffff",
                color: idx === 0 ? accent : "#334155",
                fontSize: 14,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {section?.title || "Menu"}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto" }}>
        {franchiseSlot}
        {intakeBannerSlot}
        {allergenBannerSlot}

        {displayableItemCount === 0 ? (
          <div style={{ color: "#667085", padding: 24 }}>
            {filtersActive ? (
              <>
                This restaurant has no items that match your saved dietary preferences.{" "}
                <Link to="/account" style={{ color: accent, fontWeight: 850, fontSize: 15 }}>
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
              <section key={`${title}-${sIdx}`} id={`modern-fast-section-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                <h2 style={{ margin: "0 0 10px", color: "#111827", fontSize: 24, lineHeight: 1.15, fontWeight: 950 }}>
                  {title}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12 }}>
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
