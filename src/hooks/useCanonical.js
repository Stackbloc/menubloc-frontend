import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CANONICAL_BASE = "https://menuply.com";

export function useCanonical() {
  const location = useLocation();
  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = CANONICAL_BASE + location.pathname;
  }, [location.pathname]);
}
