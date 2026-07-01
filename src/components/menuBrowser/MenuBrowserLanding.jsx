import { useLanguage } from "../../context/LanguageContext.jsx";

function toTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}

export default function MenuBrowserLanding({ categories, onSelect, locationLabel }) {
  const { t } = useLanguage();

  const grouped = categories.reduce((acc, category) => {
    const group = category.group || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(category);
    return acc;
  }, {});

  const groupOrder = ["discovery", "meal", "cuisine", "dietary", "occasion", "other"];
  const groupLabels = {
    discovery: t("menuBrowser.group.discovery", "Discover"),
    meal: t("menuBrowser.group.meal", "Meals"),
    cuisine: t("menuBrowser.group.cuisine", "Cuisines"),
    dietary: t("menuBrowser.group.dietary", "Dietary"),
    occasion: t("menuBrowser.group.occasion", "Occasions"),
    other: t("menuBrowser.group.other", "More"),
  };

  return (
    <div style={{ padding: "8px 0 24px" }}>
      <div style={{ marginBottom: 20, padding: "0 4px" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--gb-color-ink-strong)" }}>
          {t("menuBrowser.title", "Browse Menus")}
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, color: "var(--gb-color-ink-soft)", maxWidth: 520 }}>
          {locationLabel
            ? t("menuBrowser.subtitleNear", "Hungry? Explore full menus near {location} — no search required.", { location: locationLabel })
            : t("menuBrowser.subtitle", "Hungry? Explore full restaurant menus — no search required.")}
        </p>
      </div>

      {groupOrder.map((groupKey) => {
        const items = grouped[groupKey];
        if (!items?.length) return null;
        return (
          <section key={groupKey} style={{ marginBottom: 28 }}>
            <h2 style={{
              margin: "0 0 12px 4px",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--gb-color-ink-muted)",
            }}>
              {groupLabels[groupKey]}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
                gap: 12,
              }}
            >
              {items.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelect(category.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "16px 14px",
                    borderRadius: 18,
                    border: "1px solid var(--gb-color-border)",
                    background: `linear-gradient(145deg, ${category.accent}14 0%, #ffffff 55%)`,
                    boxShadow: "var(--gb-shadow-card)",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: 108,
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">
                    {category.emoji}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--gb-color-ink-strong)", lineHeight: 1.2 }}>
                    {t(toTranslationKey(category.id), category.label)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
