import { useLayoutEffect } from "react";

/** Shrinks the text until it fits its rectangle (and again when the rectangle resizes). */
export default function useFitText(boxRef, textRef, startSize, deps) {
  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return undefined;
    const fit = () => {
      let size = startSize;
      box.style.fontSize = `${size}px`;
      box.style.overflowWrap = "normal";
      const tooBig = () => inner.offsetHeight > box.clientHeight + 1 || inner.scrollWidth > box.clientWidth + 1;
      while (size > 9 && tooBig()) {
        size -= 1;
        box.style.fontSize = `${size}px`;
      }
      // Still a word too long for the tile at the smallest size: let it break.
      if (tooBig()) box.style.overflowWrap = "anywhere";
    };
    fit();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

