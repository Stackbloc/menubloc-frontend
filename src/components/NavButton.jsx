/* ============================================================
   Grubbid Canonical Design System Lock
   Public-page navigation styling must inherit from the canonical
   design system. Do not restyle these controls locally without
   explicit approval from Andre.
   ============================================================ */

import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { PillButton } from "./grubbid/GrubbidPrimitives.jsx";

export function HomeButton() {
  const { t } = useLanguage();
  return (
    <PillButton as={Link} to="/" tone="secondary">
      {`← ${t("nav.discovery")}`}
    </PillButton>
  );
}

export function BackButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <PillButton onClick={() => navigate(-1)} tone="secondary">
      {`← ${t("nav.back")}`}
    </PillButton>
  );
}

export function PageNav({ back = false }) {
  const { t } = useLanguage();

  return (
    <div className="gb-page-nav">
      <Link to="/" aria-label={t("nav.brandAria")} className="gb-page-nav__brand">
        Grubbid
      </Link>
      <div className="gb-page-nav__actions">
        {back ? <BackButton /> : <HomeButton />}
      </div>
    </div>
  );
}
