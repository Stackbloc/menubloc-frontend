/** Hover-reveal controls for owner media tiles (desktop hover; always on touch). */

export function prefersHoverReveal() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(hover: hover)").matches;
}
