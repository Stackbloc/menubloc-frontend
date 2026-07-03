export default function ThumbsUpIcon({ size = 15, filled = false, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-1.6l1.3-6.5a2 2 0 0 0-2-2.4H15V5a3 3 0 0 0-3-3l-1 5-3.5 4.5H2Z" />
    </svg>
  );
}
