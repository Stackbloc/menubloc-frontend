/** Thin brand-color band across the top of a national chain's menu card (echoes the profile hero). */
export default function BrandMenuStripe({ background }) {
  return (
    <div
      aria-hidden="true"
      data-brand-menu-stripe=""
      style={{ height: 6, background, borderRadius: "12px 12px 0 0" }}
    />
  );
}
