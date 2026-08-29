import { useEffect, useState } from "react";
import { FEED_DESKTOP_MIN_WIDTH } from "./feedShellLinks.js";

export function useFeedShellDesktop(minWidth = FEED_DESKTOP_MIN_WIDTH) {
  const query = `(min-width: ${minWidth}px)`;
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return isDesktop;
}
