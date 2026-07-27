/**
 * Featured content — strongest “what should you try?” block.
 * Today's special / featured dish / seasonal promotion. Collapses when empty.
 */
export default function ProfileFeaturedContent({
  featuredItem = null,
  featuredText = "",
  todaysSpecial = null,
  dealItems = [],
  isMobile = false,
}) {
  let featured = null;
  if (todaysSpecial?.name) {
    featured = {
      kind: "Today's Special",
      name: String(todaysSpecial.name).trim(),
      description: String(todaysSpecial.description || "").trim(),
      price: String(todaysSpecial.price || "").trim(),
    };
  } else {
    const featuredName = String(featuredItem?.name || featuredText || "").trim();
    if (featuredName) {
      featured = {
        kind: "Signature Dish",
        name: featuredName,
        description: String(featuredItem?.description || "").trim(),
        price: String(featuredItem?.price || "").trim(),
      };
    } else {
      const deal = Array.isArray(dealItems) ? dealItems.find((d) => String(d?.name || "").trim()) : null;
      if (deal) {
        featured = {
          kind: "Featured Promotion",
          name: String(deal.name).trim(),
          description: String(deal.description || "").trim(),
          price: String(deal.price || "").trim(),
        };
      }
    }
  }

  if (!featured) return null;

  return (
    <section
      data-testid="profile-featured-content"
      aria-label={featured.kind}
      style={{
        marginBottom: isMobile ? 18 : 24,
        padding: isMobile ? "20px 16px" : "28px 28px",
        borderRadius: 18,
        background: "linear-gradient(145deg, #14532d 0%, #166534 42%, #1c1917 100%)",
        color: "#fafaf9",
        boxShadow: "0 16px 40px rgba(28, 25, 23, 0.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: "#bbf7d0",
          marginBottom: 10,
        }}
      >
        {featured.kind}
      </div>
      <div
        style={{
          fontSize: isMobile ? 24 : 32,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "#fff",
        }}
      >
        {featured.name}
        {featured.price ? (
          <span
            style={{
              marginLeft: 12,
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              color: "rgba(250,250,249,0.78)",
            }}
          >
            {featured.price}
          </span>
        ) : null}
      </div>
      {featured.description ? (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.6,
            color: "rgba(250,250,249,0.88)",
            maxWidth: 640,
          }}
        >
          {featured.description}
        </p>
      ) : null}
    </section>
  );
}
