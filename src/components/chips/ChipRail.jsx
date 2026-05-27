import { useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function ChipRail({ children, className = "", style = {}, ...props }) {
  const { t } = useLanguage();
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const onWheel = (event) => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      if (maxScrollLeft <= 1) return;

      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!dominantDelta) return;

      const nextScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, el.scrollLeft + dominantDelta)
      );

      // Keep desktop trackpad swipes contained inside the rail so the browser
      // does not interpret horizontal gestures as back/forward page navigation.
      event.preventDefault();
      if (nextScrollLeft !== el.scrollLeft) {
        el.scrollLeft = nextScrollLeft;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <>
      {/* GUARDRAIL:
          All horizontal chip/filter/category rails must use this component. Do not
          recreate ad hoc chip rows. Chips must not shrink or wrap; overflow must
          scroll horizontally on desktop and mobile. */}
      <div
        ref={scrollerRef}
        className={["gb-chip-rail", className].filter(Boolean).join(" ")}
        style={style}
        {...props}
      >
        {children}
      </div>
    </>
  );
}
