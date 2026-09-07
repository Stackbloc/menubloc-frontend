/**
 * Plate + fork + knife — Wanna Go / What I Wanna Eat placeholder when no logo or billboard.
 * Matches the Domino's-style empty card on My Menuply Cravings.
 */
export default function WannaGoPlateIcon({ size = 40, color = "#94a3b8", title }) {
  const s = Number(size) || 40;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
    >
      {title ? <title>{title}</title> : null}
      {/* Fork */}
      <path
        d="M10 8v8.5c0 2.2 1.3 3.5 3 3.5V40"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8v6M13 8v6M18 8v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Plate */}
      <circle cx="24" cy="26" r="11" stroke={color} strokeWidth="2.4" />
      <circle cx="24" cy="26" r="4.2" stroke={color} strokeWidth="1.8" />
      {/* Knife */}
      <path
        d="M38 8v20c0 1.8-1.2 3-3 3V40"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 8c2.8 0 4.5 2.2 4.5 4.8S37.8 17.5 35 17.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
