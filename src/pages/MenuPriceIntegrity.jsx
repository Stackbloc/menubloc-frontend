import React from "react";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { MENU_PRICE_INTEGRITY_DOCUMENT } from "../content/legal.js";

export default function MenuPriceIntegrity() {
  return <LegalDocumentPage eyebrow="Menu prices" document={MENU_PRICE_INTEGRITY_DOCUMENT} />;
}
