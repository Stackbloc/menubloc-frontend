import { Link } from "react-router-dom";
import ShareButton from "../share/ShareButton.jsx";
import { getLocalizedField } from "../../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../../utils/getDisplayMenuItemName.js";
import { resolveIndulgencePresentation } from "../../lib/indulgencePresentation.js";
import { buildDishShareData } from "../share/shareUtils.js";
import { getMenuSectionImageUrl } from "./menuImageUtils.js";
import { shouldShowSectionImages } from "./menuThemeSettings.js";

function asText(value) {
  return String(value || "").trim();
}

function buildColumns(sections, columnCount) {
  const columns = Array.from({ length: columnCount }, () => []);
  (Array.isArray(sections) ? sections : []).forEach((section, index) => {
    columns[index % columnCount].push(section);
  });
  return columns;
}

function ChalkItem({ item, sectionIndex, itemIndex, ctx, accent }) {
  const {
    language,
    restaurantName,
    data,
    currentRestaurantId,
    dealMap,
    setItemSheet,
    fmtMoney,
  } = ctx;
  const name = getDisplayMenuItemName(item, language, "Item");
  const desc = asText(
    getLocalizedField(item, "description", language) ||
      getLocalizedField(item, "notes", language) ||
      item?.description ||
      item?.notes
  );
  const price = fmtMoney(item);
  const canNavigate = item?.id != null;
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
  const deal = canNavigate ? dealMap.get(item.id) : null;
  const indulgencePresentation = resolveIndulgencePresentation({ chips: item?.chips });

  function openItem() {
    if (!canNavigate) return;
    setItemSheet({
      item,
      name,
      desc,
      price,
      hasDeal: !!deal,
      dishShareData,
      canNavigate: true,
      indulgencePresentation,
    });
  }

  return (
    <button
      type="button"
      onClick={openItem}
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#f7f3e9",
        padding: "0 0 14px",
        margin: 0,
        textAlign: "left",
        cursor: canNavigate ? "pointer" : "default",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "baseline" }}>
        <div
          style={{
            fontSize: 19,
            lineHeight: 1.05,
            fontWeight: 950,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "#fffaf0",
            textShadow: "0 0 1px rgba(255,255,255,0.55)",
          }}
        >
          {name}
        </div>
        {price ? (
          <div style={{ color: "#fffaf0", fontSize: 16, fontWeight: 900, whiteSpace: "nowrap" }}>
            {price.replace("$", "")}
          </div>
        ) : null}
      </div>
      {desc ? (
        <div
          style={{
            marginTop: 4,
            color: "rgba(255,255,255,0.72)",
            fontSize: 14,
            lineHeight: 1.33,
            fontWeight: 650,
          }}
        >
          {desc}
        </div>
      ) : null}
      {(itemIndex + sectionIndex) % 5 === 0 ? (
        <div aria-hidden="true" style={{ marginTop: 7, height: 1, width: 68, background: `${accent}88` }} />
      ) : null}
    </button>
  );
}

