import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { resolveIndulgencePresentation } from "../../lib/indulgencePresentation.js";
import { itemHasInsightsData } from "../basket/ItemInsightsSheet.jsx";
import { itemHasRequiredModifiers } from "../basket/modifierModel.js";
import { buildDishShareData } from "../share/shareUtils.js";
import { shouldShowSectionImages } from "./menuThemeSettings.js";

function text(value) {
  return String(value || "").trim();
}

function getItemImageUrl(item) {
  return (
    text(item?.image_url) ||
    text(item?.photo_url) ||
    text(item?.image) ||
    text(item?.menu_item_image_url) ||
    ""
  );
}

function getSectionImageUrl(section) {
  const explicit =
    text(section?.image_url) ||
    text(section?.photo_url) ||
    text(section?.hero_image_url) ||
    text(section?.cover_image_url);
  if (explicit) return explicit;
  const items = Array.isArray(section?.items) ? section.items : [];
  return items.map(getItemImageUrl).find(Boolean) || "";
}

function isItemOrderable(item, getConsumerDisplayPrice) {
  return (getConsumerDisplayPrice(item) ?? 0) > 0;
}

function PremiumLogoSlot({ logoUrl, restaurantName, accent }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={88}
        height={88}
        style={{
          width: 88,
          height: 88,
          borderRadius: 999,
          objectFit: "cover",
          border: "2px solid rgba(255,255,255,0.72)",
          boxShadow: "0 16px 44px rgba(0,0,0,0.34)",
        }}
      />
    );
  }
  const initials = text(restaurantName)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 88,
        height: 88,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        color: "#f8f4ea",
        border: "2px solid rgba(255,255,255,0.72)",
        background: `linear-gradient(135deg, rgba(255,255,255,0.08), ${accent})`,
        boxShadow: "0 16px 44px rgba(0,0,0,0.34)",
        fontSize: 26,
        fontWeight: 800,
        fontFamily: "Georgia, serif",
      }}
    >
      {initials || "M"}
    </div>
  );
}

function SectionHeading({ title, accent, isMobile }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(24px, 1fr) auto minmax(24px, 1fr)",
        alignItems: "center",
        gap: isMobile ? 12 : 18,
        margin: isMobile ? "34px 0 22px" : "48px 0 28px",
      }}
    >
      <div style={{ height: 1, background: "rgba(87,75,67,0.34)" }} />
      <h2
        style={{
          margin: 0,
          color: accent,
          fontFamily: "Georgia, Palatino, serif",
          fontSize: isMobile ? 32 : 42,
          fontWeight: 800,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {title}
      </h2>
      <div style={{ height: 1, background: "rgba(87,75,67,0.34)" }} />
    </div>
  );
}

