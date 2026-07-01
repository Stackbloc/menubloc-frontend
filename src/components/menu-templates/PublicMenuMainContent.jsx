import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import ModernFastCasualMenuTemplate from "./ModernFastCasualMenuTemplate.jsx";
import TakeoutMenuTemplate from "./TakeoutMenuTemplate.jsx";
import DarkPremiumMenuTemplate from "./DarkPremiumMenuTemplate.jsx";
import FamilyDinerMenuTemplate from "./FamilyDinerMenuTemplate.jsx";
import PremiumBistroMenuTemplate from "./PremiumBistroMenuTemplate.jsx";
import ChalkboardMenuTemplate from "./ChalkboardMenuTemplate.jsx";
import RusticItalianMenuTemplate from "./RusticItalianMenuTemplate.jsx";
import ModernAsianMenuTemplate from "./ModernAsianMenuTemplate.jsx";
import RefinedDarkMenuTemplate from "./RefinedDarkMenuTemplate.jsx";
import EditorialMenuTemplate from "./EditorialMenuTemplate.jsx";
import EditorialDarkMenuTemplate from "./EditorialDarkMenuTemplate.jsx";
import { normalizeMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = normalizeMenuStyle(rawStyle);

  if (menuStyle === "v2") return <ModernFastCasualMenuTemplate {...ctx} />;
  if (menuStyle === "v3") return <TakeoutMenuTemplate {...ctx} />;
  if (menuStyle === "v4") return <DarkPremiumMenuTemplate {...ctx} />;
  if (menuStyle === "v5") return <FamilyDinerMenuTemplate {...ctx} />;
  if (menuStyle === "v6") return <PremiumBistroMenuTemplate {...ctx} />;
  if (menuStyle === "v7") return <ChalkboardMenuTemplate {...ctx} />;
  if (menuStyle === "v8") return <RusticItalianMenuTemplate {...ctx} />;
  if (menuStyle === "v9") return <ModernAsianMenuTemplate {...ctx} />;
  if (menuStyle === "v10") return <RefinedDarkMenuTemplate {...ctx} />;
  if (menuStyle === "v11") return <EditorialMenuTemplate {...ctx} />;
  if (menuStyle === "v12") return <EditorialDarkMenuTemplate {...ctx} />;
  return <ClassicMenuTemplate {...ctx} />;
}