function ChalkSection({ section, sectionIndex, ctx, accent }) {
  const { language, t, menuThemeSettings = {} } = ctx;
  const title = asText(getLocalizedField(section, "title", language) || section?.title || t("publicMenu.menu", "Menu"));
  const items = Array.isArray(section?.items) ? section.items : [];
  const sectionImage = getMenuSectionImageUrl(section);
  const showSectionImages = shouldShowSectionImages(menuThemeSettings);
  return (
    <section style={{ breakInside: "avoid", marginBottom: 28 }}>
      <h2
        style={{
          margin: "0 0 12px",
          color: sectionIndex % 3 === 2 ? accent : "#fffaf0",
          fontSize: sectionIndex % 2 === 0 ? 45 : 34,
          lineHeight: 0.95,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: '"Arial Narrow", "Roboto Condensed", Impact, ui-sans-serif, sans-serif',
          textShadow: "0 1px 0 rgba(255,255,255,0.16)",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "grid", gap: 0 }}>
        {items.map((item, itemIndex) => (
          <ChalkItem
            key={String(item?.id ?? `${sectionIndex}-${itemIndex}`)}
            item={item}
            sectionIndex={sectionIndex}
            itemIndex={itemIndex}
            ctx={ctx}
            accent={accent}
          />
        ))}
      </div>
      {showSectionImages && sectionImage ? (
        <div
          aria-hidden="true"
          style={{
            marginTop: 14,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <img src={sectionImage} alt="" loading="lazy" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
        </div>
      ) : null}
    </section>
  );
}

export default function ChalkboardMenuTemplate(ctx) {
  const {
    isMobile,
    restaurantName,
    restaurantProfileHref,
    menuTypeLabel,
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
    brand,
    fontStack,
    t,
  } = ctx;

  const accent = brand?.accent ?? "#f6b21a";
  const showLogo = logoPlacement !== "hidden";
  const columns = buildColumns(displaySections, isMobile ? 1 : 3);

  return (
    <div
      style={{
        margin: isMobile ? "-16px -12px 0" : "-28px -20px 0",
        minHeight: "100vh",
        padding: isMobile ? "18px 14px 118px" : "34px 32px 92px",
        color: "#fffaf0",
        fontFamily: fontStack,
        background:
          "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.08), transparent 22%), radial-gradient(circle at 82% 28%, rgba(255,255,255,0.05), transparent 24%), linear-gradient(135deg, #151515, #2b2927 45%, #111)",
      }}
    >
      <header style={{ maxWidth: 1180, margin: "0 auto 28px", display: "flex", alignItems: "center", gap: 16, justifyContent: logoPlacement === "center" ? "center" : undefined, textAlign: logoPlacement === "center" ? "center" : undefined }}>
        {showLogo && (logoUrl ? (
          <img src={logoUrl} alt="" width={58} height={58} style={{ width: 58, height: 58, borderRadius: 4, objectFit: "cover" }} />
        ) : (
          <div aria-hidden="true" style={{ width: 58, height: 58, borderRadius: 4, background: `${accent}33`, border: `2px solid ${accent}` }} />
        ))}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: accent, fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 4 }}>
            {menuTypeLabel || "Sample menu design"}
          </div>
          {restaurantProfileHref ? (
            <Link to={restaurantProfileHref} style={{ color: "#fffaf0", textDecoration: "none", fontSize: isMobile ? 32 : 44, fontWeight: 950, lineHeight: 1, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {restaurantName}
            </Link>
          ) : (
            <h1 style={{ margin: 0, color: "#fffaf0", fontSize: isMobile ? 32 : 44, fontWeight: 950, lineHeight: 1, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {restaurantName}
            </h1>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <ShareButton variant="menu" label="Share" shareData={shareData} analyticsContext={shareAnalyticsContext} size="compact" tone="subtle" />
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto" }}>
        {franchiseSlot}
        {intakeBannerSlot}
        {allergenBannerSlot}

        {displayableItemCount === 0 ? (
          <div style={{ padding: 28, color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: 800 }}>
            {filtersActive ? (
              <>
                This restaurant has no items that match your saved dietary preferences.{" "}
                <Link to="/account" style={{ color: accent, fontWeight: 900, fontSize: 15 }}>
                  Manage preferences
                </Link>
              </>
            ) : (
              t("publicMenu.noItems", "This restaurant does not currently have any displayable menu items.")
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.82fr 1.24fr 1.1fr", gap: isMobile ? 22 : 34 }}>
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} style={{ minWidth: 0 }}>
                {column.map((section, localIndex) => (
                  <ChalkSection
                    key={String(section?.id ?? `${columnIndex}-${localIndex}`)}
                    section={section}
                    sectionIndex={columnIndex + localIndex}
                    ctx={ctx}
                    accent={accent}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <div aria-hidden="true" style={{ height: 18, marginTop: 26, background: accent, borderTop: "3px solid #e94716" }} />
      </main>
    </div>
  );
}
