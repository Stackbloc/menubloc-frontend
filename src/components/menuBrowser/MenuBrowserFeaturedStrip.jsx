import { useEffect, useState } from "react";
import DiscoveryCard from "../discovery/DiscoveryCard.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { getBrowseMenus } from "../../lib/api.js";
import { buildBrowseLocationParams } from "../../lib/locationUtils.js";
import { dedupeDiscoveryMenus } from "../../lib/discoveryFeedGuardrails.js";

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

/** Featured promoted menus on the browser landing — powered by paid deals (is_promoted). */
export default function MenuBrowserFeaturedStrip({ locationParams }) {
  const { t } = useLanguage();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getBrowseMenus({
      ...locationParams,
      limit: 2,
      offset: 0,
    })
      .then((response) => {
        if (cancelled) return;
        const all = dedupeDiscoveryMenus(extractMenus(response));
        const sponsored = all.filter((menu) => menu?.is_sponsored === true);
        setMenus(sponsored.length ? sponsored : all.slice(0, 2));
      })
      .catch(() => {
        if (!cancelled) setMenus([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [locationParams]);

  if (loading || menus.length === 0) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
        <h2 style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--gb-color-ink-muted)",
        }}>
          {t("menuBrowser.featured", "Featured Menus")}
        </h2>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#a16207" }}>
          {t("menuBrowser.sponsored", "Sponsored")}
        </span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 12,
      }}>
        {menus.map((menu, index) => (
          <div key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)} style={{ position: "relative" }}>
            <DiscoveryCard menu={menu} paneVariant="featured" />
          </div>
        ))}
      </div>
    </section>
  );
}
