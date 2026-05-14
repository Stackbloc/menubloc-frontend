import ClassicMenuTemplate from "./ClassicMenuTemplate.jsx";
import CinematicMenuTemplate from "./CinematicMenuTemplate.jsx";
import TakeoutMenuTemplate from "./TakeoutMenuTemplate.jsx";
import { normalizeMenuStyle } from "./menuPresentationUtils.js";

/**
 * Presentation-only layer: same structured ctx object for every template.
 */
export default function PublicMenuMainContent({ menuStyle: rawStyle, templateContext: ctx }) {
  const menuStyle = normalizeMenuStyle(rawStyle);

  if (menuStyle === "v2") return <CinematicMenuTemplate {...ctx} />;
  if (menuStyle === "v3") return <TakeoutMenuTemplate {...ctx} />;
  return <ClassicMenuTemplate {...ctx} />;
}
