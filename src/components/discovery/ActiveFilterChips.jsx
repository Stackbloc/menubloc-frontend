import { FILTER_KEYS, FILTER_LABELS } from "../../lib/filterUtils.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import ChipRail from "../chips/ChipRail.jsx";

const chipBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  border: "none",
};

const activeStyle = {
  ...chipBase,
  background: "#11211a",
  color: "#fff",
};

const inactiveStyle = {
  ...chipBase,
  background: "#fff",
  color: "#11211a",
  border: "1px solid rgba(18,34,28,0.12)",
};

export default function ActiveFilterChips({ filters, onToggle, showAll = false }) {
  const { t } = useLanguage();
  const keys = showAll
    ? FILTER_KEYS
    : FILTER_KEYS.filter((k) => filters[k]);

  if (!keys.length) return null;

  return (
    <ChipRail style={{ marginBottom: 12 }}>
      {keys.map((key) => {
        const active = filters[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            style={active ? activeStyle : inactiveStyle}
          >
            {FILTER_LABELS[key]}
            {active && <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>×</span>}
          </button>
        );
      })}
    </ChipRail>
  );
}
