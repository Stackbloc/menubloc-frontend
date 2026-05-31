import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { getMenuSectionImageUrl, getMenuItemImageUrl } from "./menuImageUtils.js";

function AsianItem({ item, ctx, accent }) {
  const {
    language,
    dealMap,
    setItemSheet,
    fmtMoney,
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
        gridTemplateColumns: imageUrl ? "88px minmax(0, 1fr)" : "minmax(0, 1fr)",
        gap: 14,
        alignItems: "start",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        color: "#fff",
        padding: 14,
        textAlign: "left",
        cursor: canNavigate ? "pointer" : "default",
        fontFamily: "inherit",
        boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
      }}
    >
      {imageUrl ? (
        <div
          aria-hidden="true"
          style={{
            width: 88,
            height: 88,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
            background: "#111",
          }}
        >
          <img src={imageUrl} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ fontSize: 18, lineHeight: 1.12, fontWeight: 850, color: "#fff8ee" }}>
            {name}
          </div>
          {price ? <div style={{ fontSize: 16, fontWeight: 900, color: accent, whiteSpace: "nowrap" }}>{price}</div> : null}
        </div>
        {desc ? (
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}>
            {desc}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function ModernAsianMenuTemplate(ctx) {
  const {
    isMobile,
    restaurantProfileHref,
    menuTypeLabel,
    logoUrl,
    shareData,
    shareAnalyticsContext,
    onOpenFilters,
    displaySections,
    displayableItemCount,
    filtersActive,
    handleClearFilters,
    data,
    dealMap,
    setItemSheet,
    fmtMoney,
    brand,
    fontStack,
  } = ctx;

  const accent = brand?.accent ?? "#c9a35b";
  const restaurantName = data?.restaurant_name || data?.name || "";
  const heroImage = data?.hero_image_url || data?.cover_image_url || null;

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        padding: isMobile ? "18px 14px 48px" : "28px 24px 60px",
        background: "#0f1317",
        color: "#fff",
        fontFamily: fontStack,
      }}
    >
      <header
        style={{
          maxWidth: 1120,
          margin: "0 auto 18px",
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 22px 56px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: heroImage ? `url(${heroImage}) center/cover no-repeat` : "linear-gradient(135deg, #0b0f14, #1d2530)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,20,0.18), rgba(11,15,20,0.9))" }} />
        <div style={{ position: "relative", padding: isMobile ? "18px 18px 20px" : "26px 28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" width={56} height={56} style={{ width: 56, height: 56, borderRadius: 18, objectFit: "cover", border: "2px solid rgba(255,255,255,0.45)" }} />
              ) : (
                <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 18, background: accent }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "rgba(255,248,238,0.8)", fontSize: 11, fontWeight: 850, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 4 }}>
                  {menuTypeLabel || "Sample menu design"}
                </div>
                {restaurantProfileHref ? (
                  <Link to={restaurantProfileHref} style={{ color: "#fff", textDecoration: "none", fontSize: isMobile ? 30 : 44, fontWeight: 900, lineHeight: 1 }}>
                    {restaurantName}
                  </Link>
                ) : (
                  <h1 style={{ margin: 0, color: "#fff", fontSize: isMobile ? 30 : 44, fontWeight: 900, lineHeight: 1 }}>
                    {restaurantName}
                  </h1>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
              <button
                type="button"
                onClick={onOpenFilters}
                style={{
                  minHeight: 40,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.24)",
                  background: "rgba(0,0,0,0.22)",
                  color: "#fff",
                  padding: "0 14px",
                  fontSize: 12,
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                Filters
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto" }}>
        {displayableItemCount === 0 ? (
          <div style={{ padding: 24, color: "rgba(255,255,255,0.62)", fontSize: 16 }}>
            {filtersActive ? (
              <>
                No sample items match these filters.{" "}
                <button type="button" onClick={handleClearFilters} style={{ border: "none", background: "transparent", color: accent, fontWeight: 850, cursor: "pointer" }}>
                  Clear filters
                </button>
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
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 22,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "18px 18px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <div style={{ height: 1, flex: 1, background: "rgba(201,163,91,0.34)" }} />
                      <h2 style={{ margin: 0, color: accent, fontFamily: "Georgia, serif", fontSize: isMobile ? 24 : 34, fontWeight: 800 }}>
                        {title}
                      </h2>
                      <div style={{ height: 1, flex: 1, background: "rgba(201,163,91,0.34)" }} />
                    </div>
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
                      {items.map((item) => (
                        <AsianItem
                          key={String(item?.id || item?.name)}
                          item={item}
                          ctx={{ ...ctx, dealMap, setItemSheet, fmtMoney }}
                          accent={accent}
                        />
                      ))}
                    </div>
                  </div>
                  {sectionImage ? (
                    <img
                      src={sectionImage}
                      alt=""
                      loading="lazy"
                      style={{ width: "100%", height: isMobile ? 180 : 240, objectFit: "cover", display: "block" }}
                    />
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
