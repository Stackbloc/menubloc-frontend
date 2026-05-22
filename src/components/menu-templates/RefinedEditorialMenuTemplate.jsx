import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import MenuplyAttribution from "./MenuplyAttribution.jsx";
import { pickFeaturedMenuItems } from "./menuTemplateFeatured.js";

function EditorialLogoSlot({ logoUrl, restaurantName }) {
  const style = {
    width: 64,
    height: 64,
    borderRadius: 9999,
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.2)",
  };
  if (logoUrl) {
    return <img src={logoUrl} alt="" width={64} height={64} style={style} />;
  }
  return (
    <div
      title={restaurantName}
      aria-hidden
      style={{ ...style, background: "#1A1F1B" }}
    />
  );
}

/**
 * V5 Refined Editorial — steakhouse, upscale casual, seafood, Italian, chef-driven.
 * Clean spacing, editorial typography, restrained tone, elegant separators.
 */
export default function RefinedEditorialMenuTemplate(ctx) {
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
    fontStack,
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    menuPresentation = {},
  } = ctx;

  const accent = brand?.accent ?? "#22C55E";
  const tagline = brand?.tagline || null;
  const dealItems = Array.isArray(data?.deal_items) ? data.deal_items : [];
  const chefsPickItems = pickFeaturedMenuItems(displaySections, dealItems, 4);

  return (
    <>
      {/* Non-sticky editorial header */}
      <div style={{
        marginBottom: isMobile ? 28 : 36,
        marginLeft: isMobile ? -12 : -20,
        marginRight: isMobile ? -12 : -20,
        padding: isMobile ? "28px 20px 20px" : "36px 32px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(14,18,15,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <EditorialLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "nowrap" }}>
              <div style={{ minWidth: 0, flex: "0 1 auto" }}>
                {restaurantProfileHref ? (
                  <Link
                    to={restaurantProfileHref}
                    title={`Open ${restaurantName} profile`}
                    style={{
                      fontSize: isMobile ? 24 : 32,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.1,
                      color: "#FFFFFF",
                      textDecoration: "none",
                      display: "block",
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
                      fontSize: isMobile ? 24 : 32,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
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
                {tagline ? (
                  <div style={{
                    fontSize: 14,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 4,
                    letterSpacing: "0.01em",
                  }}>
                    {tagline}
                  </div>
                ) : null}
              </div>
              <div style={{ flexShrink: 0, marginLeft: "auto" }} onClick={(e) => e.stopPropagation()}>
                <ShareButton
                  variant="menu"
                  label="Share"
                  shareData={shareData}
                  analyticsContext={shareAnalyticsContext}
                  size="compact"
                  tone="subtle"
                />
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {addressLine ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500, letterSpacing: "0.01em" }}>
                  {directionsHref ? (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Get directions to ${restaurantName}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
                    </a>
                  ) : (
                    <span>{addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}</span>
                  )}
                </div>
              ) : null}

              {scheduledActiveMenuLabel ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  <span aria-hidden="true" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                  {scheduledActiveMenuLabel}
                </span>
              ) : menuTypeLabel ? (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {menuTypeLabel}
                </span>
              ) : null}

              <button
                type="button"
                onClick={onOpenFilters}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 12px",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                Filters
              </button>
            </div>

            {franchiseSlot}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: fontStack }}>
        <main style={{ minWidth: 0, width: "100%" }}>
          {intakeBannerSlot}

          {/* Chef's Picks — editorial 2-column grid, max 4 items */}
          {chefsPickItems.length > 0 && !filtersActive && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
                Chef&rsquo;s Picks
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: 10,
              }}>
                {chefsPickItems.map((it, iIdx) => {
                  const name = String(it?.name || it?.menu_item_name || "Item").trim();
                  const price = fmtMoney(it);
                  return (
                    <div
                      key={String(it?.id ?? `pick-${iIdx}`)}
                      onClick={() => {
                        if (it?.id != null) setItemSheet({ item: it, name, desc: it?.description || "", price, hasDeal: false, dishShareData: null, canNavigate: true, indulgencePresentation: null });
                      }}
                      style={{
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3, marginBottom: 4 }}>{name}</div>
                      {price ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>{price}</div> : null}
                    </div>
                  );
                })}
              </div>
              {/* Elegant separator */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "24px 0 0" }} />
            </div>
          )}

          {/* Multi-menu tabs */}
          {menuPresentation?.tabs_allowed_for_public_view && menus.length > 1 && (
            <>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12, marginBottom: 4, scrollbarWidth: "none" }}>
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
                        padding: "5px 16px",
                        borderRadius: 999,
                        border: isSelected ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.12)",
                        background: "transparent",
                        color: isSelected ? accent : "rgba(255,255,255,0.45)",
                        fontWeight: isSelected ? 700 : 400,
                        fontSize: 12,
                        cursor: tabLoading ? "wait" : "pointer",
                        opacity: tabLoading && !isSelected ? 0.5 : 1,
                        letterSpacing: "0.04em",
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
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", padding: "24px 0" }}>
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
                      fontWeight: 600,
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
                <div key={`${title}-${sIdx}`} style={{ marginTop: sIdx === 0 ? 0 : 32 }}>
                  {/* Editorial section header */}
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontStyle: "italic",
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                    {title}
                  </div>
                  {/* Elegant rule under section header */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 14 }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {items.map((it, iIdx) => (
                      <div key={String(it?.id ?? `${sIdx}-${iIdx}`)}>
                        <PublicMenuItemCard
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
                        />
                        {/* Subtle inter-item separator */}
                        {iIdx < items.length - 1 ? (
                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0" }} />
                        ) : null}
                      </div>
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
