import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";

function RestaurantLogoSlot({ logoUrl, restaurantName, size = 52 }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid rgba(31,41,55,0.9)",
        }}
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
        borderRadius: 14,
        flexShrink: 0,
        background: "#121A14",
        border: "1px solid #1F2937",
      }}
    />
  );
}

/**
 * V1 Classic — readable list, sticky header, logo slot (baseline).
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
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
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

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: "var(--sph-h, 88px)",
          zIndex: 50,
          background: "rgba(11, 15, 12, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #1F2937",
          marginBottom: isMobile ? 18 : 22,
          marginLeft: isMobile ? -12 : -20,
          marginRight: isMobile ? -12 : -20,
          padding: isMobile ? "10px 12px" : "12px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <RestaurantLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", marginBottom: addressLine ? 2 : 0 }}>
              <div style={{ minWidth: 0, flex: "0 1 auto", display: "flex", alignItems: "center", gap: 6 }}>
                {restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    title={`Open ${restaurantName} profile`}
                    style={{
                      fontSize: isMobile ? 18 : 22,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
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
                      fontSize: isMobile ? 18 : 22,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
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
                  border: "1px solid #1F2937",
                  borderRadius: 999,
                  background: "#1A2419",
                  color: "#9CA3AF",
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Filters
              </button>

              <div style={{ flex: 1 }} />
            </div>

            {addressLine ? (
              <div style={{ fontSize: 13, color: "#667085", fontWeight: 600 }}>
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${restaurantName}`}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "flex-start",
                      gap: 5,
                    }}
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

            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {scheduledActiveMenuLabel ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#1A2419",
                    border: "1px solid #1F2937",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9CA3AF",
                  }}
                >
                  <span aria-hidden="true" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                  {scheduledActiveMenuLabel}
                </div>
              ) : menuTypeLabel ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#1A2419",
                    border: "1px solid #1F2937",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9CA3AF",
                  }}
                >
                  {menuTypeLabel}
                </div>
              ) : null}
            </div>

            {franchiseSlot}
          </div>
        </div>
      </div>

      <div>
        <main style={{ minWidth: 0, width: "100%" }}>
          {intakeBannerSlot}

          {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
            <>
              <ChipRail style={{ paddingBottom: 12, marginBottom: 4 }}>
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
                        padding: "6px 16px",
                        borderRadius: 999,
                        border: isSelected ? "1.5px solid #22c55e" : "1px solid #374151",
                        background: isSelected ? "rgba(34,197,94,0.10)" : "#111827",
                        color: isSelected ? "#86efac" : "#9CA3AF",
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: 13,
                        cursor: tabLoading ? "wait" : "pointer",
                        opacity: tabLoading && !isSelected ? 0.5 : 1,
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
              </ChipRail>
              {tabError ? (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>
                  {tabError}
                </div>
              ) : null}
            </>
          )}

          {displayableItemCount === 0 ? (
            <div style={{ fontSize: 14, color: "var(--muted, #5b6675)", padding: "24px 0" }}>
              {filtersActive ? (
                <>
                  {t(
                    "publicMenu.noItemsAfterFilters",
                    "This restaurant has no displayable menu items after your active filters."
                  )}{" "}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: brand?.accent ?? "#22C55E",
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
                <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 16 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--gb-color-ink-muted)",
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    {title}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                </div>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}
