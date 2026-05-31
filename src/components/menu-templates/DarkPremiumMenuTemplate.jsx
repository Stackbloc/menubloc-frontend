import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";

function LogoMark({ logoUrl, restaurantName, accent }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={78}
        height={78}
        style={{ width: 78, height: 78, borderRadius: 999, objectFit: "cover", border: `2px solid ${accent}` }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      title={restaurantName}
      style={{
        width: 78,
        height: 78,
        borderRadius: 999,
        border: `2px solid ${accent}`,
        background: "rgba(255,255,255,0.06)",
      }}
    />
  );
}

export default function DarkPremiumMenuTemplate(ctx) {
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
    heroImageUrl,
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    allergenBannerSlot,
    onOpenFilters,
    displaySections,
    displayableItemCount,
    filtersActive,
    handleClearFilters,
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

  const accent = brand?.accent ?? "#b68b45";
  const muted = "rgba(255,255,255,0.62)";
  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);

  return (
    <div style={{ fontFamily: fontStack, color: "#f8f4ea" }}>
      <header
        style={{
          margin: isMobile ? "-16px -12px 28px" : "-28px -20px 38px",
          padding: isMobile ? "58px 22px 44px" : "86px 48px 68px",
          background: "radial-gradient(circle at 50% 0%, rgba(182,139,69,0.22), transparent 36%), linear-gradient(145deg, #050505, #191512 58%, #070707)",
          borderBottom: `1px solid ${accent}`,
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <LogoMark logoUrl={logoUrl} restaurantName={restaurantName} accent={accent} />
        </div>
        <div style={{ color: accent, fontSize: 12, fontWeight: 850, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          {menuTypeLabel || "Sample menu design"}
        </div>
        {restaurantProfileHref ? (
          <Link to={restaurantProfileHref} style={{ color: "#fff", textDecoration: "none", fontFamily: "Georgia, serif", fontSize: isMobile ? 42 : 66, fontWeight: 800, lineHeight: 1 }}>
            {restaurantName}
          </Link>
        ) : (
          <h1 style={{ margin: 0, color: "#fff", fontFamily: "Georgia, serif", fontSize: isMobile ? 42 : 66, fontWeight: 800, lineHeight: 1 }}>
            {restaurantName}
          </h1>
        )}
        {addressLine1 ? (
          <div style={{ marginTop: 18, color: muted, fontSize: 13, fontWeight: 650 }}>
            {directionsHref ? (
              <a href={directionsHref} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
              </a>
            ) : (
              <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
            )}
          </div>
        ) : null}
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
          <button type="button" onClick={onOpenFilters} style={{ border: `1px solid ${accent}`, borderRadius: 999, background: "transparent", color: accent, minHeight: 36, padding: "0 16px", fontSize: 12, fontWeight: 850, cursor: "pointer" }}>
            Filters
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 42 }}>
        {franchiseSlot}
        {intakeBannerSlot}
        {allergenBannerSlot}

        {heroImageUrl ? (
          <div
            aria-hidden="true"
            style={{
              marginBottom: 28,
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid rgba(182,139,69,0.32)`,
              boxShadow: "0 18px 42px rgba(0,0,0,0.34)",
            }}
          >
            <img
              src={heroImageUrl}
              alt=""
              loading="lazy"
              style={{ width: "100%", height: isMobile ? 180 : 280, objectFit: "cover", display: "block" }}
            />
          </div>
        ) : null}

        {displayableItemCount === 0 ? (
          <div style={{ color: muted, padding: "28px 0" }}>
            {filtersActive ? (
              <button type="button" onClick={handleClearFilters} style={{ color: accent, background: "transparent", border: "none", fontWeight: 850, cursor: "pointer" }}>
                Clear filters
              </button>
            ) : (
              t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
            )}
          </div>
        ) : (
          displaySections.map((section, sIdx) => {
            const title = String(getLocalizedField(section, "title", language) || section?.title || "Menu").trim();
            const items = Array.isArray(section?.items) ? section.items : [];
            const sectionImage = section?.image_url || null;
            return (
              <section key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 42 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                  <div style={{ height: 1, flex: 1, background: "rgba(182,139,69,0.35)" }} />
                  <h2 style={{ margin: 0, color: accent, fontFamily: "Georgia, serif", fontSize: isMobile ? 28 : 36, fontWeight: 800 }}>
                    {title}
                  </h2>
                  <div style={{ height: 1, flex: 1, background: "rgba(182,139,69,0.35)" }} />
                </div>
                {showSectionImages && sectionImage ? (
                  <div
                    aria-hidden="true"
                    style={{
                      marginBottom: 16,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(182,139,69,0.24)",
                      boxShadow: "0 14px 34px rgba(0,0,0,0.24)",
                    }}
                  >
                    <img
                      src={sectionImage}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: isMobile ? 128 : 176, objectFit: "cover", display: "block" }}
                    />
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 0 }}>
                  {items.map((it, iIdx) => (
                    <PublicMenuItemCard
                      key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                      density="refined-editorial"
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
