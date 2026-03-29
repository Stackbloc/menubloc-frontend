import { useLanguage } from "../context/LanguageContext.jsx";

export function useT() {
  const { t } = useLanguage();
  return t;
}
