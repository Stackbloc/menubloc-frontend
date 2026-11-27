import { useContext } from "react";
import { MenuAddressPinContext } from "../menuCatalog/menuHeaderTrailingActionContext.js";

/**
 * Small red Google Maps–style pin in front of a menu address: tap opens Google Maps
 * (Andre 2026-11-27: "use the little google maps icon, not underline"). Hidden next to
 * "Franchise HQ: City, ST", which has no link.
 */
export default function GoogleMapsPinIcon({ size = 14 }) {
  if (!useContext(MenuAddressPinContext)) return null;
  return (
    <svg
      aria-hidden="true"
      data-testid="menu-address-maps-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 13.5 7.5 13.5S19.5 14.6 19.5 9A7.5 7.5 0 0 0 12 1.5Z" fill="#EA4335" />
      <circle cx="12" cy="9" r="2.8" fill="#A50E0E" />
    </svg>
  );
}
