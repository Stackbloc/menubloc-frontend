import { useEffect, useState } from "react";

/** True while the CSS media query matches; follows resizes and rotation. */
export default function useMatchMedia(query) {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia?.(query)?.matches === true;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}
