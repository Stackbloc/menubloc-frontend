import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sentry } from "../instrument.js";

function operationForLocation(pathname, search) {
  if (pathname === "/" || pathname.startsWith("/home-")) return "Home Page";
  if (pathname === "/search") {
    return new URLSearchParams(search).get("restaurantIntent") === "true"
      ? "Restaurant Search"
      : "Public Search";
  }
  if (/\/menu-items?\//.test(pathname) || pathname.startsWith("/menu-items/")) return "Menu Item Retrieval";
  if (/\/menu$/.test(pathname) || pathname === "/menus") return "Menu Page";
  if (pathname.startsWith("/restaurant/pdf-upload") || pathname.startsWith("/restaurant/ocr-upload")) return "PDF Upload (later use)";
  if (pathname.startsWith("/restaurant-profile/")) return "Restaurant Profile";
  if (pathname.startsWith("/restaurants/") || pathname.startsWith("/restaurant/")) return "Restaurant Page";
  return null;
}

export default function SentryRoutePerformance() {
  const location = useLocation();

  useEffect(() => {
    const name = operationForLocation(location.pathname, location.search);
    if (!name) return undefined;

    const span = Sentry.startInactiveSpan({ name, op: "ui.page.load", onlyIfParent: true });
    let firstFrame;
    let secondFrame;
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => span?.end());
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      span?.end();
    };
  }, [location.pathname, location.search]);

  return null;
}
