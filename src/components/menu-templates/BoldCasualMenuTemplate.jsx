import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import MenuplyAttribution from "./MenuplyAttribution.jsx";

function BoldLogoSlot({ logoUrl, restaurantName, accent }) {
  const style = {
    width: 60,
    height: 60,
    borderRadius: 14,
    objectFit: "cover",
    flexShrink: 0,
    border: `3px solid ${accent}`,
  };
  if (logoUrl) {
    return <img src={logoUrl} alt="" width={60} height={60} style={style} />;
  }
  return (
    <div
      title={restaurantName}
      aria-hidden
      style={{ ...style, background: "#121A14" }}
    />
  );
}

/**
 * V4 Bold Casual — sports bars, burgers, BBQ, wings, casual American.
 * Strong typography, deal banner, color-blocked section headers.
 */
export default function BoldCasualMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    menuTypeLabel,
    addressLine1,
    addressLine2,
    addressLine,
    directionsHref,
    logoUrl,
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    filterChipsSlot,
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
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    menuPresentation = {},
  } = ctx;

  const accent = brand?.accent ?? "#22C55E";
  const accentBold = brand?.accentBold ?? "rgba(34,197,94,0.22)";
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  const dealItems = Array.isArray(data?.deal_items) ? data.deal_items : [];
  const hasDealBanner = dealItems.length > 0;

  return (
    <>
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: "var(--sph-h, 88px)",
          zIndex: 50,
          background: "rgba(9, 11, 9, 0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `2px solid ${accent}`,
          marginBottom: isMobile ? 16 : 20,
          marginLeft: isMobile ? -12 : -20,
          marginRight: isMobile ? -12 : -20,
          padding: isMobile ? "10px 12px" : "12px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <BoldLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} accent={accent} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", marginBottom: addressLine ? 2 : 0 }}>
              <div style={{ minWidth: 0, flex: "0 1 auto", display: "flex", alignItems: "center", gap: 6 }}>
                {restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    title={`Open ${restaurantName} profile`}
                    style={{
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.05,
                      color: "#FFFFFF",
                      textDecoration: "none",
                      minWidth: 0,
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
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.05,
                      color: "#FFFFFF",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {restaurantName}
                  </div>
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                <ShareButton
                  variant="menu"
                  label="Share Menu"
                  shareData={shareData}
                  analyticsContext={shareAnalyticsContext}
                  size="compact"
                  tone="subtle"
                />
              </div>

              <button
                type="button"
                onClick={onOpenFilters}
                style={{
                  flexShrink: 0,
                  border: `1px solid ${accent}`,
                  borderRadius: 999,
                  background: accentBold,
                  color: accent,
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "6px 12px",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                }}
              >
                Filters
              </button>

              <div style={{ flex: 1 }} />
            </div>

            {addressLine ? (
              <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${restaurantName}`}
                    style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "flex-start", gap: 5 }}
                  >
                    <span style={{ flexShrink: 0, fontSize: 13 }}>📍</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {addressLine1 ? <span>{addressLine1}</span> : null}
                      {addressLine2 ? <span>{addressLine2}</span> : null}
                    </span>
                  </a>
                ) : (
                  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                    {addressLine1 ? <span>{addressLine1}</span> : null}
                    {addressLine2 ? <span>{addressLine2}</span> : null}
                  </span>
                )}
              </div>
            ) : null}

            {menuTypeLabel ? (
              <div style={{ marginTop: 6 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: accentBold,
                  border: `1px solid ${accent}`,
                  fontSize: 11,
                  fontWeight: 800,
                  color: accent,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {menuTypeLabel}
                </span>
              </div>
            ) : null}

            {franchiseSlot}
          </div>
        </div>
      </div>

      <div>
        <main style={{ minWidth: 0, width: "100%" }}>
          {intakeBannerSlot}

          {/* Deal banner strip */}
          {hasDealBanner && (
            <div style={{
              background: accent,
              color: onAccent,
              borderRadius: 14,
              padding: isMobile ? "12px 14px" : "14px 18px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔥</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: "-0.01em", marginBottom: 2 }}>
                  {dealItems.length === 1 ? dealItems[0].title : `${dealItems.length} deals available`}
                </div>
                {dealItems.length === 1 && dealItems[0].headline ? (
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{dealItems[0].headline}</div>
                ) : null}
              </div>
            </div>
          )}

          {filterChipsSlot}

          {/* Multi-menu tabs */}
          {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
            <>
              <div style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 12,
                marginBottom: 4,
                scrollbarWidth: "none",
              }}>
                {menus.map(menu => {
                  const isSelected = menu.id === selectedMenuId;
                  const hasSchedule = !!(menu.start_time || menu.end_time || menu.schedule_days);
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
                        border: isSelected ? `2px solid ${accent}` : "1px solid #374151",
                        background: isSelected ? accentBold : "#111827",
                        color: isSelected ? accent : "#9CA3AF",
                        fontWeight: isSelected ? 900 : 600,
                        fontSize: 13,
                        cursor: tabLoading ? "wait" : "pointer",
                        opacity: tabLoading && !isSelected ? 0.5 : 1,
                        letterSpacing: isSelected ? "0.02em" : 0,
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
              </div>
              {tabError ? (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>{tabError}</div>
              ) : null}
            </>
          )}

          {/* Items */}
          {displayableItemCount === 0 ? (
            <div style={{ fontSize: 14, color: "var(--muted, #5b6675)", padding: "24px 0" }}>
              {filtersActive ? (
                <>
                  {t("publicMenu.noItemsAfterFilters", "This restaurant has no displayable menu items after your active filters.")}{" "}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: accent,
                      fontWeight: 700,
                      fontSize: 14,
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    {t("common.clearFilters", "Clear filters")}
                  </button>
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
                <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 24 }}>
                  {/* Color-blocked section header */}
                  <div style={{
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: onAccent,
                    background: accent,
                    padding: "7px 14px",
                    borderRadius: 10,
                    marginBottom: 10,
                    display: "inline-block",
                  }}>
                    {title}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((it, iIdx) => (
                      <PublicMenuItemCard
                        key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                        density="bold-casual"
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
            })
          )}

          <MenuplyAttribution />
        </main>
      </div>
    </>
  );
}