function PremiumMenuItem({
  item,
  ctx,
  accent,
  muted,
}) {
  const {
    language,
    restaurantName,
    data,
    currentRestaurantId,
    dealMap,
    activeCartItems,
    setItemSheet,
    setAddedConfirmation,
    commitMenuItemToBasket,
    fmtMoney,
    getConsumerDisplayPrice,
    menuThemeSettings = {},
  } = ctx;

  const name = getDisplayMenuItemName(item, language, "Item");
  const desc = text(
    getLocalizedField(item, "description", language) ||
      getLocalizedField(item, "notes", language) ||
      item?.description ||
      item?.notes
  );
  const price = fmtMoney(item);
  const canNavigate = item?.id != null;
  const hasDeal = canNavigate ? !!dealMap.get(item.id) : false;
  const orderable = isItemOrderable(item, getConsumerDisplayPrice);
  const matchingCartLines = (Array.isArray(activeCartItems) ? activeCartItems : []).filter(
    (line) => Number(line?.menuItemId) === Number(item?.id)
  );
  const inCartCount = matchingCartLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0);
  const indulgencePresentation = resolveIndulgencePresentation({ chips: item?.chips });
  const nutritionChip = item?.chips?.nutrition_chip || null;
  const hasAllergenData = !!(
    nutritionChip &&
    (
      (Array.isArray(nutritionChip.allergens) && nutritionChip.allergens.length > 0) ||
      String(nutritionChip.allergen_alert || "").trim()
    )
  );
  const showInsightsInline = menuThemeSettings?.intelligence_density !== "none" && itemHasInsightsData(item);
  const showAllergenInline = menuThemeSettings?.allergen_display !== "hidden" && hasAllergenData;
  const dishShareData = canNavigate
    ? buildDishShareData({
        restaurant: {
          id: currentRestaurantId,
          slug: data?.slug || null,
          name: restaurantName,
          logoUrl: data?.logo_url || null,
        },
        menuItem: { ...item, id: item.id, name },
      })
    : null;

  function openItem() {
    if (!canNavigate) return;
    setItemSheet({
      item,
      name,
      desc,
      price,
      hasDeal,
      dishShareData,
      canNavigate: true,
      indulgencePresentation,
    });
  }

  function quickAdd(e) {
    e.stopPropagation();
    if (!orderable) return;
    if (itemHasRequiredModifiers(item)) {
      openItem();
      return;
    }
    commitMenuItemToBasket(item, name, desc);
    setAddedConfirmation({ itemId: item.id, name });
  }

  return (
    <div
      role="button"
      tabIndex={canNavigate ? 0 : -1}
      onClick={openItem}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && canNavigate) openItem();
      }}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 0,
        background: "transparent",
        padding: "0 0 24px",
        margin: "0 0 24px",
        textAlign: "left",
        cursor: canNavigate ? "pointer" : "default",
        fontFamily: "inherit",
        color: "#1f1b18",
        borderBottom: "1px solid rgba(87,75,67,0.14)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: accent,
              fontSize: 21,
              fontWeight: 850,
              lineHeight: 1.18,
              wordBreak: "break-word",
            }}
          >
            {name}
          </div>
          {price ? (
            <div style={{ marginTop: 5, color: "#6f5c51", fontSize: 15, fontWeight: 800 }}>
              {price}
            </div>
          ) : null}
        </div>
        {orderable ? (
          <span
            onClick={quickAdd}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") quickAdd(e);
            }}
            style={{
              minHeight: 44,
              minWidth: 74,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: `1px solid ${accent}`,
              color: accent,
              background: inCartCount > 0 ? "rgba(255,255,255,0.82)" : "transparent",
              fontSize: 13,
              fontWeight: 850,
              flexShrink: 0,
            }}
          >
            {inCartCount > 0 ? `${inCartCount} added` : "Order"}
          </span>
        ) : null}
      </div>
      {desc ? (
        <div style={{ marginTop: 8, color: muted, fontSize: 18, lineHeight: 1.48, fontWeight: 450 }}>
          {desc}
        </div>
      ) : null}
      {showInsightsInline || showAllergenInline ? (
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {showAllergenInline ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 20,
                padding: "0 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: "rgba(122,43,35,0.08)",
                color: "#7a2b23",
                border: "1px solid rgba(122,43,35,0.2)",
              }}
            >
              Allergens
            </span>
          ) : null}
          {showInsightsInline ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openItem();
              }}
              style={{
                border: "none",
                background: "transparent",
                color: accent,
                fontSize: 12,
                fontWeight: 700,
                padding: 0,
                cursor: "pointer",
              }}
            >
              Insights →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function PremiumBistroMenuTemplate(ctx) {
  const {
    isMobile,
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
    allergenBannerSlot,
    onOpenFilters,
    displaySections,
    displayableItemCount,
    filtersActive,
    handleClearFilters,
    heroImageUrl,
    brand,
    fontStack,
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    cartLineCount,
    menuThemeSettings = {},
  } = ctx;

  const accent = brand?.accentStrong ?? brand?.accent ?? "#6b211c";
  const accentFill = brand?.accent ?? "#7a2b23";
  const cream = "#fbf7ee";
  const paper = "#fffdf8";
  const muted = "#74695f";
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  const collectionButtons =
    Array.isArray(menus) && menus.length > 1
      ? menus
          .map((menu, idx) => ({
            id: menu.id,
            label: text(menu.tab_label || menu.display_name || menu.name),
            active: selectedMenuId == null ? idx === 0 : Number(menu.id) === Number(selectedMenuId),
            onClick: () => onSelectMenu(menu.id),
          }))
          .filter((button) => button.label)
      : displaySections.slice(0, 8).map((section, idx) => ({
          id: `section-${idx}`,
          label: text(section?.title || section?.name || "Menu"),
          active: idx === 0,
          onClick: () => {
            const target = document.getElementById(`premium-bistro-section-${idx}`);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        }));
  const statusLabel = scheduledActiveMenuLabel || menuTypeLabel;

  function scrollToMenu() {
    const target = document.getElementById("premium-bistro-menu-start");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        paddingBottom: "calc(var(--bottom-nav-h, 70px) + 110px)",
        fontFamily: fontStack,
        color: "#f8f4ea",
      }}
    >
      <header
        style={{
          position: "relative",
          minHeight: isMobile ? 360 : 430,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "26px 20px 38px" : "36px 42px 58px",
          overflow: "hidden",
          background: heroImageUrl
            ? `linear-gradient(rgba(9,10,9,0.58), rgba(9,10,9,0.78)), url(${heroImageUrl}) center/cover`
            : brand?.heroBackdrop || "linear-gradient(135deg, #17130f, #090b0a)",
        }}
      >
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Open filters"
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            width: 46,
            height: 46,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(8,10,9,0.42)",
            color: "#fff",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ☰
        </button>
        <div style={{ position: "absolute", top: 18, right: 18 }}>
          <ShareButton
            variant="menu"
            label="Share"
            shareData={shareData}
            analyticsContext={shareAnalyticsContext}
            size="compact"
            tone="subtle"
          />
        </div>

        <div style={{ textAlign: "center", maxWidth: 720 }}>
          {statusLabel ? (
            <div
              style={{
                marginBottom: 16,
                color: "rgba(255,255,255,0.72)",
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <PremiumLogoSlot logoUrl={logoUrl} restaurantName={restaurantName} accent={accentFill} />
          </div>
          {restaurantProfileHref ? (
            <Link
              to={restaurantProfileHref}
              style={{
                color: "#fff",
                textDecoration: "none",
                fontFamily: "Georgia, Palatino, serif",
                fontSize: isMobile ? 42 : 66,
                fontWeight: 850,
                lineHeight: 0.98,
              }}
            >
              {restaurantName}
            </Link>
          ) : (
            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontFamily: "Georgia, Palatino, serif",
                fontSize: isMobile ? 42 : 66,
                fontWeight: 850,
                lineHeight: 0.98,
              }}
            >
              {restaurantName}
            </h1>
          )}
          {brand?.tagline ? (
            <div style={{ marginTop: 16, color: "rgba(255,255,255,0.78)", fontSize: 16, lineHeight: 1.5 }}>
              {brand.tagline}
            </div>
          ) : null}
          {addressLine ? (
            <div style={{ marginTop: 16, color: "rgba(255,255,255,0.66)", fontSize: 13, fontWeight: 700 }}>
              {directionsHref ? (
                <a href={directionsHref} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {addressLine1}{addressLine2 ? `, ${addressLine2}` : ""}
                </a>
              ) : (
                <span>{addressLine}</span>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <main style={{ background: "#171717", padding: isMobile ? "22px 14px 34px" : "34px 28px 52px" }}>
        <div id="premium-bistro-menu-start" style={{ maxWidth: 980, margin: "0 auto" }}>
          {franchiseSlot}
          {intakeBannerSlot}
          {allergenBannerSlot}

          {collectionButtons.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {collectionButtons.map((button) => (
                <button
                  key={String(button.id)}
                  type="button"
                  onClick={button.onClick}
                  disabled={tabLoading && button.active}
                  style={{
                    minHeight: 54,
                    borderRadius: 2,
                    border: `1.5px solid ${button.active ? accentFill : "rgba(255,255,255,0.38)"}`,
                    background: button.active ? accentFill : "transparent",
                    color: button.active ? (brand?.onAccent || "#fff") : "#f8f4ea",
                    padding: "12px 10px",
                    fontSize: 14,
                    fontWeight: 850,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {button.label}
                </button>
              ))}
            </div>
          ) : null}

          {tabError ? (
            <div style={{ color: "#fecaca", fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{tabError}</div>
          ) : null}

          <section
            style={{
              background: paper,
              color: "#211b17",
              boxShadow: "0 22px 70px rgba(0,0,0,0.26)",
              padding: isMobile ? "26px 22px 38px" : "44px 56px 60px",
            }}
          >
            {filtersActive ? (
              <div
                style={{
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  color: muted,
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                <span>{displayableItemCount} matching items</span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{ border: "none", background: "transparent", color: accent, fontWeight: 850, cursor: "pointer" }}
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            {displaySections.map((section, sIdx) => {
              const title = text(section?.title || section?.name || "Menu");
              const items = Array.isArray(section?.items) ? section.items : [];
              const imageUrl = getSectionImageUrl(section);
              return (
                <div key={String(section?.id ?? `${title}-${sIdx}`)} id={`premium-bistro-section-${sIdx}`}>
                  <SectionHeading title={title} accent={accent} isMobile={isMobile} />
                  <div style={{ display: "grid", gap: 0 }}>
                    {items.map((item, iIdx) => (
                      <PremiumMenuItem
                        key={String(item?.id ?? `${sIdx}-${iIdx}`)}
                        item={item}
                        ctx={ctx}
                        accent={accent}
                        muted={muted}
                      />
                    ))}
                  </div>
                  {showSectionImages && imageUrl && sIdx < displaySections.length - 1 ? (
                    <div
                      style={{
                        margin: isMobile ? "28px -22px 4px" : "38px -56px 2px",
                        height: isMobile ? 210 : 320,
                        background: cream,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        </div>
      </main>

      {cartLineCount > 0 ? null : (
        <div
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: "calc(var(--bottom-nav-h, 70px) + 10px)",
            zIndex: 260,
            maxWidth: 540,
            margin: "0 auto",
            borderRadius: 3,
            background: "#064e49",
            boxShadow: "0 18px 48px rgba(0,0,0,0.3)",
            padding: 8,
          }}
        >
          <button
            type="button"
            onClick={scrollToMenu}
            style={{
              width: "100%",
              minHeight: 54,
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 2,
              background: "transparent",
              color: "#fff",
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Order
          </button>
        </div>
      )}
    </div>
  );
}
