import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { getMenuSectionImageUrl, getMenuItemImageUrl } from "./menuImageUtils.js";
import { shouldShowItemImages, shouldShowSectionImages } from "./menuThemeSettings.js";

function SectionItem({ item, ctx, accent }) {
  const {
    language,
    dealMap,
    setItemSheet,
    fmtMoney,
    showImage = true,
  } = ctx;

  const name = getDisplayMenuItemName(item, language, "Item");
  const desc = String(
    getLocalizedField(item, "description", language) ||
      getLocalizedField(item, "notes", language) ||
      item?.description ||
      item?.notes ||
      ""
  ).trim();
  const price = fmtMoney(item);
  const imageUrl = getMenuItemImageUrl(item);
  const canNavigate = item?.id != null;
  const deal = canNavigate ? dealMap.get(item.id) : null;

  function openItem() {
    if (!canNavigate) return;
    setItemSheet({
      item,
      name,
      desc,
      price,
      hasDeal: !!deal,
      dishShareData: null,
      canNavigate: true,
      indulgencePresentation: null,
    });
  }

  return (
    <button
      type="button"
      onClick={openItem}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: imageUrl ? "72px minmax(0, 1fr)" : "minmax(0, 1fr)",
        gap: 12,
        alignItems: "start",
        border: "none",
        background: "transparent",
        padding: "12px 0",
        textAlign: "left",
        cursor: canNavigate ? "pointer" : "default",
        borderBottom: "1px solid rgba(107,114,128,0.16)",
        color: "#241f1b",
        fontFamily: "inherit",
      }}
    >
      {showImage && imageUrl ? (
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          <img src={imageUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontSize: 18, lineHeight: 1.12, fontWeight: 800, color: "#201914" }}>
            {name}
          </div>
          {price ? <div style={{ fontSize: 16, fontWeight: 900, color: accent, whiteSpace: "nowrap" }}>{price}</div> : null}
        </div>
        {desc ? (
          <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.42, color: "rgba(36,31,27,0.72)" }}>
            {desc}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function RusticItalianMenuTemplate(ctx) {
  const {
    isMobile,
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
    setItemSheet,
    fmtMoney,
    brand,
    fontStack,
    menuThemeSettings = {},
  } = ctx;

  const accent = brand?.accent ?? "#b63c2f";
  const restaurantName = data?.restaurant_name || data?.name || "";
  const heroImage = data?.hero_image_url || data?.cover_image_url || null;
  const showItemImages = shouldShowItemImages(menuThemeSettings);
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  const showLogo = logoPlacement !== "hidden";

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        padding: isMobile ? "18px 14px 48px" : "28px 24px 60px",
        background: "#f7efe3",
        color: "#241f1b",
        fontFamily: fontStack,
      }}
    >
      <header
        style={{
          maxWidth: 1080,
          margin: "0 auto 20px",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 44px rgba(15,23,42,0.08)",
          background: heroImage ? `linear-gradient(180deg, rgba(36,31,27,0.26), rgba(36,31,27,0.86)), url(${heroImage}) center/cover no-repeat` : "#efe4d1",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ padding: isMobile ? "18px 18px 20px" : "30px 32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
              {showLogo && (logoUrl ? (
                <img src={logoUrl} alt="" width={54} height={54} style={{ width: 54, height: 54, borderRadius: 14, objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }} />
              ) : (
                <div aria-hidden="true" style={{ width: 54, height: 54, borderRadius: 14, background: accent }} />
              ))}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#f3d6b8", fontSize: 11, fontWeight: 850, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
                  {menuTypeLabel || "Sample menu design"}
                </div>
                {restaurantProfileHref ? (
                  <Link to={restaurantProfileHref} style={{ color: "#fffaf0", textDecoration: "none", fontSize: isMobile ? 30 : 44, lineHeight: 1, fontWeight: 900 }}>
                    {restaurantName}
                  </Link>
                ) : (
                  <h1 style={{ margin: 0, color: "#fffaf0", fontSize: isMobile ? 30 : 44, lineHeight: 1, fontWeight: 900 }}>
                    {restaurantName}
                  </h1>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto" }}>
        {displayableItemCount === 0 ? (
          <div style={{ padding: 24, color: "#6b6259", fontSize: 16 }}>
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
              const title = String(getLocalizedField(section, "title", ctx.language) || section?.title || "Menu").trim();
              const sectionImage = getMenuSectionImageUrl(section);
              const items = Array.isArray(section?.items) ? section.items : [];
              return (
                <section
                  key={`${title}-${index}`}
                  style={{
                    background: "#fffaf3",
                    border: "1px solid rgba(36,31,27,0.08)",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ padding: "18px 20px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{ height: 1, flex: 1, background: "rgba(182,60,47,0.25)" }} />
                      <h2 style={{ margin: 0, color: accent, fontFamily: "Georgia, serif", fontSize: isMobile ? 24 : 34, fontWeight: 800 }}>
                        {title}
                      </h2>
                      <div style={{ height: 1, flex: 1, background: "rgba(182,60,47,0.25)" }} />
                    </div>
                    <div style={{ display: "grid", gap: 0 }}>
                      {items.map((item) => (
                        <SectionItem
                          key={String(item?.id || item?.name)}
                          item={item}
                          ctx={{ ...ctx, dealMap, setItemSheet, fmtMoney, showImage: showItemImages }}
                          accent={accent}
                        />
                      ))}
                    </div>
                  </div>
                  {showSectionImages && sectionImage ? (
                    <div style={{ borderTop: "1px solid rgba(36,31,27,0.08)" }}>
                      <img
                        src={sectionImage}
                        alt=""
                        loading="lazy"
                        style={{ width: "100%", height: isMobile ? 170 : 240, objectFit: "cover", display: "block" }}
                      />
                    </div>
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
