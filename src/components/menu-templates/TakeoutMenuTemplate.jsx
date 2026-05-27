import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import ChipRail from "../chips/ChipRail.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";

function RestaurantLogoSlot({ logoUrl, restaurantName, size = 44 }) {
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
          borderRadius: 12,
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid #1f2937",
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
        borderRadius: 12,
        flexShrink: 0,
        background: "#121A14",
        border: "1px solid #1F2937",
      }}
    />
  );
}

/**
 * V3 Takeout / conversion — deals strip, dense rows, order-focused.
 */
export default function TakeoutMenuTemplate(ctx) {
  const {
    isMobile,
    language,
    t,
    restaurantName,
    restaurantProfileHref,
    logoUrl,
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    allergenBannerSlot,
    onOpenFilters,
    displaySections,
    displayableItemCount,
    dealItems,
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
    cartLineCount,
    onGoCheckout,
    brand,
    scheduledActiveMenuLabel,
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    menuPresentation = {},
  } = ctx;

  const deals = Array.isArray(dealItems) ? dealItems : [];
  const accent = brand?.accent ?? "#22C55E";
  const accentStrong = brand?.accentStrong ?? "#16A34A";
  const onAccent = brand?.onAccent ?? "#0B0F0C";
  const softBg = brand?.accentSoftBg ?? "rgba(34,197,94,0.12)";
  const dealPillBorder = `1px solid ${brand?.accentBorder ?? "rgba(34,197,94,0.35)"}`;
  const ctaGradient = `linear-gradient(180deg, ${accent} 0%, ${accentStrong} 100%)`;

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: "var(--sph-h, 88px)",
          zIndex: 50,
          background: "rgba(11, 15, 12, 0.97)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #1F2937",
          marginBottom: 12,
          marginLeft: isMobile ? -12 : -20,
          marginRight: isMobile ? -12 : -20,
          padding: isMobile ? "8px 12px" : "10px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RestaurantLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {restaurantProfileHref ? (
              <Link
                to={restaurantProfileHref}
                style={{
                  fontSize: isMobile ? 17 : 19,
                  fontWeight: 900,
                  color: "#fff",
                  textDecoration: "none",
                  display: "block",
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
                  fontSize: isMobile ? 17 : 19,
                  fontWeight: 900,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {restaurantName}
              </div>
            )}
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {scheduledActiveMenuLabel ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                  {scheduledActiveMenuLabel}
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
                  {t("menuTemplates.v3.subtitle", "Order ahead — tap items to add")}
                </span>
              )}
            </div>
          </div>
          <ShareButton
            variant="menu"
            label="Share"
            shareData={shareData}
            analyticsContext={shareAnalyticsContext}
            size="compact"
            tone="subtle"
          />
          <button
            type="button"
            onClick={onOpenFilters}
            style={{
              border: "1px solid #1F2937",
              borderRadius: 999,
              background: "#1A2419",
              color: "#9CA3AF",
              fontSize: 11,
              fontWeight: 800,
              padding: "6px 10px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Filter
          </button>
        </div>
        {franchiseSlot ? <div style={{ marginTop: 10 }}>{franchiseSlot}</div> : null}
      </div>

      {deals.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 8 }}>
            {t("common.deals", "Deals")}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {deals.slice(0, 8).map((d, i) => (
              <span
                key={String(d?.id ?? i)}
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: softBg,
                  border: dealPillBorder,
                  color: accent,
                }}
              >
                {d?.headline || d?.title || t("common.deals", "Deal")}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {intakeBannerSlot}
      {allergenBannerSlot}

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

      {typeof cartLineCount === "number" && cartLineCount > 0 ? (
        <button
          type="button"
          onClick={onGoCheckout}
          style={{
            width: "100%",
            marginBottom: 14,
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: 14,
            background: ctaGradient,
            color: onAccent,
          }}
        >
          {t("menuTemplates.v3.reviewOrder", "Review order")}
        </button>
      ) : null}

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
            <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6b7280",
                  marginBottom: 6,
                }}
              >
                {title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((it, iIdx) => (
                  <PublicMenuItemCard
                    key={String(it?.id ?? `${sIdx}-${iIdx}`)}
                    density="takeout"
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

    </>
  );
}
