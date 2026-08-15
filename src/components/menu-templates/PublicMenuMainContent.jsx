import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import DarkPremiumMenuTemplate from "./DarkPremiumMenuTemplate.jsx";
import PremiumBistroMenuTemplate from "./PremiumBistroMenuTemplate.jsx";
import ModernAsianMenuTemplate from "./ModernAsianMenuTemplate.jsx";
import RusticItalianMenuTemplate from "./RusticItalianMenuTemplate.jsx";
import FineMenuTemplate from "./FineMenuTemplate.jsx";
import MenuVerificationFooter from "./MenuVerificationFooter.jsx";
import { resolveTemplateMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 *
 * Gallery styles map to distinct photo-forward layouts:
 *   v1  Default / Classic (Apple-inspired — Yellow Browser foundation)
 *   v12 Modern Dark → DarkPremiumMenuTemplate
 *   v13 Steakhouse → PremiumBistroMenuTemplate
 *   v14 Fast Casual → ModernAsianMenuTemplate (photo card grid)
 *   v15 Family Dining → RusticItalianMenuTemplate
 *   v16 Brand Tint → ClassicMenuTemplate + operator shell tint
 *   v17 Fine → FineMenuTemplate (warm serif + Klaudette-style dish thumbs when enabled)
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = resolveTemplateMenuStyle(rawStyle);
  const footerColor =
    menuStyle === "v12" || menuStyle === "v13" || menuStyle === "v14"
      ? "rgba(255,255,255,0.55)"
      : menuStyle === "v17"
        ? "#5C4030"
        : "#64748b";

  let content = null;
  if (menuStyle === "v12") content = <DarkPremiumMenuTemplate {...ctx} />;
  else if (menuStyle === "v13") content = <PremiumBistroMenuTemplate {...ctx} />;
  else if (menuStyle === "v14") content = <ModernAsianMenuTemplate {...ctx} />;
  else if (menuStyle === "v15") content = <RusticItalianMenuTemplate {...ctx} />;
  else if (menuStyle === "v17") content = <FineMenuTemplate {...ctx} />;
  else content = <ClassicMenuTemplate {...ctx} />;

  return (
    <>
      {content}
      <div style={{ padding: menuStyle === "v12" || menuStyle === "v13" || menuStyle === "v14" ? "0 16px 24px" : "0 24px 24px" }}>
        <MenuVerificationFooter data={ctx?.data} tone={ctx?.tone} menuLastVerifiedAt={ctx?.menuLastVerifiedAt} color={footerColor} />
      </div>
    </>
  );
}
