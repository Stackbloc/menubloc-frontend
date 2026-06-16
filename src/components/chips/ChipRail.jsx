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

      // Horizontal trackpad swipe (deltaX dominant) — let the browser handle
      // it natively so kinetic/momentum scrolling works smoothly.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      // Vertical scroll — redirect to horizontal so the rail scrolls instead
      // of the page. Only prevent default here to avoid blocking page scroll
      // when the rail is at its boundary.
      if (!event.deltaY) return;

      const nextScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, el.scrollLeft + event.deltaY)
      );

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
