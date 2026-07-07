import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import EditorialDarkMenuTemplate from "./EditorialDarkMenuTemplate.jsx";
import EditorialSteakhouseMenuTemplate from "./EditorialSteakhouseMenuTemplate.jsx";
import EditorialQSRMenuTemplate from "./EditorialQSRMenuTemplate.jsx";
import EditorialCasualMenuTemplate from "./EditorialCasualMenuTemplate.jsx";
import MenuVerificationFooter from "./MenuVerificationFooter.jsx";
import { resolveTemplateMenuStyle } from "./menuPresentationUtils.js";

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
 *   v16 Brand Tint (Classic layout + operator-set shell background color)
 *
 * The former boutique layout templates (v2-v10: Modern Fast Casual, Takeout,
 * Dark Premium, Family Diner, Premium Bistro, Chalkboard, Rustic Italian,
 * Modern Asian, Refined Dark) are no longer routed to — their files remain
 * on disk for reference/rollback but are not imported here.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = resolveTemplateMenuStyle(rawStyle);
  const footerColor =
    menuStyle === "v12" || menuStyle === "v13"
      ? "rgba(255,255,255,0.55)"
      : "#64748b";

  let content = null;
  if (menuStyle === "v12") content = <EditorialDarkMenuTemplate {...ctx} />;
  else if (menuStyle === "v13") content = <EditorialSteakhouseMenuTemplate {...ctx} />;
  else if (menuStyle === "v14") content = <EditorialQSRMenuTemplate {...ctx} />;
  else if (menuStyle === "v15") content = <EditorialCasualMenuTemplate {...ctx} />;
  else content = <ClassicMenuTemplate {...ctx} />;

  return (
    <>
      {content}
      <div style={{ padding: menuStyle === "v12" || menuStyle === "v13" ? "0 16px 24px" : "0 24px 24px" }}>
        <MenuVerificationFooter data={ctx?.data} tone={ctx?.tone} menuLastVerifiedAt={ctx?.menuLastVerifiedAt} color={footerColor} />
      </div>
    </>
  );
}
