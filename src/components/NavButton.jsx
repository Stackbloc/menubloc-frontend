/* ============================================================
   Shared public-page nav compatibility layer.
   Existing pages still import from this file; the implementation
   now delegates to the shared navigation primitives.
   ============================================================ */

import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import GlobalHeader from "./layout/GlobalHeader.jsx";
import SiteBackButton from "./ui/BackButton.jsx";
import { PillButton } from "./grubbid/GrubbidPrimitives.jsx";

export function HomeButton() {
  const { t } = useLanguage();
  return (
    <PillButton as={Link} to="/" tone="secondary">
      {t("nav.home", "Home")}
    </PillButton>
  );
}

export function BackButton() {
  return <SiteBackButton />;
}

export function PageNav({ back = false }) {
  if (!back) return null;
  return (
    <div className="gb-page-nav" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <BackButton />
      </div>
    </div>
  );
}
