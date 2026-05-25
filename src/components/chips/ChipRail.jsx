import { useEffect, useRef } from "react";

export default function ChipRail({ children, className = "", style = {}, ...props }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const onWheel = (event) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
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
