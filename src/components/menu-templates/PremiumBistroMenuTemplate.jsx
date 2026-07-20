import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import PublicMenuItemCard from "./PublicMenuItemCard.jsx";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";
import { MENU_ROW_HEADER_ICON_GAP, MENU_ROW_ICON_SIZE } from "./menuPresentationUtils.js";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import RestaurantVerificationBadge from "../RestaurantVerificationBadge.jsx";
import { MenuDesignHeroSlot, MenuDesignSectionSlot, sectionPhotoSlotKey } from "./MenuDesignPhotoEditOverlay.jsx";

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

function SectionHeading({ title, accent, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        margin: isMobile ? "28px 0 16px" : "36px 0 18px",
      }}
    >
      <div style={{ height: 1, flex: 1, background: `${accent}55` }} />
      <h2
        style={{
          margin: 0,
          color: accent,
          fontFamily: "Georgia, Palatino, serif",
          fontSize: isMobile ? 26 : 34,
          fontWeight: 800,
          letterSpacing: "0.02em",
          textAlign: "center",
        }}
      >
        {title}
      </h2>
      <div style={{ height: 1, flex: 1, background: `${accent}55` }} />
    </div>
  );
}

export default function PremiumBistroMenuTemplate(ctx) {
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
    logoPlacement = "top-left",
    shareData,
    shareAnalyticsContext,
    franchiseSlot,
    intakeBannerSlot,
    allergenBannerSlot,
    displaySections,
    displayableItemCount,
    filtersActive,
    heroImageUrl,
    brand,
    fontStack,
    menus = [],
    selectedMenuId,
    onSelectMenu,
    tabLoading,
    tabError,
    menuThemeSettings = {},
    currentRestaurantId,
    tone,
    claimStatus,
    subscriptionPlan,
    menuStatus,
    profileTier,
    listingStatus,
    planSlug,
    isPro,
    isPaidSubscriber,
    orderAcceptanceStatus,
    data,
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
  } = ctx;

  const accent = brand?.accentStrong ?? brand?.accent ?? "#6b211c";
  const accentFill = brand?.accent ?? "#7a2b23";
  const showLogo = logoPlacement !== "hidden";
  const cream = "#fbf7ee";
  const paper = "#fffaf3";
  const muted = "#6f5c51";
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  const showItemImages = shouldShowItemImages(menuThemeSettings);

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

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        paddingBottom: "calc(var(--bottom-nav-h, 70px) + 24px)",
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
          background: brand?.heroBackdrop || "linear-gradient(135deg, #17130f, #090b0a)",
        }}
      >
        <MenuDesignHeroSlot
          heroImageUrl={heroImageUrl}
          isStock={Boolean(ctx?.designHeroIsStock)}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          imgStyle={{ filter: "brightness(0.55)" }}
        />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 720 }}>
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
          {showLogo && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  width={72}
                  height={72}
                  style={{ width: 72, height: 72, borderRadius: 999, objectFit: "cover", border: `2px solid ${accentFill}` }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    border: `2px solid ${accentFill}`,
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
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
            <RestaurantVerificationBadge
              size="md"
              tone={tone}
              claimStatus={claimStatus}
              subscriptionPlan={subscriptionPlan}
              menuStatus={menuStatus}
              profileTier={profileTier}
              listingStatus={listingStatus}
              planSlug={planSlug}
              isPro={isPro}
              isPaidSubscriber={isPaidSubscriber}
              orderAcceptanceStatus={orderAcceptanceStatus}
            />
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: MENU_ROW_HEADER_ICON_GAP,
            }}
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
                <Link to="/account" style={{ color: accent, fontWeight: 850, fontSize: 13 }}>
                  Manage preferences
                </Link>
              </div>
            ) : null}

            {displaySections.map((section, sIdx) => {
              const title = text(section?.title || section?.name || "Menu");
              const items = Array.isArray(section?.items) ? section.items : [];
              const imageUrl = getSectionImageUrl(section);
              return (
                <div key={String(section?.id ?? `${title}-${sIdx}`)} id={`premium-bistro-section-${sIdx}`}>
                  <SectionHeading title={title} accent={accent} isMobile={isMobile} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((it, iIdx) => (
                      <PublicMenuItemCard
                        key={String(it?.menu_item_id ?? it?.id ?? `${sIdx}-${iIdx}`)}
                        density="classic"
                        editorialRefresh={true}
                        editorialColorScheme="light"
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
                  {showSectionImages && imageUrl && sIdx < displaySections.length - 1 ? (
                    <div
                      style={{
                        margin: isMobile ? "28px -22px 4px" : "38px -56px 2px",
                        height: isMobile ? 210 : 320,
                        background: cream,
                        overflow: "hidden",
                      }}
                    >
                      <MenuDesignSectionSlot
                        slotKey={sectionPhotoSlotKey(section, sIdx)}
                        imageUrl={imageUrl}
                        isStock={Boolean(ctx?.designSectionIsStock?.[sectionPhotoSlotKey(section, sIdx)])}
                        style={{ width: "100%", height: "100%" }}
                        imgStyle={{ height: "100%" }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
