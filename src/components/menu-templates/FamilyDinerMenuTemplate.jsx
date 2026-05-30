import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";

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
  } = ctx;

  const accent = brand?.accent ?? "#2563eb";
  const soft = brand?.accentSoftBg ?? "rgba(37,99,235,0.12)";

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
        }}
      >
        <DinerLogo logoUrl={logoUrl} restaurantName={restaurantName} accent={accent} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 850, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>
            {menuTypeLabel || "Sample menu design"}
          </div>
          {restaurantProfileHref ? (
            <Link to={restaurantProfileHref} style={{ color: "#172033", textDecoration: "none", fontSize: isMobile ? 26 : 34, lineHeight: 1.05, fontWeight: 900 }}>
              {restaurantName}
            </Link>
          ) : (
            <h1 style={{ margin: 0, color: "#172033", fontSize: isMobile ? 26 : 34, lineHeight: 1.05, fontWeight: 900 }}>
              {restaurantName}
            </h1>
          )}
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
          <button type="button" onClick={onOpenFilters} style={{ minHeight: 38, border: `1px solid ${accent}`, borderRadius: 8, background: soft, color: accent, padding: "0 12px", fontSize: 12, fontWeight: 850, cursor: "pointer" }}>
            Filters
          </button>
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
                No sample items match these filters.{" "}
                <button type="button" onClick={handleClearFilters} style={{ border: "none", background: "transparent", color: accent, fontWeight: 850, cursor: "pointer" }}>
                  Clear filters
                </button>
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
