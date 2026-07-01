import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import EditorialDarkMenuTemplate from "./EditorialDarkMenuTemplate.jsx";
import EditorialSteakhouseMenuTemplate from "./EditorialSteakhouseMenuTemplate.jsx";
import EditorialQSRMenuTemplate from "./EditorialQSRMenuTemplate.jsx";
import EditorialCasualMenuTemplate from "./EditorialCasualMenuTemplate.jsx";
import { normalizeMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 *
 * The Apple-inspired editorial layout (ClassicMenuTemplate) is the single
 * foundation for every restaurant menu. The only supported variation is
 * color scheme / concept, not layout:
 *   v1  Classic (light, neutral — default)
 *   v12 Modern Dark (iOS dark-mode tokens)
 *   v13 Steakhouse / Fine Dining (warm dark, brass accent)
 *   v14 QSR / Fast Casual (bright, bold, orange-red accent)
 *   v15 Casual / Family Dining (warm cream, terracotta accent)
 *
 * The former boutique layout templates (v2-v10: Modern Fast Casual, Takeout,
 * Dark Premium, Family Diner, Premium Bistro, Chalkboard, Rustic Italian,
 * Modern Asian, Refined Dark) are no longer routed to — their files remain
 * on disk for reference/rollback but are not imported here.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = normalizeMenuStyle(rawStyle);

  if (menuStyle === "v12") return <EditorialDarkMenuTemplate {...ctx} />;
  if (menuStyle === "v13") return <EditorialSteakhouseMenuTemplate {...ctx} />;
  if (menuStyle === "v14") return <EditorialQSRMenuTemplate {...ctx} />;
  if (menuStyle === "v15") return <EditorialCasualMenuTemplate {...ctx} />;
  return <ClassicMenuTemplate {...ctx} />;
}
