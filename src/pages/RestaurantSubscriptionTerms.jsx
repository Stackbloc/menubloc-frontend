import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { SUBSCRIPTION_TERMS_DOCUMENT } from "../content/legal.js";

export default function RestaurantSubscriptionTerms() {
  const { t } = useLanguage();
  return (
    <LegalDocumentPage
      eyebrow={t("subscriptionTerms.title", "Subscription terms")}
      titleKey="subscriptionTerms.title"
      document={SUBSCRIPTION_TERMS_DOCUMENT}
    />
  );
}
