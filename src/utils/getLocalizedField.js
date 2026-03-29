function asString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function getNestedTranslation(record, baseField, language) {
  const translations = record?.translations;
  if (!translations || typeof translations !== "object") return "";

  const byField = translations?.[baseField];
  if (byField && typeof byField === "object") {
    const direct = asString(byField?.[language]);
    if (direct) return direct;
  }

  const byLanguage = translations?.[language];
  if (byLanguage && typeof byLanguage === "object") {
    const direct = asString(byLanguage?.[baseField]);
    if (direct) return direct;
  }

  return "";
}

export function getLocalizedField(record, baseField, language = "en", fallback = "") {
  const source = asString(record?.[baseField]);
  if (language === "en") return source || fallback;

  const direct = asString(record?.[`${baseField}_${language}`]);
  if (direct) return direct;

  const nested = getNestedTranslation(record, baseField, language);
  if (nested) return nested;

  return source || fallback;
}
