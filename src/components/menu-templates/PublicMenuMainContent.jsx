import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import EditorialDarkMenuTemplate from "./EditorialDarkMenuTemplate.jsx";
import { normalizeMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 *
 * The Apple-inspired editorial layout (ClassicMenuTemplate) is now the single
 * foundation for every restaurant menu. The only supported variation is color
 * scheme, not layout: v12 renders the dark palette, everything else renders
 * the light default. The former boutique layout templates (v2-v10: Modern
 * Fast Casual, Takeout, Dark Premium, Family Diner, Premium Bistro,
 * Chalkboard, Rustic Italian, Modern Asian, Refined Dark) are no longer
 * routed to — their files remain on disk for reference/rollback but are not
 * imported here.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = normalizeMenuStyle(rawStyle);

  if (menuStyle === "v12") return <EditorialDarkMenuTemplate {...ctx} />;
  return <ClassicMenuTemplate {...ctx} />;
}
