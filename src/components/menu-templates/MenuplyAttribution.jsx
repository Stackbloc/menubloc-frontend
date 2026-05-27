import { useLanguage } from "../../context/LanguageContext.jsx";
/**
 * Subtle platform attribution — restaurant branding stays primary.
 */

export default function MenuplyAttribution({ label = "Menus by Menuply" }) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 16,
        borderTop: "1px solid rgba(148,163,184,0.15)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "rgba(148,163,184,0.65)",
        textAlign: "center",
      }}
    >
      {label}
    </div>
  );
}
