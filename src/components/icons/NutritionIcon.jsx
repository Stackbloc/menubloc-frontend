/** Nutrition (apple), same stroke style as the other menu icons (Andre, 2026-10-24). */
export default function NutritionIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7.5c-1.6-1.3-3.8-1.6-5.5-.6-2.3 1.3-3.1 4.5-2 7.6 1.1 3.1 3.4 6 5.5 6 .8 0 1.3-.4 2-.4s1.2.4 2 .4c2.1 0 4.4-2.9 5.5-6 1.1-3.1.3-6.3-2-7.6-1.7-1-3.9-.7-5.5.6Z" />
      <path d="M12 7.5c0-2.2 1-3.7 3-4.5" />
    </svg>
  );
}
