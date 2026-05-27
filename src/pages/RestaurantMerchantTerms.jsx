import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { MERCHANT_TERMS_DOCUMENT } from "../content/legal.js";

export default function RestaurantMerchantTerms() {
  const { t } = useLanguage();
  return <LegalDocumentPage eyebrow="Restaurant legal" document={MERCHANT_TERMS_DOCUMENT} />;
}
