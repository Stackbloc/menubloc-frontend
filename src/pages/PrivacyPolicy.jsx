import React from "react";
import LegalDocumentPage from "../components/legal/LegalDocumentPage.jsx";
import { PRIVACY_DOCUMENT } from "../content/legal.js";

export default function PrivacyPolicy() {
  return <LegalDocumentPage eyebrow="Privacy" document={PRIVACY_DOCUMENT} />;
}
