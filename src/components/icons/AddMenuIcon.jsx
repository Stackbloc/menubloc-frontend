/**
 * Camera in front of a menu card — shared Add Menu affordance.
 */
export default function AddMenuIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.2"
        y="4.2"
        width="11.2"
        height="15.6"
        rx="1.4"
        stroke={color}
        strokeWidth="1.7"
      />
      <path
        d="M5.6 8.1h6.4M5.6 11.1h6.4M5.6 14.1h4.4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="10.4"
        y="10.6"
        width="10.4"
        height="8.6"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.08"
        stroke={color}
        strokeWidth="1.7"
      />
      <circle cx="15.6" cy="14.9" r="2.15" stroke={color} strokeWidth="1.6" />
      <path
        d="M13.2 12.4h2.15l.55-1h2.3l.55 1H20.8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
