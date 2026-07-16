import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import RefinedDarkMenuTemplate from "./RefinedDarkMenuTemplate.jsx";
import PremiumBistroMenuTemplate from "./PremiumBistroMenuTemplate.jsx";
import ModernFastCasualMenuTemplate from "./ModernFastCasualMenuTemplate.jsx";
import FamilyDinerMenuTemplate from "./FamilyDinerMenuTemplate.jsx";
import MenuVerificationFooter from "./MenuVerificationFooter.jsx";
import { resolveTemplateMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 *
 * Gallery styles map to distinct layouts (not color-only clones):
 *   v1  Default / Classic (Apple-inspired — Yellow Browser foundation)
 *   v12 Modern Dark → RefinedDarkMenuTemplate
 *   v13 Steakhouse → PremiumBistroMenuTemplate
 *   v14 Fast Casual → ModernFastCasualMenuTemplate
 *   v15 Family Dining → FamilyDinerMenuTemplate
 *   v16 Brand Tint → ClassicMenuTemplate + operator shell tint
 *
 * Editorial* color skins remain on disk for rollback but are not routed here.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = resolveTemplateMenuStyle(rawStyle);
  const footerColor =
    menuStyle === "v12" || menuStyle === "v13"
      ? "rgba(255,255,255,0.55)"
      : "#64748b";

  let content = null;
  if (menuStyle === "v12") content = <RefinedDarkMenuTemplate {...ctx} />;
  else if (menuStyle === "v13") content = <PremiumBistroMenuTemplate {...ctx} />;
  else if (menuStyle === "v14") content = <ModernFastCasualMenuTemplate {...ctx} />;
  else if (menuStyle === "v15") content = <FamilyDinerMenuTemplate {...ctx} />;
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
