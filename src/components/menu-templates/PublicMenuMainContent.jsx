import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import CinematicMenuTemplate from "./CinematicMenuTemplate.jsx";
import TakeoutMenuTemplate from "./TakeoutMenuTemplate.jsx";
import BoldCasualMenuTemplate from "./BoldCasualMenuTemplate.jsx";
import RefinedEditorialMenuTemplate from "./RefinedEditorialMenuTemplate.jsx";
import { normalizeMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = normalizeMenuStyle(rawStyle);

  if (menuStyle === "v2") return <CinematicMenuTemplate {...ctx} />;
  if (menuStyle === "v3") return <TakeoutMenuTemplate {...ctx} />;
  if (menuStyle === "v4") return <BoldCasualMenuTemplate {...ctx} />;
  if (menuStyle === "v5") return <RefinedEditorialMenuTemplate {...ctx} />;
  return <ClassicMenuTemplate {...ctx} />;
}
